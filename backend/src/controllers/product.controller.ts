import prisma from "../libs/prisma.ts";
import { type RequestHandler } from "express";
import z from "zod";
import ProductService from "../service/productService.ts";
import { FileService } from "../service/fileService.ts";
import { FilterService } from "../service/filterService.ts";
import { PRODUCT_FILTER_CONFIG, SUB_PRODUCT_FILTER_CONFIG } from "../config/filterConfig.ts";

const productService = new ProductService;

const imageItemSchema = z.object({
    url: z.string(),
    availableSizes: z.array(z.string()),
});

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
        images: imageItemSchema,
        productImages: z.array(z.string()).min(1, "At least one product image is required"),
        defaultImageIndex: z.coerce.number().int().min(0, "Default image index must be non-negative")
    })
    .refine(
        (data) => data.quantity <= 0 || (data.cost_price !== null && data.cost_price !== undefined),
        { message: "Cost price is required when quantity is greater than 0", path: ["cost_price"] }
    )
    .refine(
        (data) => data.defaultImageIndex < data.productImages.length,
        { message: "Default image index is out of range", path: ["defaultImageIndex"] }
    );

export const productUpdateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().max(1000),
    price: z.coerce.number().nonnegative("Price must be non-negative"),
    categoryId: z.coerce.number().int().positive("Category ID must be a positive integer"),
    departmentId: z.coerce.number().int().positive("Department ID must be a positive integer"),
    status: z.coerce.boolean().default(true),
    images: imageItemSchema.optional().nullable(),
    productImages: z.array(z.string()),
    defaultImageIndex: z.number().optional().nullable()
});

export const productRefillSchema = z.object({
    expiry_date: z.coerce.date().optional().nullable(),
    quantity: z.coerce.number().int().min(0).default(0),
    cost_price: z.coerce.number().nonnegative("Cost Price must be non-negative"),
    price: z.coerce.number().nonnegative("Price must be non-negative"),
    status: z.coerce.boolean().default(true)
});
export interface ProductImage {
    url: string;
    availableSizes: Array<"thumb" | "small" | "medium" | "large" | "xlarge" | "original">;
}


export const createProduct: RequestHandler = async (req, res, next) => {
    const uploadedFields = (req as any).uploadedFields as Record<string, ProductImage[]>;
    const allUploadedImages = (req as any).uploadedProductImages as ProductImage[];

    try {
        const vendor = req.vendor;

        if (!uploadedFields) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Get all product images from images[]
        const productImages = uploadedFields['images[]'] || [];

        if (productImages.length === 0) {
            return res.status(400).json({ error: 'At least one product image is required' });
        }

        // Parse defaultImageIndex from request body
        const defaultImageIndex = req.body.defaultImageIndex 
            ? parseInt(req.body.defaultImageIndex) 
            : 0; // Default to first image

        // Validate defaultImageIndex is within range
        if (defaultImageIndex < 0 || defaultImageIndex >= productImages.length) {
            if (allUploadedImages && allUploadedImages.length > 0) {
                await FileService.rollback(allUploadedImages);
            }
            return res.status(400).json({ 
                error: `Invalid defaultImageIndex. Must be between 0 and ${productImages.length - 1}` 
            });
        }

        // Get the default/main image based on index
        const mainImage = productImages[defaultImageIndex];

        // Validate other form data
        const result = productSchema.safeParse({
            ...req.body,
            images: mainImage, // The main/default image
            productImages: productImages.map(img => img.url), // All images URLs
            defaultImageIndex: defaultImageIndex
        });

        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();
            const errors = Object.values(fieldErrors).some(arr => arr && arr.length > 0) 
                ? fieldErrors 
                : formErrors;

            // Rollback uploaded images on validation failure
            if (allUploadedImages && allUploadedImages.length > 0) {
                await FileService.rollback(allUploadedImages);
            }

            return next({ status: 400, message: errors });
        }

        const product = await productService.create(result.data, vendor);

        return res.status(201).json({ product, message: "Product created successfully" });
    } catch (error) {
        // Rollback all uploaded images on error
        if (allUploadedImages && allUploadedImages.length > 0) {
            await FileService.rollback(allUploadedImages);
        }
        console.log('error', error)
        next({ 
            message: error instanceof Error ? error.message : "Server Error", 
            status: 500 
        });
    }
};

