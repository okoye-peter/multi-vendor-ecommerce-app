import { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "express";
import z from 'zod';

const prisma = new PrismaClient();

export const categorySchema = z.object({
    name: z
        .string()
        .min(2, "Category name must be at least 2 characters")
        .max(100, "Category name must not exceed 100 characters"),

    categoryId: z
        .coerce
        .number()
        .int("Category ID must be an integer")
        .positive("Category ID must be a positive number")
        .nullable()
        .optional(),

    departmentId: z.coerce.number()
        .int()
        .positive({ message: "Department ID must be a positive number" })
});


export const createCategory: RequestHandler = async (req, res, next) => {
    try {
        const result = categorySchema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const { name, categoryId, departmentId } = result.data

        if (await prisma.category.findUnique({ where: { name } }))
            throw { status: 400, message: "a category with the provided name already exists" };

        if (categoryId && !await prisma.category.findUnique({ where: { id: categoryId } }))
            throw { status: 400, message: 'invalid parent category selected' };

        if (departmentId && !await prisma.department.findUnique({ where: { id: departmentId } }))
            throw { status: 400, message: 'invalid department selected selected' };

        await prisma.category.create({
            data: {
                name,
                categoryId: categoryId ?? null,
                departmentId
            }
        })

        res.status(201).json({ message: "category created successfully" });
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}

export const showCategory: RequestHandler = async (req, res, next) => {
    try {
        const categoryId = Number(req.params.id);
        if (isNaN(categoryId))
            throw { status: 400, message: 'invalid category selected' }

        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category)
            throw { status: 400, message: "category not found" };

        res.status(200).json({ category });
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}

export const updateCategory: RequestHandler = async (req, res, next) => {
    try {
        const result = categorySchema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const categoryIdToUpdate = Number(req.params.id);

        if (isNaN(categoryIdToUpdate) || !await prisma.category.findUnique({ where: { id: categoryIdToUpdate } }))
            throw { status: 404, message: "category not found" }

        const { name, categoryId, departmentId } = result.data

        const duplicateName = await prisma.category.findUnique({
            where: {
                name,
                NOT: { id: categoryIdToUpdate }
            }
        });

        if (duplicateName)
            throw { status: 400, message: "a category with the provided name already exists" };

        if (categoryId && !await prisma.category.findUnique({ where: { id: categoryId } }))
            throw { status: 400, message: 'invalid parent category selected' };

        if (departmentId && !await prisma.department.findUnique({ where: { id: departmentId } }))
            throw { status: 400, message: 'invalid department selected selected' };



        await prisma.category.update({
            where: {
                id: categoryIdToUpdate
            },
            data: {
                name,
                categoryId: categoryId ?? null,
                departmentId,
                updatedAt: new Date()
            }
        })

        res.status(200).json({ message: "category updated successfully" });

    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}

export const getPaginatedCategoriesWithTheirDepartment: RequestHandler = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = (req.query.search as string)?.trim();

        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { department: { name: { contains: search, mode: "insensitive" as const } } },
                ],
            }
            : {};

        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                include: {
                    department: { select: { id: true, name: true } },
                    parent: { select: { id: true, name: true } }, // ✅ include parent category
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.category.count({ where }),
        ]);

        res.status(200).json({
            data: categories,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            next(error);
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}

export const deleteCategory: RequestHandler = async (req, res, next) => {
    try {
        const categoryId = Number(req.params.id);

        if(isNaN(categoryId) || await prisma.category.findUnique({where: {id: categoryId}}))
            throw { status: 404, message: "category not found" }

        await prisma.category.delete({
            where: {
                id: categoryId
            }
        })

        res.status(200).json({ message: "category deleted successfully" });
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            next(error);
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}

export const getAllCategories: RequestHandler = async (req, res, next) => {
    try {
        const departmentId = Number(req.query.departmentId);
        const search = req.query.q ? String(req.query.q).trim() : undefined;

        const where: any = {};

        if(departmentId && !isNaN(departmentId)) {
            const Department = await prisma.department.findUnique({
                where: { id: departmentId }
            });
            if(!Department) return res.status(200).json({});
            else where.departmentId = departmentId;
        }

        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }

        const categories = await prisma.category.findMany({ where })

        res.status(200).json(categories);
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            next(error);
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}