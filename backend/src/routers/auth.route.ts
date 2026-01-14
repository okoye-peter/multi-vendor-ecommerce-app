import express from 'express';
import { register, login, sendPasswordResetCode, resetPassword, verifyEmail, logout, getAuthenticatedUser, resendEmailVerificationCode } from '../controllers/auth.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { guestOnly } from '../middleware/guest.middleware.js';
import { handleSingleFileUpload, rollbackOnError, uploadSingleFile } from '../middleware/fileUpload.js';
import rateLimit from 'express-rate-limit';


const router = express.Router();

let limiter = rateLimit({
    max: 5,
    windowMs: 20 * 60 * 1000, // 20 minutes
    message: 'Too many failed attempt, try again after 20 minutes'
})

let passwordLimiter = rateLimit({
    max: 5,
    windowMs: 10 * 60 * 1000, // 20 minutes
    message: 'Too many failed attempt, try again after 20 minutes'
})

router.post('/register', uploadSingleFile("picture"), handleSingleFileUpload("avatars"), rollbackOnError(), guestOnly, limiter, register);
router.post('/login', guestOnly, limiter, login);
router.post('/logout', isAuthenticated, logout);
router.post('/password/reset/code', guestOnly, passwordLimiter, sendPasswordResetCode);
router.post('/password/reset', guestOnly, passwordLimiter, resetPassword);
router.post('/email/verification/code/resend', isAuthenticated, passwordLimiter, resendEmailVerificationCode);
router.post('/email/verify', isAuthenticated, passwordLimiter, verifyEmail);
router.get('/user', isAuthenticated, getAuthenticatedUser);



// router.post(
//     "/vendor/complete-profile",
//     uploadFields([
//         { name: "logo", maxCount: 1 },
//         { name: "documents", maxCount: 5 },
//     ]),
//     handleFieldsUpload("vendor-uploads"), // Cloudinary folder: "vendor-uploads"
//     rollbackOnError(),
//     vendorController.completeProfile
// );

// // Controller
// const logo = req.uploadedFields?.logo?.[0];
// const docs = req.uploadedFields?.documents;

export default router;