import { Prisma, type Product, type SubProduct, type Vendor} from "@prisma/client";
import prisma from "../libs/prisma.js";
import { productSchema, productRefillSchema, updateProductSchema } from "../controllers/product.controller.js";
import generateBatchNumber from "../utils/generateSubProductBatchNumber.js";
import z from "zod";
// import { FileService } from './fileService.js';
import { FileService } from "../middleware/fileUpload.js";

type createProductData = z.infer<typeof productSchema>;
type updateProductData = z.infer<typeof updateProductSchema>;
type refillProductData = z.infer<typeof productRefillSchema>;

interface ProductImageRecord {
    url: string;
    default: boolean;
    productId: number;
    createdAt: Date;
}


export default class ProductService {
    async create(productData: createProductData, vendor: Vendor): Promise<Product> {
        try {
            const {
                name,
                description,
                price,
                categoryId,
                departmentId,
                quantity,
                expiry_date,
                cost_price,
                status,
                productImages,
                defaultImageIndex
            } = productData;

            const slug = name.replaceAll(' ', '-') + '-' + vendor.id;

            const [category, department, existingProduct] = await Promise.all([
                prisma.category.findUnique({ where: { id: categoryId } }),
                prisma.department.findUnique({ where: { id: departmentId } }),
                prisma.product.findFirst({ where: { slug, vendorId: vendor.id } }),
            ]);

            if (!category) {
                throw { status: 400, message: "Invalid category selected" };
            }
            if (!department) {
                throw { status: 400, message: "Invalid department selected" };
            }

            if (existingProduct)
                throw { status: 400, message: "product with provided name already exists" };

            let product: Product;
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

                if (quantity > 0 && cost_price) {
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
                            quantity,
                            expiry_date: expiry_date ? new Date(expiry_date) : null,
                            cost_price,
                            status,
                            product: {
                                connect: { id: product.id },
                            },
                        },
                    });
                }

                // Handle uploaded images with Cloudinary URLs and publicIds
                if (productImages && productImages.length > 0) {
                    const imageRecords: ProductImageRecord[] = productImages.map((image, index) => {
                        const isDefault = defaultImageIndex === index;

                        return {
                            url: image,
                            default: isDefault,
                            productId: product!.id,
                            createdAt: new Date()
                        };
                    });

                    // Ensure exactly one default image
                    let hasDefault = false;
                    imageRecords.forEach((img) => {
                        if (img.default) {
                            if (hasDefault) img.default = false;
                            hasDefault = true;
                        }
                    });

                    // If none marked as default, make the first one default
                    if (!hasDefault && imageRecords.length > 0) {
                        imageRecords[0]!.default = true;
                    }

                    await tx.productImage.createMany({ data: imageRecords });
                }
            });

            return product!;
        } catch (error) {
            // Rollback newly uploaded images from Cloudinary
            if (productData && Array.isArray(productData.productImages) && productData.productImages?.length > 0) {
                await FileService.rollback(productData.productImages);
            }

            if (error instanceof Error) {
                throw { status: 500, message: error.message };
            } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
                throw error;
            } else {
                // ✅ Fallback
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }

    async update(productId: number, productData: updateProductData, vendor: Vendor): Promise<Product> {
        try {
            const {
                name,
                description,
                price,
                categoryId,
                departmentId,
                status,
                productImages,
                defaultImageIndex
            } = productData;

            const slug = name.replaceAll(' ', '-') + '-' + vendor.id;

            const [category, department, existingProduct] = await Promise.all([
                prisma.category.findUnique({ where: { id: categoryId } }),
                prisma.department.findUnique({ where: { id: departmentId } }),
                prisma.product.findFirst({ where: { slug, vendorId: vendor.id, id: { not: productId } } }),
            ]);

            if (!category) {
                throw { status: 400, message: "Invalid category selected" };
            }

            if (!department) {
                throw { status: 400, message: "Invalid department selected" };
            }

            if (existingProduct) {
                throw { status: 400, message: "product with provided name already exists" };
            }

            const updatedProduct = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const product = await tx.product.update({
                    where: { id: productId },
                    data: {
                        name,
                        slug,
                        description,
                        price,
                        categoryId,
                        departmentId,
                        is_published: status,
                        updatedAt: new Date(),
                    },
                });

                if (productImages && productImages.length > 0) {
                    // Fetch old images with publicIds
                    const oldImages = await tx.productImage.findMany({
                        where: { productId: product.id },
                        select: { id: true, url: true }
                    });

                    if (oldImages.length > 0) {
                        // Delete from Cloudinary using publicIds
                        const imagesToDelete: string[] = oldImages.map(img => img.url);

                        await FileService.deleteMultiple(imagesToDelete);

                        // Delete from database
                        await tx.productImage.deleteMany({
                            where: { id: { in: oldImages.map(img => img.id) } },
                        });
                    }

                    // Insert new images with Cloudinary data
                    const imageRecords: ProductImageRecord[] = productImages.map((image, index) => ({
                        url: image,
                        default: index === defaultImageIndex,
                        productId: product.id,
                        createdAt: new Date(),
                    }));

                    // Ensure exactly one default
                    if (!imageRecords.some(img => img.default) && imageRecords.length > 0) {
                        imageRecords[0]!.default = true;
                    }

                    await tx.productImage.createMany({ data: imageRecords });
                }

                return product;
            });

            return updatedProduct;
        } catch (error) {
            // Rollback newly uploaded images from Cloudinary
            if (productData && Array.isArray(productData.productImages) && productData.productImages?.length > 0) {
                await FileService.rollback(productData.productImages);
            }

            if (error instanceof Error) {
                throw { status: 500, message: error.message };
            } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
                throw error;
            } else {
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }

    async delete(productId: number) {
        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const product = await tx.product.findUnique({
                    where: { id: productId },
                    include: {
                        images: {
                            select: { url: true }
                        }
                    }
                });

                if (!product) {
                    throw { status: 404, message: "Product not found" };
                }

                // Delete subProducts that don't have any orderSubProducts
                await tx.subProduct.deleteMany({
                    where: {
                        productId,
                        orderSubProducts: {
                            none: {}
                        }
                    }
                });

                // Delete images from Cloudinary
                if (product.images?.length > 0) {
                    const imagesToDelete: string[] = product.images.map(img => img.url);
                    await FileService.deleteMultiple(imagesToDelete);
                }

                // Delete the product
                await tx.product.delete({
                    where: {
                        id: productId
                    }
                });
            });
        } catch (error) {
            if (error instanceof Error) {
                throw { status: 500, message: error.message };
            } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
                throw error;
            } else {
                // ✅ Fallback
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }

    async refill(product: Product, refillData: refillProductData) {
        try {
            const {
                expiry_date,
                quantity,
                cost_price,
                status
            } = refillData;

            let batch_no = '';
            let existingBatch;

            do {
                batch_no = generateBatchNumber();
                existingBatch = await prisma.subProduct.findUnique({
                    where: { batch_no }
                });
            } while (existingBatch);

            // Use transaction to ensure consistency
            const [subProduct, updatedProduct] = await prisma.$transaction([
                prisma.subProduct.create({
                    data: {
                        batch_no,
                        productId: product.id,
                        quantity,
                        expiry_date: expiry_date ? new Date(expiry_date) : null,
                        cost_price,
                        status,
                    },
                }),
                prisma.product.update({
                    where: {
                        id: product.id,
                        vendorId: product.vendorId,
                    },
                    data: {
                        quantity: product.quantity + quantity,
                        updatedAt: new Date(),
                    },
                }),
            ]);

            return {
                message: "Product successfully refilled",
                product: updatedProduct,
                subProduct,
            };
        } catch (error) {
            if (error instanceof Error) {
                throw { status: 500, message: error.message };
            } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
                throw error;
            } else {
                // ✅ Fallback
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }

    async updateProductBatch(product: Product, subProduct: SubProduct, subProductData: refillProductData) {
        try {
            const {
                expiry_date,
                quantity,
                cost_price,
                status
            } = subProductData;


            const prevQty = subProduct.quantity;
            // Use transaction to ensure consistency
            const [updatedSubProduct, updatedProduct] = await prisma.$transaction([
                prisma.subProduct.update({
                    where: {
                        id: subProduct.id
                    },
                    data: {
                        quantity,
                        expiry_date: expiry_date ? new Date(expiry_date) : null,
                        cost_price,
                        status,
                    },
                }),

                prisma.product.update({
                    where: {
                        id: subProduct.productId!,
                    },
                    data: {
                        quantity: (product.quantity + (quantity - prevQty))
                    },
                }),
            ]);

            return {
                message: "Product Batch updated successfully",
                subProduct: updatedSubProduct,
                product: updatedProduct
            };
        } catch (error) {
            if (error instanceof Error) {
                throw { status: 500, message: error.message };
            } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
                throw error;
            } else {
                // ✅ Fallback
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }

    // disable or enable products
    async toggleIsPublished(product: Product, vendorId: number) {
        try {
            await prisma.product.update({
                where: {
                    id: product.id,
                    vendorId: vendorId
                },
                data: {
                    is_published: !product.is_published
                }
            })
        } catch (error) {
            if (error instanceof Error) {
                throw { status: 500, message: error.message };
            } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
                throw error;
            } else {
                // ✅ Fallback
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }

    // disable or enabled product batches
    async toggleBatchVisibility(subProduct: SubProduct, product: Product) {
        try {

            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

                await tx.subProduct.update({
                    where: {
                        id: subProduct.id,
                        productId: product.id
                    },
                    data: {
                        status: !subProduct.status
                    }
                })

                await tx.product.update({
                    where: {
                        id: product.id
                    },
                    data: {
                        quantity: subProduct.status ? (product.quantity - subProduct.quantity) : (product.quantity + subProduct.quantity),
                        updatedAt: new Date()
                    }
                })
            });
        } catch (error) {
            if (error instanceof Error) {
                throw { status: 500, message: error.message };
            } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
                throw error;
            } else {
                // ✅ Fallback
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }

    async deleteBatch(subProduct: SubProduct, product: Product) {
        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                await tx.product.update({
                    where: {
                        id: product.id
                    },
                    data: {
                        quantity: subProduct.status ? (product.quantity - subProduct.quantity) : product.quantity,
                        updatedAt: new Date()
                    }
                })

                await tx.subProduct.delete({
                    where: {
                        id: subProduct.id,
                        productId: product.id
                    }
                })
            });
        } catch (error) {
            if (error instanceof Error) {
                throw { status: 500, message: error.message };
            } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
                throw error;
            } else {
                // ✅ Fallback
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }
}