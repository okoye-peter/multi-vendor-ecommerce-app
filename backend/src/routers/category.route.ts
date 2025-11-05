import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.ts';
import { requireAdminAuthorization } from '../middleware/adminAccess.middleware.ts';
import { createCategory, showCategory, updateCategory, getPaginatedCategoriesWithTheirDepartment, deleteCategory, getAllCategories } from '../controllers/category.controller.ts';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/paginated', isAuthenticated, requireAdminAuthorization, getPaginatedCategoriesWithTheirDepartment)
router.post('/', isAuthenticated, requireAdminAuthorization, createCategory)
router.get('/:id', isAuthenticated, requireAdminAuthorization, showCategory)
router.put('/:id', isAuthenticated, requireAdminAuthorization, updateCategory)
router.delete('/:id', isAuthenticated, requireAdminAuthorization, deleteCategory)

export default router;