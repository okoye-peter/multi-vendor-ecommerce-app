import express from 'express';
import { checkPaymentStatus, getOrder, getUserOrders, initializePaymentForCheckout } from '../controllers/orders.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

let limiter = rateLimit({
    max: 3,
    windowMs: 20 * 60 * 1000, // 20 minutes
    message: 'Too many failed attempt, try again after 20 minutes'
})

const router = express.Router()

router.get('/', isAuthenticated, getUserOrders);
router.post('/', isAuthenticated, limiter, initializePaymentForCheckout);
router.get('/check-payment-status', isAuthenticated, checkPaymentStatus);
router.get('/:ref_no', isAuthenticated, getOrder);

export default router;