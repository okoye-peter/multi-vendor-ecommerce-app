import express from 'express';
import { register, login, sendPasswordResetCode, resetPassword, verifyEmail, logout, getAuthenticatedUser } from '../controllers/auth.controller.ts';
import { isAuthenticated } from '../middleware/auth.middleware.ts';
import { guestOnly } from '../middleware/guest.middleware.ts';

const router = express.Router();

router.post('/register', guestOnly, register);
router.post('/login', guestOnly, login);
router.post('/logout', isAuthenticated, logout);
router.post('/password/reset/code', guestOnly, sendPasswordResetCode);
router.post('/password/reset', guestOnly, resetPassword);
router.post('/verify-email', isAuthenticated, verifyEmail);
router.get('/user', isAuthenticated, getAuthenticatedUser);



export default router;