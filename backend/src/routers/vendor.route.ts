import express from 'express';
import { handleFieldsUpload, handleMultipleFilesUpload, rollbackOnError, uploadFields, uploadMultipleFiles } from '../service/fileService.ts';
import { isAuthenticated } from '../middleware/auth.middleware.ts';
import { requireVendorAuthorization } from '../middleware/vendorOnly.middleware.ts';
import { createProduct, deleteProduct, getProduct, refillProduct, updateProduct } from '../controllers/product.controller.ts';
import { getAuthUserVendors } from '../controllers/vendor.controller.ts';

const router = express.Router();

router.get('/', getAuthUserVendors);
router.post('/:vendorId/products', uploadFields([ { name: 'images[]', maxCount: 5 } ]), handleFieldsUpload('products', true), rollbackOnError(), requireVendorAuthorization, createProduct);
router.put('/:vendorId/products/:productId', uploadFields([ { name: 'images[]', maxCount: 5 } ]), handleFieldsUpload('products', true), isAuthenticated, requireVendorAuthorization, updateProduct);
router.get('/:vendorId/products/:productId', isAuthenticated, requireVendorAuthorization, getProduct);
router.delete('/:vendorId/products/:productId', isAuthenticated, requireVendorAuthorization, deleteProduct);
router.post('/:vendorId/products/:productId/refill', isAuthenticated, requireVendorAuthorization, refillProduct);

export default router;