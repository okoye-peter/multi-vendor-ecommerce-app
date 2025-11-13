import type { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAuthUserVendors:RequestHandler = async (req, res, next) =>  {
    try {
        const user = req.user;

        const vendors = await prisma.vendor.findMany({
            where: {
                userId: user.id
            },
            include: {
                state: true
            }
        });

        return res.status(200).json(vendors)
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}