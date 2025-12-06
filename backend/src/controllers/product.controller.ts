import prisma from "../libs/prisma.js";
import { type RequestHandler } from "express";
import z from "zod";
import ProductService from "../service/productService.js";
import { FilterService } from "../service/filterService.js";
import { PRODUCT_FILTER_CONFIG, SUB_PRODUCT_FILTER_CONFIG } from "../config/filter.config.js";
import { FileService, type RequestWithUploadedFields, type RequestWithUploadedFiles } from "../middleware/fileUpload.js";

const productService = new ProductService;

/* ===========================
   SCHEMAS
=========================== */

// ✅ File validation schema for multiple files
const fileArraySchema = z.array(z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.enum([
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "image/gif",
    ], {
        message: "Only JPEG, PNG, JPG, WEBP, and GIF images are allowed"
    }),
    size: z.number()
        .max(5 * 1024 * 1024, "File size must not exceed 5MB")
        .positive("File size must be greater than 0"),
    buffer: z.instanceof(Buffer),
})).min(1, "At least one image is required").max(4, "Maximum 4 images allowed");

const imageItemSchema = z.url("Invalid image URL");

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
        // ✅ Accept array of image URLs (for DB storage)
        productImages: z.array(imageItemSchema).min(1, "At least one product image is required"),
        // ✅ Accept array of file objects (for validation only)
        images: fileArraySchema,
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

export const updateProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Product description is required"),
    price: z.coerce.number().positive("Price must be positive"),
    categoryId: z.coerce.number().int().positive("Invalid category"),
    departmentId: z.coerce.number().int().positive("Invalid department"),
    status: z.coerce.boolean(),
    // ✅ For update, images are optional (only if user wants to change them)
    productImages: z.array(imageItemSchema).optional(),
    images: fileArraySchema.optional(),
    defaultImageIndex: z.coerce.number().int().nonnegative("Invalid default image index").optional(),
});

export const productRefillSchema = z.object({
    expiry_date: z.coerce.date().optional().nullable(),
    quantity: z.coerce.number().int().min(0).default(0),
    cost_price: z.coerce.number().nonnegative("Cost Price must be non-negative"),
    // price: z.coerce.number().nonnegative("Price must be non-negative"),
    status: z.coerce.boolean().default(true)
});

/* ===========================
   CREATE PRODUCT
=========================== */

export const createProduct: RequestHandler = async (req, res, next) => {
    const reqWithUploads = req as RequestWithUploadedFiles;
    const cloudinaryUploads = reqWithUploads.cloudinaryUploads;

    try {
        const vendor = req.vendor;

        if (!vendor) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!cloudinaryUploads) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const { urls: productImageUrls, files: productImageFiles } = cloudinaryUploads;

        if (productImageUrls.length === 0) {
            return res.status(400).json({ error: 'At least one product image is required' });
        }

        const defaultImageIndex = req.body.defaultImageIndex
            ? parseInt(req.body.defaultImageIndex)
            : 0;

        // Validate defaultImageIndex is within range
        if (defaultImageIndex < 0 || defaultImageIndex >= productImageUrls.length) {
            await FileService.rollback(productImageUrls);
            return res.status(400).json({
                error: `Invalid defaultImageIndex. Must be between 0 and ${productImageUrls.length - 1}`
            });
        }

        // ✅ Validate with Zod
        const result = productSchema.safeParse({
            ...req.body,
            productImages: productImageUrls, // URLs for DB storage
            images: productImageFiles, // Files for validation
            defaultImageIndex: defaultImageIndex
        });

        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();
            const errors = Object.values(fieldErrors).some(arr => arr && arr.length > 0)
                ? fieldErrors
                : formErrors;

            // Rollback uploaded images on validation failure
            await FileService.rollback(productImageUrls);

            return next({ status: 400, message: errors });
        }

        const product = await productService.create(result.data, vendor);

        return res.status(201).json({ product, message: "Product created successfully" });
    } catch (error) {
        // Rollback all uploaded images on error
        if (cloudinaryUploads?.urls) {
            await FileService.rollback(cloudinaryUploads.urls);
        }
        console.log('error', error);
        next({
            message: error instanceof Error ? error.message : "Server Error",
            status: 500
        });
    }
};

/* ===========================
   UPDATE PRODUCT
=========================== */

