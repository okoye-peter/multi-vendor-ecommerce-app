// services/userService.js
import { Prisma } from "@prisma/client";
import prisma from "../libs/prisma.ts";
import { userSchema } from "../controllers/auth.controller.ts";
import type z from "zod";
import bcrypt from "bcryptjs";
import { FileService, type UploadedFile } from "../service/fileService.ts";


type UserData = z.infer<typeof userSchema>;

export default class UserService {
    async getAllUsers() {
        return prisma.user.findMany();
    }

    async getUserById(id: number) {
        const user = await prisma.user.findUnique({ where: { id: Number(id) } });
        if (!user) throw new Error("User not found");
        return user;
    }

    async createUser(data: UserData, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;

        try {
            // Check for existing user by email or phone
            const existingUser = await client.user.findFirst({
                where: {
                    OR: [{ email: data.email }, { phone: data.phone }],
                },
            });

            if (existingUser) {
                if (existingUser.email === data.email) {
                    throw { status: 400, message: "User with this email already exists" };
                }
                if (existingUser.phone === data.phone) {
                    throw { status: 400, message: "User with this phone number already exists" };
                }
            }


            // Hash password before saving
            const hashedPassword = await bcrypt.hash(data.password, 10);
            data.password = hashedPassword;

            // generate email verification code
            const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const emailVerificationCodeExpiresAt = new Date(Date.now() + 1000 * 60 * 15);
            const { repeat_password, picture, picture_url, ...cleanData } = data; // Exclude repeat_password from being saved

            // generate phone verification code
            const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const phoneVerificationCodeExpiresAt = new Date(Date.now() + 1000 * 60 * 15);

            const user = await client.user.create({
                data: {
                    ...cleanData,
                    password: hashedPassword,
                    emailVerificationCode,
                    emailVerificationCodeExpiresAt,
                    phoneVerificationCode,
                    phoneVerificationCodeExpiresAt,
                    pictureUrl: data.picture_url || null 
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    type: true,
                    pictureUrl: true,
                    createdAt: true,
                },
            });
            return { user, emailVerificationCode }

        } catch (err) {
            if (data.picture_url) {
                await FileService.deleteSingle(data.picture_url).catch((deleteErr) => {
                    console.error('Failed to rollback uploaded picture:', deleteErr);
                });
            }
            if (err instanceof Error) {
                throw { status: 500, message: err.message };
            } else if (typeof err === "object" && err !== null && "status" in (err as Record<string, any>)) {
                throw err;
            } else {
                // ✅ Fallback
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }

    async deleteUser(id) {
        return prisma.user.delete({ where: { id: Number(id) } });
    }

    async verifyEmail(userId: number, code: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw { status: 404, message: "User not found" };
        if (user.emailVerifiedAt) throw { status: 400, message: "Email already verified" };
        if (user.emailVerificationCode !== code) throw { status: 400, message: "Invalid verification code" };
        if (user.emailVerificationCodeExpiresAt && user.emailVerificationCodeExpiresAt < new Date()) {
            throw { status: 400, message: "Verification code has expired" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerifiedAt: new Date(),
                emailVerificationCodeExpiresAt: null,
                emailVerificationCode: null,
            },
        });
    }
}