export const updateProduct: RequestHandler = async (req, res, next) => {
    const uploadedFields = (req as any).uploadedFields as Record<string, ProductImage[]>;
    const allUploadedImages = (req as any).uploadedProductImages as ProductImage[];
    console.log('this is who I am');
    try {
        const vendor = req.vendor;
        const productId = Number(req.params.productId);

        const product = await prisma.product.findUnique({ where: { id: productId, vendorId: vendor.id } })

        if (!product) return next({ status: 400, message: "product not found" })
        
        // Get all product images from images[]
        const productImages = uploadedFields['images[]'] || [];

         const defaultImageIndex = req.body.defaultImageIndex 
            ? parseInt(req.body.defaultImageIndex) 
            : 0; 

         // Validate defaultImageIndex is within range
        if (productImages.length  && (defaultImageIndex < 0 || defaultImageIndex >= productImages.length)) {
            if (allUploadedImages && allUploadedImages.length > 0) {
                await FileService.rollback(allUploadedImages);
            }
            return res.status(400).json({ 
                error: `Invalid defaultImageIndex. Must be between 0 and ${productImages.length - 1}` 
            });
        }

        // Get the default/main image based on index
        const mainImage = productImages[defaultImageIndex];

        // Validate other form data
        const result = productUpdateSchema.safeParse({
            ...req.body,
            images: mainImage, // The main/default image
            productImages: productImages.map(img => img.url), // All images URLs
            defaultImageIndex: defaultImageIndex
        });


        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            // If there are no fieldErrors (all arrays empty), use formErrors instead
            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            // Rollback uploaded images on validation failure
            if (allUploadedImages && allUploadedImages.length > 0) {
                await FileService.rollback(allUploadedImages);
            }

            return next({ status: 400, message: errors });
        }

        const updatedProduct = await productService.update(productId, result.data, vendor)


        res.status(200).json({ message: "product updated successfully", product: updatedProduct })


    } catch (error) {
        // Rollback all uploaded images on error
        if (allUploadedImages && allUploadedImages.length > 0) {
            await FileService.rollback(allUploadedImages);
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
                images: true,
                vendor: true
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

export const getAllProducts: RequestHandler = async (req, res, next) => {
    try {
        const filterOptions = FilterService.parseQueryParams(req.query);
        Object.assign(filterOptions, PRODUCT_FILTER_CONFIG);

        const result = await FilterService.executePaginatedQuery(
            prisma.product,
            filterOptions
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const toggleProductIsPublished: RequestHandler = async (req, res, next) => {
    try {
        const vendor = req.vendor;
        const productId = Number(req.params.productId);

        const [product] = await Promise.all([
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor.id } })
        ]);

        if (!product) {
            throw { message: "product not found", status: 400 }
        }

        await productService.toggleIsPublished(product, vendor.id)

        
        res.status(200).json({ message: `product ${product.is_published ? 'unpublished' : 'published'} successfully`});
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

export const getProductBatches: RequestHandler = async (req, res, next) => {
    try {
        const productId = Number(req.params.productId);
        const vendorId = Number(req.params.vendorId);
        
        if (isNaN(productId)) {
            return next({ message: "Invalid product ID", status: 400 });
        }
        if (isNaN(vendorId)) {
            return next({ message: "Invalid vendor ID", status: 400 });
        }

        // Verify product exists and belongs to vendor
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                vendorId: vendorId
            }
        });

        if (!product) {
            return next({ status: 404, message: 'Product not found' });
        }

        const filterOptions = FilterService.parseQueryParams(req.query);
        Object.assign(filterOptions, SUB_PRODUCT_FILTER_CONFIG);
        
        // Add productId filter to the filters array
        if (!filterOptions.filters) {
            filterOptions.filters = [];
        }
        
        filterOptions.filters.push({
            field: 'productId',
            operator: 'equals',
            value: productId
        });

        const result = await FilterService.executePaginatedQuery(
            prisma.subProduct,
            filterOptions
        );
        
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            next(error);
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
};