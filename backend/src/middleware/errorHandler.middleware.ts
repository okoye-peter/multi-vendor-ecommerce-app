import type { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err.status) {
        return res.status(err.status).json({ message: err.message });
    } else {
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export default errorHandler;