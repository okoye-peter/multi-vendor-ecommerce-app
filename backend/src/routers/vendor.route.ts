import express from 'express';
import {} from '../middleware/auth.middleware.js';
import { requireVendorAuthorization } from '../middleware/vendorOnly.middleware.js';
import { createProduct, deleteProduct, downloadProductSalesReport, getProduct, getProductBatches, getProductOrders, refillProduct, toggleProductBatchPublicity, toggleProductIsPublished, updateProduct, updateProductBatch } from '../controllers/product.controller.js';
import { getAuthUserVendors, getPaginatedOrderList, getVendorProducts, vendorDashboardStats } from '../controllers/vendor.controller.js';
import { handleMultipleFilesUpload, rollbackOnError, uploadMultipleFiles } from '../middleware/fileUpload.js';

const router = express.Router();
router.get('/', getAuthUserVendors);
router.get('/orders', getPaginatedOrderList);
router.get('/:vendorId/dashboard', requireVendorAuthorization, vendorDashboardStats);
router.get('/products', getVendorProducts);
router.post('/:vendorId/products', uploadMultipleFiles("images[]", 4), handleMultipleFilesUpload("products"), rollbackOnError(), requireVendorAuthorization, createProduct);
router.put('/:vendorId/products/:productId', uploadMultipleFiles("images", 4), handleMultipleFilesUpload("products"), rollbackOnError(), requireVendorAuthorization, updateProduct);
router.put('/:vendorId/products/:productId/publish', requireVendorAuthorization, toggleProductIsPublished);
router.get('/:vendorId/products/:productId', requireVendorAuthorization, getProduct);
router.get('/:vendorId/products/:productId/batches', requireVendorAuthorization, getProductBatches);
router.delete('/:vendorId/products/:productId', requireVendorAuthorization, deleteProduct);
// sub product / batches routes
router.post('/:vendorId/products/:productId/refill', requireVendorAuthorization, refillProduct);
router.patch('/:vendorId/products/:productId/batches/:subProductId', requireVendorAuthorization, updateProductBatch);
router.put('/:vendorId/products/:productId/batches/:subProductId', requireVendorAuthorization, toggleProductBatchPublicity);
router.delete('/:vendorId/products/:productId/batches/:subProductId', requireVendorAuthorization, toggleProductBatchPublicity);
router.get('/:vendorId/products/:productId/orders', requireVendorAuthorization, getProductOrders);
router.get('/:vendorId/products/:productId/sales_report', requireVendorAuthorization, downloadProductSalesReport);

export default router;