import * as z from "zod";
import type { RequestHandler } from "express";
import UserService from "../service/userService.ts";
import generateAuthorizationTokenAndSetCookies from "../utils/generateAuthorizationTokenAndSetCookies.ts";
import { sendEmailVerificationCode, sendPasswordResetToken } from "../utils/sendEmail.ts";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const userService = new UserService();
const prisma = new PrismaClient();

export const userSchema = z
    .object({
        name: z.string().min(3).max(50),
        email: z.string().email(),
        phone: z
            .string()
            .min(7)
            .max(15)
            .regex(/^[0-9]+$/),
        picture: z
            .file()
            .mime(["image/jpeg", "image/png", "image/jpg", "image/webp"])
            .max(2 * 1024 * 1024)
            .optional(),
        type: z.enum(["CUSTOMER", "ADMIN", "VENDOR"]),
        password: z
            .string()
            .min(8)
            .max(30)
            .regex(/^[a-zA-Z0-9]{8,30}$/),
        repeat_password: z
            .string()
            .min(8)
            .max(30)
            .regex(/^[a-zA-Z0-9]{8,30}$/),
        vendor_name: z.string().optional(),
        vendor_address: z.string().optional(),
        state: z.string().optional(),
    })
    .refine((data) => data.password === data.repeat_password, {
        message: "Passwords do not match",
        path: ["repeat_password"],
    })
    .refine((data) => data.password === data.repeat_password, {
        message: "Passwords do not match",
        path: ["repeat_password"],
    })
    .superRefine((data, ctx) => {
        if (data.type === "VENDOR") {
            if (!data.vendor_name) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["vendor_name"],
                    message: "Vendor name is required for vendors",
                });
            }
            if (!data.vendor_address) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["vendor_address"],
                    message: "Vendor address is required for vendors",
                });
            }
            if (!data.state) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["state"],
                    message: "State is required for vendors",
                });
            }
        }
    });

export const register: RequestHandler = async (req, res, next) => {
    try {

        const result = userSchema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const { user, emailVerificationCode } = await userService.createUser(result.data);

        const token = generateAuthorizationTokenAndSetCookies(res, user.id);

        await sendEmailVerificationCode(user.email, parseInt(emailVerificationCode));

        res.status(201).json({ result: user, message: "User registered successfully", token });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "An unexpected error occurred" });
        }
    }
};

export const login: RequestHandler = async (req, res, next) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8).max(30).regex(/^[a-zA-Z0-9]{8,30}$/),
    });
    try {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();
            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );
            const errors = hasFieldErrors ? fieldErrors : formErrors;
            return next({ status: 400, message: errors });
        }

        const user = await prisma.user.findUnique({ where: { email: result.data.email } });
        if (!user) throw { status: 401, message: "email or password is incorrect" };
        const isMatch = await bcrypt.compare(result.data.password, user.password);
        if (!isMatch) throw { status: 401, message: "email or password is incorrect" };

        const token = generateAuthorizationTokenAndSetCookies(res, user.id);

        res.status(200).json({ result: user, message: "User logged in successfully", token });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "An unexpected error occurred" });
        }
    }
};

export const logout: RequestHandler = async (req, res, next) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
}

export const sendPasswordResetCode: RequestHandler = async (req, res, next) => {
    const schema = z.object({
        email: z.string().email(),
    });
    try {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();
            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );
            const errors = hasFieldErrors ? fieldErrors : formErrors;
            return next({ status: 400, message: errors });
        }

        const { email } = result.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res
                .status(200)
                .json({ message: "If the email exists, a reset code has been sent." });
        }

        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });

        const passwordResetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const passwordResetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await sendPasswordResetToken(email, parseInt(passwordResetCode));

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: passwordResetCode,
                expiresAt: passwordResetCodeExpiresAt,
            },
        });

        return res.status(200).json({
            message: "If the email exists, a reset code has been sent.",
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "An unexpected error occurred" });
        }
    }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
    const schema = z.object({
        email: z.string().email(),
        resetAuthorizationCode: z.string().length(6).regex(/^[0-9]+$/),
        newPassword: z.string().min(8).max(30).regex(/^[a-zA-Z0-9]{8,30}$/),
        repeat_newPassword: z.string().min(8).max(30).regex(/^[a-zA-Z0-9]{8,30}$/),
    }).refine((data) => data.newPassword === data.repeat_newPassword, {
        message: "Passwords do not match",
    })

    try {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();
            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );
            const errors = hasFieldErrors ? fieldErrors : formErrors;
            return next({ status: 400, message: errors });
        }

        const { email, resetAuthorizationCode, newPassword } = result.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const validResetToken = await prisma.passwordResetToken.findFirst({
            where: {
                userId: user.id,
                token: resetAuthorizationCode,
                expiresAt: { gt: new Date() },
            },
        });
        if (!validResetToken) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "An unexpected error occurred" });
        }
    }
 };

export const verifyEmail: RequestHandler = async (req, res, next) => {
    const schema = z.object({
        verificationCode: z.string().length(6).regex(/^[0-9]+$/),
    });

    try {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();
            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );
            const errors = hasFieldErrors ? fieldErrors : formErrors;
            return next({ status: 400, message: errors });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized - User not found in request" });
        }

        await userService.verifyEmail(userId, result.data.verificationCode);

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "An unexpected error occurred" });
        }
    }
};
