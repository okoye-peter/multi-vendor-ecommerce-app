import type { RequestHandler } from "express";
import { Role } from "@prisma/client";

/**
 * Middleware to restrict access to admin users only.
 */
export const requireAdminAuthorization: RequestHandler = (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized: No user found" });
        }

        if (user.type !== Role.ADMIN) {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }

        next();
    } catch (error) {
        console.error("Error in requireAdminAuthorization middleware:", error);
        next(error);
    }
};
