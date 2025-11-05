import type { RequestHandler } from "express";
import { Role } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Middleware to restrict access to admin users only.
 */
export const requireVendorAuthorization: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized: No user found" });
        }

        if (user.type !== Role.ADMIN && user.type !== Role.VENDOR) {
            return res.status(403).json({ message: "Forbidden: Vendor only" });
        }

        const vendorId = Number(req.params.vendorId);
        if(isNaN(vendorId))
            return res.status(400).json({ message: "vendor not found" });

        const vendor = await prisma.vendor.findUnique({
            where: {
                id: vendorId,
                userId: user.id
            }
        })
        req.vendor = vendor;

        next();
    } catch (error) {
        console.error("Error in requireVendorAuthorization middleware:", error);
        next(error);
    }
};
