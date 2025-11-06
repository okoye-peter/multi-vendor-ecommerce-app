import express from 'express';
import { handleSingleFileUpload, uploadSingleFile } from '../service/fileService.ts';
import { isAuthenticated } from '../middleware/auth.middleware.ts';
import { requireVendorAuthorization } from '../middleware/vendorOnly.middleware.ts';
import { createProduct, deleteProduct, getProduct, refillProduct, updateProduct } from '../controllers/product.controller.ts';

const router = express.Router();

router.post('/products', uploadSingleFile('images'), handleSingleFileUpload('product_images'), isAuthenticated, requireVendorAuthorization, createProduct);
router.put('/products/:productId', uploadSingleFile('images'), handleSingleFileUpload('product_images'), isAuthenticated, requireVendorAuthorization, updateProduct);
router.get('/products/:productId', isAuthenticated, requireVendorAuthorization, getProduct);
router.delete('/products/:productId', isAuthenticated, requireVendorAuthorization, deleteProduct);
router.post('/products/:productId/refill', isAuthenticated, requireVendorAuthorization, refillProduct);

export default router;