import type { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.log('errorHandler', err);
    
    if (err.status) {
        return res.status(err.status).json({ message: err.message });
    } else if (typeof err === "object" && "status" in err && "message" in err) {
        return res.status((err as any).status).json({ message: (err as any).message });
    } else {
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export default errorHandler;