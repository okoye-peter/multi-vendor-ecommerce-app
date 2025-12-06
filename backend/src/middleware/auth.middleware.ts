import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import prisma from "../libs/prisma.js";
import type { RequestHandler } from "express";

export const isAuthenticated: RequestHandler = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            throw { message: "Unauthorized - No token provided", status: 401 };
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload & { id: number };
        if (!decoded) {
            throw { message: "Unauthorized - Invalid token provided", status: 401 };
        }
    
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.clearCookie('token')
            throw { message: "Unauthorized - User not found", status: 401 };
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in protectRoute middleware", error);

        // Pass the error to your errorHandler middleware
        next(error);
    }
};
