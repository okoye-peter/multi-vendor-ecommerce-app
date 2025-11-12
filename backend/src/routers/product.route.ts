import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.ts';
import { requireVendorAuthorization } from '../middleware/vendorOnly.middleware.ts';
import { getVendorProducts } from '../controllers/product.controller.ts';


const router = express.Router()

router.get('/vendors', isAuthenticated, getVendorProducts);

export default router;