import type { Response } from "express"
import jwt from "jsonwebtoken";

const generateAuthorizationTokenAndSetCookies = (res: Response, userId:number) => {
    if (!process.env.JWT_SECRET_KEY) {
        throw new Error("JWT_SECRET_KEY is not defined in environment variables");
    }
    // Implementation for generating token and setting cookies
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
        expiresIn: "14d",
    });


    res.cookie("token", token, {
        httpOnly: true, // prevent XSS attacks
        secure: process.env.NODE_ENV === "production",
        maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // prevent CSRF attacks
    });

    return token;
}

export default generateAuthorizationTokenAndSetCookies; 