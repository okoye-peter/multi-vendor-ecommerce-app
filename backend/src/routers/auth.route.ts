import express from 'express';
import { register, login, sendPasswordResetCode, resetPassword, verifyEmail, logout, getAuthenticatedUser, resendEmailVerificationCode } from '../controllers/auth.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { guestOnly } from '../middleware/guest.middleware.js';
import { handleSingleFileUpload, rollbackOnError, uploadSingleFile } from '../middleware/fileUpload.js';


const router = express.Router();

router.post('/register', uploadSingleFile("picture"), handleSingleFileUpload("avatars"), rollbackOnError(), guestOnly, register);
router.post('/login', guestOnly, login);
router.post('/logout', isAuthenticated, logout);
router.post('/password/reset/code', guestOnly, sendPasswordResetCode);
router.post('/password/reset', guestOnly, resetPassword);
router.post('/email/verification/code/resend', isAuthenticated, resendEmailVerificationCode);
router.post('/email/verify', isAuthenticated, verifyEmail);
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