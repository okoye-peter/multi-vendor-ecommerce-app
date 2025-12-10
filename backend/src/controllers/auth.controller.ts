import * as z from "zod";
import type { RequestHandler } from "express";
import UserService from "../service/userService.js";
import generateAuthorizationTokenAndSetCookies from "../utils/generateAuthorizationTokenAndSetCookies.js";
import { sendPasswordResetToken } from "../utils/sendEmail.js";
import prisma from "../libs/prisma.js";
import bcrypt from "bcryptjs";
import { queuePasswordResetTokenEmail, queueVerificationEmail } from "../queues/email.queue.js";
import { FileService, type RequestWithUploadedFile } from "../middleware/fileUpload.js";

const userService = new UserService();

// ✅ File validation schema
const fileSchema = z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.enum([
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "image/gif",
    ], {
        message: "Only JPEG, PNG, JPG, WEBP, and GIF images are allowed"
    }),
    size: z.number()
        .max(1.5 * 1024 * 1024, "File size must not exceed 1.5MB")
        .positive("File size must be greater than 0"),
    buffer: z.instanceof(Buffer),
}).optional();

export const userSchema = z
    .object({
        name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must not exceed 50 characters"),
        email: z.email("Invalid email address"),
        phone: z
            .string()
            .min(7, "Phone number is too short")
            .max(15, "Phone number is too long")
            .regex(/^[0-9]+$/, "Phone number must contain only digits"),
        // ✅ Cloudinary URL (stored in database)
        picture_url: z.url("Invalid picture URL").nullable().optional(),

        // ✅ File validation (not stored in DB, just validated)
        picture: fileSchema,

        type: z.enum(["CUSTOMER", "ADMIN", "VENDOR"]).refine(
            val => ["CUSTOMER", "ADMIN", "VENDOR"].includes(val),
            { message: "Type must be CUSTOMER, ADMIN, or VENDOR" }
        ),
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
    // ✅ Access uploaded file info (added by handleSingleFileUpload middleware)
    const reqWithUpload = req as RequestWithUploadedFile;
    const cloudinaryUpload = reqWithUpload.cloudinaryUpload;

    try {
        const bodyData = {
            ...req.body,
            picture_url: cloudinaryUpload?.url || null,
            picture: cloudinaryUpload?.file || undefined,
        };

        // ✅ Validate with Zod (validates both body data and uploaded file)
        const result = userSchema.safeParse(bodyData);

        if (!result.success) {
            // Rollback uploaded file if validation fails
            if (cloudinaryUpload?.url) {
                await FileService.rollback(cloudinaryUpload.url);
            }

            const { fieldErrors, formErrors } = result.error.flatten();

            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        // ✅ Remove picture from data before saving to DB (we only save picture_url)
        const { vendor_name, vendor_address, state, picture, ...cleanData } = result.data;

        // 🧩 Use a transaction so user/vendor creation is atomic
        const { user, emailVerificationCode } = await prisma.$transaction(async (tx) => {
            // Create user first (cleanData includes picture_url but not picture)
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

        // Queue email to send email verification token
        await queueVerificationEmail(user.email, parseInt(emailVerificationCode));

        res.status(201).json({
            user,
            message: "User registered successfully"
        });
    } catch (error) {
        // ✅ Rollback from Cloudinary on error
        if (cloudinaryUpload?.url) {
            await FileService.rollback(cloudinaryUpload.url);
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
        email: z.email(),
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
        email: z.email(),
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

        await queuePasswordResetTokenEmail(email, parseInt(passwordResetCode));

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
        email: z.email(),
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

// ✅ Update user profile with new picture
// export const updateProfile: RequestHandler = async (req, res, next) => {
//     const uploadedFile = req.uploadedFile;
//     const newPictureUrl = uploadedFile?.path;

//     try {
//         const userId = req.user?.id; // Assuming you have auth middleware

//         if (!userId) {
//             return res.status(401).json({ message: "Unauthorized" });
//         }

//         // Get current user to check if they have an existing picture
//         const currentUser = await prisma.user.findUnique({
//             where: { id: userId },
//             select: { picture_url: true, publicId: true }
//         });

//         const newPublicId = newPictureUrl ? extractPublicIdFromUrl(newPictureUrl) : null;

//         const bodyData = {
//             ...req.body,
//             ...(newPictureUrl && {
//                 picture_url: newPictureUrl,
//                 publicId: newPublicId,
//             })
//         };

//         // Validate and update user
//         const updatedUser = await prisma.user.update({
//             where: { id: userId },
//             data: {
//                 name: bodyData.name,
//                 phone: bodyData.phone,
//                 ...(newPictureUrl && {
//                     picture_url: newPictureUrl,
//                     publicId: newPublicId,
//                 })
//             }
//         });

//         // ✅ Delete old picture from Cloudinary if exists and new picture uploaded
//         if (newPictureUrl && currentUser?.publicId) {
//             await FileService.deleteSingle(currentUser.publicId);
//         }

//         res.status(200).json({
//             user: updatedUser,
//             message: "Profile updated successfully"
//         });
//     } catch (error) {
//         // Rollback new picture on error
//         if (newPictureUrl) {
//             const publicId = extractPublicIdFromUrl(newPictureUrl);
//             if (publicId) {
//                 await FileService.rollback(publicId);
//             }
//         }

//         if (error instanceof Error) {
//             res.status(500).json({ message: error.message });
//         } else {
//             res.status(500).json({ message: "Server Error" });
//         }
//     }
// };

// ✅ Delete user account (and profile picture)
// export const deleteAccount: RequestHandler = async (req, res, next) => {
//     try {
//         const userId = req.user?.id;

//         if (!userId) {
//             return res.status(401).json({ message: "Unauthorized" });
//         }

//         // Get user to check if they have a profile picture
//         const user = await prisma.user.findUnique({
//             where: { id: userId },
//             select: { publicId: true }
//         });

//         // Delete profile picture from Cloudinary if exists
//         if (user?.publicId) {
//             await FileService.deleteSingle(user.publicId);
//         }

//         // Delete user from database
//         await prisma.user.delete({
//             where: { id: userId }
//         });

//         res.status(200).json({ message: "Account deleted successfully" });
//     } catch (error) {
//         if (error instanceof Error) {
//             res.status(500).json({ message: error.message });
//         } else {
//             res.status(500).json({ message: "Server Error" });
//         }
//     }
// };
