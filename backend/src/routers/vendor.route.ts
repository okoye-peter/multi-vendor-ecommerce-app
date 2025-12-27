import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { requireVendorAuthorization } from '../middleware/vendorOnly.middleware.js';
import { createProduct, deleteProduct, downloadProductSalesReport, getProduct, getProductBatches, getProductOrders, refillProduct, toggleProductBatchPublicity, toggleProductIsPublished, updateProduct, updateProductBatch } from '../controllers/product.controller.js';
import { getAuthUserVendors, getVendorProducts, vendorDashboardStats } from '../controllers/vendor.controller.js';
import { handleMultipleFilesUpload, rollbackOnError, uploadMultipleFiles } from '../middleware/fileUpload.js';

const router = express.Router();
router.get('/', getAuthUserVendors);
router.get('/:vendorId/dashboard', requireVendorAuthorization, vendorDashboardStats);
router.get('/products', isAuthenticated, getVendorProducts);
router.post('/:vendorId/products', uploadMultipleFiles("images[]", 4), handleMultipleFilesUpload("products"), rollbackOnError(), requireVendorAuthorization, createProduct);
router.put('/:vendorId/products/:productId', uploadMultipleFiles("images", 4), handleMultipleFilesUpload("products"), rollbackOnError(), isAuthenticated, requireVendorAuthorization, updateProduct);
router.put('/:vendorId/products/:productId/publish', isAuthenticated, requireVendorAuthorization, toggleProductIsPublished);
router.get('/:vendorId/products/:productId', isAuthenticated, requireVendorAuthorization, getProduct);
router.get('/:vendorId/products/:productId/batches', isAuthenticated, requireVendorAuthorization, getProductBatches);
router.delete('/:vendorId/products/:productId', isAuthenticated, requireVendorAuthorization, deleteProduct);
// sub product / batches routes
router.post('/:vendorId/products/:productId/refill', isAuthenticated, requireVendorAuthorization, refillProduct);
router.patch('/:vendorId/products/:productId/batches/:subProductId', isAuthenticated, requireVendorAuthorization, updateProductBatch);
router.put('/:vendorId/products/:productId/batches/:subProductId', isAuthenticated, requireVendorAuthorization, toggleProductBatchPublicity);
router.delete('/:vendorId/products/:productId/batches/:subProductId', isAuthenticated, requireVendorAuthorization, toggleProductBatchPublicity);
router.get('/:vendorId/products/:productId/orders', isAuthenticated, requireVendorAuthorization, getProductOrders);
router.get('/:vendorId/products/:productId/sales_report', isAuthenticated, requireVendorAuthorization, downloadProductSalesReport);

export default router;