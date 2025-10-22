import express  from "express";
import { isAuthenticated } from "../middleware/auth.middleware.ts";
import { requireAdminAuthorization } from "../middleware/adminAccess.middleware.ts";
import { createDepartment, getDepartmentsWithCategories, getPaginatedDepartments, updateDepartment, deleteDepartment } from "../controllers/department.controller.ts";

const router = express.Router();

router.get('/categories', getDepartmentsWithCategories);
router.get('/paginated', isAuthenticated, requireAdminAuthorization, getPaginatedDepartments);
router.post('/', isAuthenticated, requireAdminAuthorization, createDepartment);
router.put('/:id', isAuthenticated, requireAdminAuthorization, updateDepartment);
router.delete('/:id', isAuthenticated, requireAdminAuthorization, deleteDepartment);

export default router;