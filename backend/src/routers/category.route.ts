import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { requireAdminAuthorization } from '../middleware/adminAccess.middleware.js';
import { createCategory, showCategory, updateCategory, getPaginatedCategoriesWithTheirDepartment, deleteCategory, getAllCategories } from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/paginated', isAuthenticated, requireAdminAuthorization, getPaginatedCategoriesWithTheirDepartment)
router.post('/', isAuthenticated, requireAdminAuthorization, createCategory)
router.get('/:id', isAuthenticated, requireAdminAuthorization, showCategory)
router.put('/:id', isAuthenticated, requireAdminAuthorization, updateCategory)
router.delete('/:id', isAuthenticated, requireAdminAuthorization, deleteCategory)

export default router;