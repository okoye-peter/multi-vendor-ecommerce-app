import type { RequestHandler } from "express";

const routeNotFoundErrorHandler: RequestHandler = (req, res, next) => {
    res.status(404).json({ message: "Route not found" });
}

export default routeNotFoundErrorHandler;