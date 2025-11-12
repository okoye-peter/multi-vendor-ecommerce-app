import { PrismaClient } from "@prisma/client";
import { type RequestHandler } from "express";
import z from "zod";
import ProductService from "../service/productService.ts";
import { FilterService } from "../service/filterService.ts";
import { FileService } from "../service/fileService.ts";

const productService = new ProductService;
const prisma = new PrismaClient();

const imageSchema = z.object({
    filename: z.string(),
    path: z.string(),
    mimetype: z.enum(["image/jpeg", "image/png", "image/jpg", "image/webp"]),
    size: z.number().max(2 * 1024 * 1024, "File size must not exceed 2MB"),
});

const imagesArraySchema = z
    .array(
        z.object({
            default: z.boolean().optional().default(false),
            image: imageSchema,
        })
    )
    .min(1, "At least one image is required")
    // Enforce only one default image
    .refine(
        (images) => images.filter((img) => img.default).length <= 1,
        { message: "Only one image can be set as default", path: ["default"] }
    );

export const productSchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        description: z.string().max(1000),
        price: z.coerce.number().nonnegative("Price must be non-negative"),
        categoryId: z.coerce.number().int().positive("Category ID must be a positive integer"),
        departmentId: z.coerce.number().int().positive("Department ID must be a positive integer"),
        quantity: z.coerce.number().int().min(0).default(0),
        expiry_date: z.coerce.date().optional().nullable(),
        cost_price: z.coerce.number().nonnegative("Cost Price must be non-negative").optional().nullable(),
        status: z.coerce.boolean().default(true),
        images: imagesArraySchema.optional().nullable(),
    })
    .refine(
        (data) => data.quantity <= 0 || !!data.expiry_date,
        { message: "Expiry date is required when quantity is greater than 0", path: ["expiry_date"] }
    )
    .refine(
        (data) => data.quantity <= 0 || (data.cost_price !== null && data.cost_price !== undefined),
        { message: "Cost price is required when quantity is greater than 0", path: ["cost_price"] }
    );

export const productUpdateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().max(1000),
    price: z.coerce.number().nonnegative("Price must be non-negative"),
    categoryId: z.coerce.number().int().positive("Category ID must be a positive integer"),
    departmentId: z.coerce.number().int().positive("Department ID must be a positive integer"),
    status: z.coerce.boolean().default(true),
    images: imagesArraySchema.optional().nullable(),
});

export const productRefillSchema = z.object({
    expiry_date: z.coerce.date(),
    quantity: z.coerce.number().int().min(0).default(0),
    cost_price: z.coerce.number().nonnegative("Cost Price must be non-negative"),
    price: z.coerce.number().nonnegative("Price must be non-negative"),
    status: z.coerce.boolean().default(true)
});


export const createProduct: RequestHandler = async (req, res, next) => {
    const uploadedFilePaths: string[] = (req as any).uploadedFilePaths || [];

    try {
        const vendor = req.vendor;

        const result = productSchema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );
            const errors = hasFieldErrors ? fieldErrors : formErrors;

            // Rollback any uploaded files
            if (uploadedFilePaths.length > 0) {
                await FileService.rollback(uploadedFilePaths);
            }

            return next({ status: 400, message: errors });
        }

        const product = await productService.create(result.data, vendor, uploadedFilePaths);

        return res.status(201).json({ product, message: "Product created successfully" });
    } catch (error) {
        // Rollback uploaded files on any error
        if (uploadedFilePaths.length > 0) {
            await FileService.rollback(uploadedFilePaths);
        }

        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
};

export const updateProduct: RequestHandler = async (req, res, next) => {
    const uploadedFilePaths: string[] = (req as any).uploadedFilePaths || [];

    try {
        const vendor = req.vendor;
        const productId = Number(req.params.productId);

        const product = await prisma.product.findUnique({ where: { id: productId, vendorId: vendor.id } })

        if (!product) return next({ status: 400, message: "product not found" })

        const result = productUpdateSchema.safeParse(req.body);

        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            // Rollback any uploaded files
            if (uploadedFilePaths.length > 0) {
                await FileService.rollback(uploadedFilePaths);
            }

            return next({ status: 400, message: errors });
        }

        const updatedProduct = productService.update(productId, result.data, vendor)


        res.status(200).json({ message: "product updated successfully", product: updatedProduct })


    } catch (error) {
        // Rollback uploaded files on any error
        if (uploadedFilePaths.length > 0) {
            await FileService.rollback(uploadedFilePaths);
        }

        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}

export const getProduct: RequestHandler = async (req, res, next) => {
    try {
        const productId = Number(req.params.productId);

        const vendor = req.vendor;

        const product = await prisma.product.findUnique({
            where: {
                id: productId,
                vendorId: vendor.id,
            },
            include: {
                category: true,
                department: true,
            }
        })
        res.status(200).json(product);
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

export const deleteProduct: RequestHandler = async (req, res, next) => {
    try {
        const vendor = req.vendor;
        const productId = Number(req.params.productId);

        const [product] = await Promise.all([
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor.id } })
        ]);

        if (!product) {
            throw { message: "product not found", status: 400 }
        }

        productService.delete(productId);

        res.status(200).json({ message: "product deleted successfully" })
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

export const refillProduct: RequestHandler = async (req, res, next) => {
    try {
        const vendor = req.vendor;
        const productId = Number(req.params.productId);

        const result = productRefillSchema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const [product] = await Promise.all([
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor.id } })
        ]);

        if (!product) {
            throw { message: "product not found", status: 400 }
        }

        const data = await productService.refill(productId, result.data, vendor);
        res.status(200).json(data);
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

export const getVendorProducts: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const { vendorId } = req.query;
        const filterOptions = FilterService.parseQueryParams(req.query);
        const vendors = await prisma.vendor.findMany({
            where: {
                userId: user.id
            },
            select: {
                id: true
            }
        })

        const vendorIds = vendors.map((v) => v.id);

        const vendorFilterIds = vendorId
            ? [Number(vendorId)]
            : vendorIds;

        // Configure filters
        Object.assign(filterOptions, {
            filters: [
                ...(filterOptions.filters || []),
                {
                    field: "vendorId",
                    operator: "in" as const,
                    value: vendorFilterIds,
                },
            ],
            searchFields: filterOptions.searchFields || [
                'name',
                'description',
                'slug',
                'category.name',
                'department.name',
                'vendor.name',
                'vendor.address',
            ],
            include: {
                category: { select: { id: true, name: true } },
                department: { select: { id: true, name: true, slug: true } },
                vendor: { select: { id: true, name: true, address: true } },
            },
        });

        const result = await FilterService.executePaginatedQuery(
            prisma.product,
            filterOptions
        );

        res.status(200).json({ success: true, ...result });

    } catch (error) {
        next(error instanceof Error
            ? { message: error.message, status: 500 }
            : { message: "Server Error", status: 500 }
        );
    }
};

