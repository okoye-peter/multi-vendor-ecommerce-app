import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "express";

const prisma = new PrismaClient();

export const isAuthenticated: RequestHandler = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token)
            return res.status(401).json({ message: "Unauthorized - No token provided" })

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload & { id: number };
        if (!decoded)
            return res.status(401).json({ message: "Unauthorized - Invalid token provided" })

        const user = await prisma.user.findUnique({ where: { id: (decoded as { id: number }).id } });
        if (!user)
            return res.status(401).json({ message: "Unauthorized - User not found" })
        req.user = user;
        next();
    } catch (error) {
        console.log("Error in protectRoute middleware", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}