export const updateProduct: RequestHandler = async (req, res, next) => {
    const reqWithFields = req as RequestWithUploadedFields;
    const cloudinaryFieldUploads = reqWithFields.cloudinaryFieldUploads;

    try {
        const vendor = req.vendor;
        const productId = Number(req.params.productId);

        const product = await prisma.product.findUnique({
            where: { id: productId, vendorId: vendor?.id! }
        });

        if (!product) {
            return next({ status: 400, message: "product not found" });
        }

        // Get product images from the 'images[]' field
        const productImagesField = cloudinaryFieldUploads?.['images[]'];
        const productImageUrls = productImagesField?.urls || [];
        const productImageFiles = productImagesField?.files || [];

        let defaultImageIndex = 0;

        if (productImageUrls.length > 0) {
            defaultImageIndex = req.body.defaultImageIndex
                ? parseInt(req.body.defaultImageIndex)
                : 0;

            // Validate defaultImageIndex is within range
            if (defaultImageIndex < 0 || defaultImageIndex >= productImageUrls.length) {
                if (cloudinaryFieldUploads) {
                    // Rollback all uploaded fields
                    const allUrls = Object.values(cloudinaryFieldUploads)
                        .flatMap(field => field.urls);
                    await FileService.rollback(allUrls);
                }
                return res.status(400).json({
                    error: `Invalid defaultImageIndex. Must be between 0 and ${productImageUrls.length - 1}`
                });
            }
        }

        // Validate other form data
        const result = updateProductSchema.safeParse({
            ...req.body,
            productImages: productImageUrls.length > 0 ? productImageUrls : undefined,
            images: productImageFiles.length > 0 ? productImageFiles : undefined,
            defaultImageIndex: productImageUrls.length > 0 ? defaultImageIndex : undefined
        });

        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            // Rollback uploaded images on validation failure
            if (cloudinaryFieldUploads) {
                const allUrls = Object.values(cloudinaryFieldUploads)
                    .flatMap(field => field.urls);
                await FileService.rollback(allUrls);
            }

            return next({ status: 400, message: errors });
        }

        // ✅ Remove images array before passing to service
        const { images, ...dataForDB } = result.data;

        const updatedProduct = await productService.update(productId, dataForDB, vendor!);

        res.status(200).json({
            message: "product updated successfully",
            product: updatedProduct
        });

    } catch (error) {
        // Rollback all uploaded images on error
        if (cloudinaryFieldUploads) {
            const allUrls = Object.values(cloudinaryFieldUploads)
                .flatMap(field => field.urls);
            await FileService.rollback(allUrls);
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

export const getProduct: RequestHandler = async (req, res, next) => {
    try {
        const productId = Number(req.params.productId);

        const vendor = req.vendor;

        const product = await prisma.product.findUnique({
            where: {
                id: productId,
                vendorId: vendor?.id!,
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
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor?.id! } })
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
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor?.id! } })
        ]);

        if (!product) {
            throw { message: "product not found", status: 400 }
        }

        const data = await productService.refill(product, result.data);
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

export const updateProductBatch: RequestHandler = async (req, res, next) => {
    try {

        const vendor = req.vendor;

        const productId = Number(req.params.productId);
        const subProductId = Number(req.params.subProductId);

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

        const [product, subProduct] = await Promise.all([
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor?.id! } }),
            prisma.subProduct.findUnique({ where: { id: subProductId, productId } }),
        ]);

        if (!product) {
            throw { message: "product not found", status: 400 }
        }

        if (!subProduct) {
            throw { message: "product batch not found", status: 400 }
        }
        const response = await productService.updateProductBatch(product, subProduct, result)
        res.status(200).json(response);
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
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor?.id! } })
        ]);

        if (!product) {
            throw { message: "product not found", status: 400 }
        }

        await productService.toggleIsPublished(product, vendor?.id!)


        res.status(200).json({ message: `product ${product.is_published ? 'unpublished' : 'published'} successfully` });
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

export const toggleProductBatchPublicity: RequestHandler = async (req, res, next) => {
    try {
        const vendor = req.vendor;

        const productId = Number(req.params.productId);
        const subProductId = Number(req.params.subProductId);

        const [product, subProduct] = await Promise.all([
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor?.id! } }),
            prisma.subProduct.findUnique({ where: { id: subProductId, productId } }),
        ]);

        if (!product) {
            throw { message: "product not found", status: 400 }
        }

        if (!subProduct) {
            throw { message: "product batch not found", status: 400 }
        }

        await productService.toggleBatchVisibility(subProduct, product)


        res.status(200).json({ message: `product batch ${subProduct.status ? 'unpublished' : 'published'} successfully` });
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

export const deleteProductBatch: RequestHandler = async (req, res, next) => {
    try {
        const vendor = req.vendor;
        const user = req.user;
        const productId = Number(req.params.productId);
        const subProductId = Number(req.params.subProductId);

        const [product, subProduct] = await Promise.all([
            prisma.product.findUnique({ where: { id: productId, vendorId: vendor?.id! } }),
            prisma.subProduct.findUnique({ where: { id: subProductId, productId } }),
        ]);

        if (!product) {
            throw { message: "product not found", status: 400 }
        }

        if (!subProduct) {
            throw { message: "product batch not found", status: 400 }
        }

        await productService.deleteBatch(subProduct, product);
        res.status(200).json({ message: "product batch deleted successfully" });
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