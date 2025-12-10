import express from 'express';
import { checkPaymentStatus, getOrder, getUserOrders, initializePaymentForCheckout } from '../controllers/orders.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router()

router.get('/', isAuthenticated, getUserOrders);
router.post('/', isAuthenticated, initializePaymentForCheckout);
router.get('/check-payment-status', isAuthenticated, checkPaymentStatus);
router.get('/:ref_no', isAuthenticated, getOrder);

export default router;