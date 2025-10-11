import express from "express";
import type { CorsOptions } from 'cors';
import helmet from "helmet";
import cors from "cors";
import authRoute from './routers/auth.route.ts';
import errorHandler from "./middleware/errorHandler.middleware.ts";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import routeNotFoundErrorHandler from "./middleware/routeNotFound.middleware.ts";

dotenv.config();


const PORT = process.env.PORT || 5001;

const app = express();

app.use(express.json());
app.use(cookieParser());

const corsConfig: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = ["https://yourapp.com", "https://www.yourapp.com"];

        if (process.env.NODE_ENV === "development") {
            allowedOrigins.push("*");
        }

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};

// server.ts
app.use(helmet());
app.use(cors(corsConfig));

app.use('/api/auth', authRoute);


// Error Handling Middlewares
app.use(routeNotFoundErrorHandler);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
