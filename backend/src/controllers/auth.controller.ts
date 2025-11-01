import * as z from "zod";
import type { RequestHandler } from "express";
import UserService from "../service/userService.ts";
import generateAuthorizationTokenAndSetCookies from "../utils/generateAuthorizationTokenAndSetCookies.ts";
import { sendEmailVerificationCode, sendPasswordResetToken } from "../utils/sendEmail.ts";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { FileService } from "../service/fileService.ts";
import { queueVerificationEmail } from "../queues/email.queue.ts";
// import { queueVerificationEmail } from '../queues/email.queue.js';

const userService = new UserService();
const prisma = new PrismaClient();

export const userSchema = z
    .object({
        name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must not exceed 50 characters"),
        email: z.string().email("Invalid email address"),
        phone: z
            .string()
            .min(7, "Phone number is too short")
            .max(15, "Phone number is too long")
            .regex(/^[0-9]+$/, "Phone number must contain only digits"),
        picture: z
            .object({
                filename: z.string(),
                path: z.string(),
                mimetype: z.enum(["image/jpeg", "image/png", "image/jpg", "image/webp"]),
                size: z.number().max(2 * 1024 * 1024, "File size must not exceed 2MB"),
            })
            .nullable()
            .optional(),
        picture_url: z.string().nullable().optional(),
        type: z.enum(["CUSTOMER", "ADMIN", "VENDOR"], {
            errorMap: () => ({ message: "Type must be CUSTOMER, ADMIN, or VENDOR" })
        }),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(30, "Password must not exceed 30 characters")
            .regex(/^[a-zA-Z0-9!@#$%^&*()_\-+=]{8,30}$/, "Password must contain only letters and numbers"),
        repeat_password: z
            .string()
            .min(8, "Confirm password must be at least 8 characters")
            .max(30, "Confirm password must not exceed 30 characters")
            .regex(/^[a-zA-Z0-9!@#$%^&*()_\-+=]{8,30}$/, "Confirm password must contain only letters and numbers"),
        vendor_name: z.string().optional(),
        vendor_address: z.string().optional(),
        state: z.string().optional(),
    })
    .refine((data) => data.password === data.repeat_password, {
        message: "Passwords do not match",
        path: ["repeat_password"],
    })
    .superRefine((data, ctx) => {
        if (data.type === "VENDOR") {
            if (!data.vendor_name || data.vendor_name.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["vendor_name"],
                    message: "Vendor name is required for vendors",
                });
            }
            if (!data.vendor_address || data.vendor_address.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["vendor_address"],
                    message: "Vendor address is required for vendors",
                });
            }
            if (!data.state || data.state.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["state"],
                    message: "State is required for vendors",
                });
            }
        }
    });

export const register: RequestHandler = async (req, res, next) => {
    const uploadedFile = (req as any).uploadedFile;
    const uploadedFilePath = uploadedFile?.path;

    try {
        const bodyData = {
            ...req.body,
            picture_url: uploadedFile?.path || null,
            ...(uploadedFile && {
                picture: {
                    filename: uploadedFile.filename || uploadedFile.originalname,
                    path: uploadedFile.path,
                    mimetype: uploadedFile.mimetype,
                    size: uploadedFile.size,
                }
            })
        };

        const result = userSchema.safeParse(bodyData);
        if (!result.success) {
            // Rollback uploaded file if validation fails
            if (uploadedFilePath) {
                await FileService.rollback(uploadedFilePath);
            }

            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const { vendor_name, vendor_address, state, ...cleanData } = result.data;

        // 🧩 Use a transaction so user/vendor creation is atomic
        const { user, emailVerificationCode } = await prisma.$transaction(async (tx) => {
            // Create user first
            const { user, emailVerificationCode } = await userService.createUser(cleanData, tx);

            // If user is a vendor, create vendor record linked to user
            if (result.data.type === "VENDOR" && (vendor_name || vendor_address || state)) {
                await tx.vendor.create({
                    data: {
                        name: vendor_name || "",
                        address: vendor_address || "",
                        stateId: state ? Number(state) : null,
                        userId: user.id,
                    },
                });
            }

            return { user, emailVerificationCode };
        });

        generateAuthorizationTokenAndSetCookies(res, user.id);

        // queue email to send email verification token
        await queueVerificationEmail(user.email, parseInt(emailVerificationCode));
        // await sendEmailVerificationCode(user.email, parseInt(emailVerificationCode));

        res.status(201).json({ user, message: "User registered successfully" });
    } catch (error) {
        if (uploadedFilePath) {
            await FileService.rollback(uploadedFilePath);
        }

        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
};

export const login: RequestHandler = async (req, res, next) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string(),
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

        generateAuthorizationTokenAndSetCookies(res, user.id);

        const allowedFields = [
            'id',
            'name',
            'email',
            'emailVerifiedAt',
            'phone',
            'phoneVerifiedAt',
            'type',
            'pictureUrl',
            'createdAt'
        ];

        const filteredUser = Object.fromEntries(
            Object.entries(user).filter(([key]) => allowedFields.includes(key))
        );

        res.status(200).json({ user: filteredUser, message: "User logged in successfully" });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "Server Error" });
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
                expiresAt: passwordResetCodeExpiresAt
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
            res.status(500).json({ message: "Server Error" });
        }
    }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
    const schema = z.object({
        email: z.string().email(),
        resetAuthorizationCode: z.string().length(6).regex(/^[0-9]+$/),
        newPassword: z.string().min(8).max(30).regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/, {
            message: "Password may include letters, numbers, and special characters",
        }),
        repeatNewPassword: z.string().min(8).max(30).regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/, {
            message: "Password may include letters, numbers, and special characters",
        }),
    }).refine((data) => data.newPassword === data.repeatNewPassword, {
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
            return res.status(404).json({ message: "No user with the provided details match our records" });
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
            res.status(500).json({ message: "Server Error" });
        }
    }
};

export const resendEmailVerificationCode: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'unauthorized' })
        }
        const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const emailVerificationCodeExpiresAt = new Date(Date.now() + 1000 * 60 * 15);

        await queueVerificationEmail(user.email, parseInt(emailVerificationCode));
        // await sendEmailVerificationCode(user.email, parseInt(emailVerificationCode));

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                emailVerificationCode,
                emailVerificationCodeExpiresAt
            }
        })
        res.status(200).json({ message: 'Email verification code sent successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
}

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
            res.status(500).json({ message: "Server Error" });
        }
    }
};

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw { message: "User unauthorized", status: 401 };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerifiedAt: true,
                phone: true,
                phoneVerifiedAt: true,
                type: true,
                pictureUrl: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw { message: "User unauthorized", status: 401 };
        }

        return res.status(200).json({
            message: "User retrieved successfully",
            user,
        });
    } catch (error) {
        // Handle known errors gracefully
        if (error instanceof Error) {
            return res.status(500).json({ message: error.message });
        }

        // Pass through custom errors with a status code
        if (
            typeof error === "object" &&
            error !== null &&
            "status" in (error as Record<string, any>)
        ) {
            return next(error);
        }

        // Catch-all for any unexpected errors
        return res.status(500).json({ message: "Server error" });
    }
};