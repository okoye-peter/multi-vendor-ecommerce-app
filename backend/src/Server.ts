import express from "express";
import type { CorsOptions } from 'cors';
import helmet from "helmet";
import cors from "cors";
import authRoute from './routers/auth.route.ts';
import errorHandler from "./middleware/errorHandler.middleware.ts";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import routeNotFoundErrorHandler from "./middleware/routeNotFound.middleware.ts";
import { rollbackOnError, serveResponsiveImages } from "./service/fileService.ts";
import path from "path";
import { fileURLToPath } from "url";
import departmentRoute from './routers/department.route.ts';
import categoryRoute from './routers/category.route.ts'
import stateRoute from './routers/state.route.ts'
import './workers/index.worker.ts';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './queues/email.queue.ts';
import productRoute from './routers/product.route.ts'
import vendorRoutes from './routers/vendor.route.ts';
import { isAuthenticated } from "./middleware/auth.middleware.ts";
import { express as useragent } from 'express-useragent';


dotenv.config();

const PORT = process.env.PORT || 5001;

const app = express();
app.use(express.json());


// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// roll back file(s) upload is any error happens
app.use(rollbackOnError());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues'); // Path to access the UI
createBullBoard({
    queues: [
        // Add all your queues here
        new BullMQAdapter(emailQueue),
    ],
    serverAdapter: serverAdapter,
});


const corsConfig: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = ["https://yourapp.com", "https://www.yourapp.com"];

        if (
            process.env.NODE_ENV === "development" &&
            origin && ["http://localhost:5173", "http://127.0.0.1:5173"].includes(origin)
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
app.use(useragent());

// Serve the /uploads folder publicly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve static files from /public
app.use(express.static(path.join(__dirname, "../public")));
// "original", "thumb", "small", "medium", "large", "xlarge"
// image_url?size=large for images
app.use('/uploads', serveResponsiveImages(), express.static(path.join(__dirname, '../public/uploads')));
// app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.use('/api/auth', authRoute);
app.use('/api/locations', stateRoute);
app.use('/api/departments', departmentRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/products', productRoute);
app.use('/api/vendors', isAuthenticated, vendorRoutes);


app.use('/admin/queues', serverAdapter.getRouter());
// Error Handling Middlewares
app.use(routeNotFoundErrorHandler);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
