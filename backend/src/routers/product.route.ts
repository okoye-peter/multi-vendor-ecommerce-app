import express from 'express';
import { getAllProducts, getProductDetails } from '../controllers/product.controller.js';


const router = express.Router()


router.get('/', getAllProducts);
router.get('/:slug', getProductDetails);

export default router;