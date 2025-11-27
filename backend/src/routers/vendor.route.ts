import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.ts';
import { requireVendorAuthorization } from '../middleware/vendorOnly.middleware.ts';
import { createProduct, deleteProduct, getProduct, getProductBatches, refillProduct, toggleProductIsPublished, updateProduct } from '../controllers/product.controller.ts';
import { getAuthUserVendors, getVendorProducts } from '../controllers/vendor.controller.ts';
import { handleMultipleFilesUpload, rollbackOnError, uploadMultipleFiles } from '../middleware/fileUpload.ts';

const router = express.Router();
router.get('/', getAuthUserVendors);
router.get('/products', isAuthenticated, getVendorProducts);
router.post('/:vendorId/products', uploadMultipleFiles("images[]", 4), handleMultipleFilesUpload("products"), rollbackOnError(), requireVendorAuthorization, createProduct);
router.put('/:vendorId/products/:productId', uploadMultipleFiles("images", 4), handleMultipleFilesUpload("products"), rollbackOnError(), isAuthenticated, requireVendorAuthorization, updateProduct);
router.put('/:vendorId/products/:productId/publish', isAuthenticated, requireVendorAuthorization, toggleProductIsPublished);
router.get('/:vendorId/products/:productId', isAuthenticated, requireVendorAuthorization, getProduct);
router.get('/:vendorId/products/:productId/batches', isAuthenticated, requireVendorAuthorization, getProductBatches);
router.delete('/:vendorId/products/:productId', isAuthenticated, requireVendorAuthorization, deleteProduct);
router.post('/:vendorId/products/:productId/refill', isAuthenticated, requireVendorAuthorization, refillProduct);

export default router;