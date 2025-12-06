import type { RequestHandler } from "express";
import prisma from "../libs/prisma.js";
import z from "zod";

const departmentSchema = z.object({
    name: z.string(),
    slug: z.string()
});

export const createDepartment: RequestHandler = async (req, res, next) => {
    try {
        const result = departmentSchema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const { name, slug } = result.data;
        const formattedSlug = slug.trim().replace(/\s+/g, "-").toLowerCase();

        if (await prisma.department.findUnique({ where: { slug: formattedSlug } }))
            return next({ status: 400, message: `A department with slug "${slug}" already exists` });

        await prisma.department.create({
            data: {
                name,
                slug: formattedSlug
            }
        })
        return res.status(201).json({ message: "department created successfully" });
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

export const getDepartmentsWithCategories: RequestHandler = async (req, res, next) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                categories: true, // ✅ include related categories
            },
            orderBy: { name: "asc" },
        });

        res.status(200).json(departments);
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

export const getPaginatedDepartments: RequestHandler = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = (req.query.search as string)?.trim();

        const skip = (page - 1) * limit;

        // Optional search
        const where = search
            ? { name: { contains: search, mode: "insensitive" as const } }
            : {};

        // ✅ Prisma v6 syntax: same as before, _count still valid
        const [departments, total] = await Promise.all([
            prisma.department.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { categories: true },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.department.count({ where }),
        ]);

        // Transform to flatten _count
        const formatted = departments.map((d) => ({
            id: d.id,
            name: d.name,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            categoriesCount: d._count.categories,
        }));

        return res.status(200).json({
            data: formatted,
            pagination: {
                total,
                page,
                limit,
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

export const updateDepartment: RequestHandler = async (req, res, next) => {
    try {
        const result = departmentSchema.safeParse(req.body);

        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const departmentId = Number(req.params.id);
        if (!departmentId || isNaN(departmentId) || !await prisma.department.findUnique({ where: { id: departmentId } }))
            return next({ status: 400, message: "invalid department selected" });

        const { name, slug } = result.data;
        const formattedSlug = slug.trim().replace(/\s+/g, "-").toLowerCase();

        const departmentExists = await prisma.department.findUnique({
            where: {
                slug: formattedSlug,
                NOT: { id: departmentId }
            }
        })

        if (departmentExists)
            return next({ status: 400, message: `A department with slug "${slug}" already exists` });

        await prisma.department.update({
            where: { id: departmentId },
            data: { name, slug: formattedSlug, updatedAt: new Date() },
        });

        return res.status(200).json({ message: "department updated successfully" });

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

export const deleteDepartment: RequestHandler = async (req, res, next) => {
    try {
        const departmentId = Number(req.params.id);
        if (!departmentId || isNaN(departmentId) || !await prisma.department.findUnique({ where: { id: departmentId } }))
            return next({ status: 400, message: "invalid department selected" });

        await prisma.department.delete({where: {id: departmentId}});
        res.status(200).json({ message: "department deleted successfully" });
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

export const showDepartment: RequestHandler = async (req, res, next) => {
    try {
        const departmentId = Number(req.params.id);
        if(!departmentId || isNaN(departmentId))
            throw { status: 404, message: "department not found" };

        const department = await prisma.department.findUnique({ where: {id: departmentId}})
        if(!department)
            throw { status: 404, message: "department not found" };

        res.status(200).json({ department });
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

export const getAllDepartments:RequestHandler = async (req, res, next) => {
    try{
        const departments = await prisma.department.findMany({});
        res.status(200).json(departments)
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