import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.ts';
import { handleSingleFileUpload, uploadSingleFile } from '../service/fileService.ts';
import { createProduct } from '../controllers/product.controller.ts';
import { requireVendorAuthorization } from '../middleware/vendorOnly.middleware.ts';


const router = express.Router()

// router.post('/')

export default router;