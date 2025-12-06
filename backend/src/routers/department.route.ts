import express  from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { requireAdminAuthorization } from "../middleware/adminAccess.middleware.js";
import { createDepartment, getDepartmentsWithCategories, getPaginatedDepartments, updateDepartment, deleteDepartment, showDepartment, getAllDepartments } from "../controllers/department.controller.js";

const router = express.Router();

router.get('/', getAllDepartments);
router.post('/', isAuthenticated, requireAdminAuthorization, createDepartment);
router.get('/categories', getDepartmentsWithCategories);
router.get('/paginated', isAuthenticated, requireAdminAuthorization, getPaginatedDepartments);
router.get('/:id', isAuthenticated, requireAdminAuthorization, showDepartment);
router.put('/:id', isAuthenticated, requireAdminAuthorization, updateDepartment);
router.delete('/:id', isAuthenticated, requireAdminAuthorization, deleteDepartment);

export default router;