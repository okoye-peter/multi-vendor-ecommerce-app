import type { RequestHandler } from "express";

export const guestOnly: RequestHandler = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (token) {
            return res.status(400).json({ message: "You are already logged in" });
        }
        next();
    } catch (error) {
        console.log("Error in guestOnly middleware", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}