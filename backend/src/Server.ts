import express from "express";
import type { CorsOptions } from 'cors';
import helmet from "helmet";
import cors from "cors";
import authRoute from './routers/auth.route.js';
import errorHandler from "./middleware/errorHandler.middleware.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import routeNotFoundErrorHandler from "./middleware/routeNotFound.middleware.js";
import path from "path";
import { fileURLToPath } from "url";
import departmentRoute from './routers/department.route.js';
import categoryRoute from './routers/category.route.js'
import stateRoute from './routers/state.route.js'
import './workers/index.worker.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './queues/email.queue.js';
import productRoute from './routers/product.route.js'
import vendorRoutes from './routers/vendor.route.js';
import { isAuthenticated } from "./middleware/auth.middleware.js";
import { express as useragent } from 'express-useragent';
import ErrorRoutes from './routers/errorLogs.route.js'
import WishlistRoutes from './routers/wishlist.route.js'
import CartRoutes from './routers/cart.route.js'
import orderRoutes from './routers/orders.route.js'
import { placeOrder } from "./controllers/orders.controller.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

const app = express();
app.use(express.json());


// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
            origin && ["http://localhost:5173", "http://127.0.0.1:5173", 'http://localhost:5004'].includes(origin)
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

app.use('/api/auth', authRoute);
app.use('/api/locations', stateRoute);
app.use('/api/departments', departmentRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/products', productRoute);
app.use('/api/vendors', isAuthenticated, vendorRoutes);
app.use('/api/wishlists', isAuthenticated, WishlistRoutes);
app.use('/api/carts', isAuthenticated, CartRoutes);
app.use('/api/orders', isAuthenticated, orderRoutes);
app.post('/api/payment/webhooks', placeOrder);
app.use('/errors', ErrorRoutes);


app.use('/admin/queues', serverAdapter.getRouter());
// Error Handling Middlewares
app.use(routeNotFoundErrorHandler);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});



// # Search globally
// GET /api/products?search=laptop

// # Filter by category name
// GET /api/products?category.name=Electronics

// # Filter by department name
// GET /api/products?department.name=Tech

// # Filter by vendor name
// GET /api/products?vendor.name=Apple

// # Multiple filters (AND logic)
// GET /api/products?category.name=Electronics&status=active&price[gte]=100

// # Sort by nested field
// GET /api/products?sortBy=category.name&sortOrder=asc

// # Complex query
// GET /api/products?search=phone&category.name=Electronics&price[lte]=1000&sortBy=price&sortOrder=desc&page=1&limit=20

// # Search orders
// GET /api/orders?search=john

// # Filter by user name
// GET /api/orders?user.name=John Doe

// # Filter by vendor
// GET /api/orders?vendor.name=Amazon

// # Filter by status and date
// GET /api/orders?status=completed&createdAt[gte]=2024-01-01

// # Multiple filters
// GET /api/orders?user.email=john@example.com&status=pending&sortBy=createdAt&sortOrder=desc

// # Search users
// GET /api/users?search=john

// # Filter by role
// GET /api/users?role=admin

// # Filter by vendor
// GET /api/users?vendor.name=TechCorp

// # Search vendors
// GET /api/vendors?search=tech

// # Filter by user email
// GET /api/vendors?user.email=admin@example.com