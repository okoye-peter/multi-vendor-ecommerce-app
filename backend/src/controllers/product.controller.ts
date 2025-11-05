import { PrismaClient } from "@prisma/client";
import { type RequestHandler } from "express";
import z from "zod";
import generateBatchNumber from "../utils/generateSubProductBatchNumber.ts";


const prisma = new PrismaClient();

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
    })
    .refine(
        (data) => data.quantity <= 0 || !!data.expiry_date,
        { message: "Expiry date is required when quantity is greater than 0", path: ["expiry_date"] }
    )
    .refine(
        (data) => data.quantity <= 0 || (data.cost_price !== null && data.cost_price !== undefined),
        { message: "Cost price is required when quantity is greater than 0", path: ["cost_price"] }
    );


export const createProduct: RequestHandler = async (req, res, next) => {
    try {
        const vendorId = Number(req.params.vendorId);
        const vendor = req.vendor;

        const result = productSchema.safeParse(req.body);
        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const {
            name,
            description,
            price,
            categoryId,
            departmentId,
            quantity,
            expiry_date,
            cost_price,
            status
        } = result.data;

        const slug = name.replaceAll(' ', '-') + '-' + vendor.id;

        const [category, department, existingProduct] = await Promise.all([
            prisma.category.findUnique({ where: { id: categoryId } }),
            prisma.department.findUnique({ where: { id: departmentId } }),
            prisma.product.findFirst({ where: { slug, vendorId } }),
        ]);

        if (!category) {
            return next({ status: 400, message: "Invalid category selected" });
        }
        if (!department) {
            return next({ status: 400, message: "Invalid department selected" });
        }

        if (existingProduct)
            return next({ status: 400, message: "product with provided name already exists" });

        let product;
        await prisma.$transaction(async (tx) => {

            product = await tx.product.create({
                data: {
                    name,
                    slug,
                    description,
                    price,
                    categoryId,
                    departmentId,
                    quantity,
                    vendorId: vendor.id,
                    is_published: status,
                }
            });
    
            if (quantity > 0 && expiry_date && cost_price) {
                let batch_no = '';
                let existingBatch;
        
                do {
                    batch_no = generateBatchNumber();
                    existingBatch = await tx.subProduct.findUnique({ 
                        where: { batch_no } 
                    });
                } while (existingBatch);
    
                await tx.subProduct.create({
                    data: {
                        batch_no,
                        purchased_quantity: quantity,
                        expiry_date: new Date(expiry_date),
                        cost_price,
                        status,
                        product: {
                            connect: { id: product.id },
                        },
                    },
                });
            }
        });

        return res.status(201).json({ product, message: 'Product created successfully' });
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

export const updateProduct:RequestHandler = async (req, res, next) => {
    try {
        const vendor = req.vendor;
        const productId = Number(req.params.productId);

        const [product] = await Promise.all([
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor.id } })
        ]);

        if(!product) return next({ status: 400, message: "product not found" })

        const result = z.object({
            name: z.string().min(1, "Name is required"),
            description: z.string().max(1000),
            price: z.coerce.number().nonnegative("Price must be non-negative"),
            categoryId: z.coerce.number().int().positive("Category ID must be a positive integer"),
            departmentId: z.coerce.number().int().positive("Department ID must be a positive integer"),
            status: z.coerce.boolean().default(true),
        }).safeParse(req.body);

        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const {
            name,
            description,
            price,
            categoryId,
            departmentId,
            status
        } = result.data;

        const slug = name.replaceAll(' ', '-') + '-' + vendor.id;
        const [category, department, existingProduct] = await Promise.all([
            prisma.category.findUnique({ where: { id: categoryId } }),
            prisma.department.findUnique({ where: { id: departmentId } }),
            prisma.product.findFirst({ where: { slug, vendorId: vendor.id, id: { not: productId } } }),
        ]);

        if (!category) {
            return next({ status: 400, message: "Invalid category selected" });
        }
        if (!department) {
            return next({ status: 400, message: "Invalid department selected" });
        }

        if (existingProduct)
            return next({ status: 400, message: "product with provided name already exists" });

        await prisma.product.update({
            where: {
                id: productId
            },
            data: {
                name,
                description,
                price,
                categoryId,
                departmentId,
                is_published: status,
                updatedAt: new Date()
            }
        })

        res.status(200).json({ message: "product updated successfully" })

        
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

export const getProduct:RequestHandler = async (req, res, next) => {
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

export const deleteProduct:RequestHandler = async (req, res, next) => {
    try {
        const vendor = req.vendor;
        const productId = Number(req.params.productId);

        const [product] = await Promise.all([
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor.id } })
        ]);

        if (!vendor) {
            return res.status(400).json({ message: "vendor not found" })
        }

        if (!product) {
            return res.status(400).json({ message: "product not found" })
        }
        await prisma.$transaction(async (tx) => {
            // Delete subProducts that don't have any orderSubProducts
            await tx.subProduct.deleteMany({
                where: {
                    productId: productId,
                    orderSubProducts: {
                        none: {}
                    }
                }
            });

            // Delete the product
            await tx.product.delete({
                where: {
                    id: productId
                }
            });
        });
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

