import express from "express";
import type { CorsOptions } from 'cors';
import helmet from "helmet";
import cors from "cors";
import authRoute from './routers/auth.route.ts';
import errorHandler from "./middleware/errorHandler.middleware.ts";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import routeNotFoundErrorHandler from "./middleware/routeNotFound.middleware.ts";
import { rollbackOnError } from "./service/fileService.ts";
import path from "path";
import { fileURLToPath } from "url";
import departmentRoute from './routers/department.route.ts';
import categoryRoute from './routers/category.route.ts'
import './workers/index.worker.ts';

dotenv.config();


const PORT = process.env.PORT || 5001;

const app = express();

app.use(express.json());
// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// roll back file(s) upload is any error happens
app.use(rollbackOnError());


const corsConfig: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = ["https://yourapp.com", "https://www.yourapp.com"];

        if (
            process.env.NODE_ENV === "development" &&
            ["http://localhost:5173", "http://127.0.0.1:5173"].includes(origin)
        ) {
            return callback(null, true);
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
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
app.use(cors(corsConfig));

// Serve the /uploads folder publicly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve static files from /public
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));


app.use('/api/auth', authRoute);
app.use('/api/departments', departmentRoute);
app.use('/api/categories', categoryRoute);


// Error Handling Middlewares
app.use(routeNotFoundErrorHandler);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
