import type { ErrorRequestHandler } from 'express';
import logger from '../libs/logger.js';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.log('errorHandler', err);

    const status = err.status || (typeof err === "object" && "status" in err ? (err as any).status : null);

    // Log to file if status doesn't exist or is not 200/400
    if (!status || (status !== 200 && status !== 400)) {
        logger.error({
            message: err.message || 'Unknown error',
            status: status || 500,
            stack: err.stack,
            method: req.method,
            url: req.url,
            endpoint: req.route?.path || req.path,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
    }

    if (status) {
        return res.status(status).json({ message: err.message });
    } else if (typeof err === "object" && "status" in err && "message" in err) {
        return res.status((err as any).status).json({ message: (err as any).message });
    } else {
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export default errorHandler;