import { Prisma, type Product, type Vendor } from "@prisma/client";
import prisma from "../libs/prisma.ts";
import { productSchema, productUpdateSchema, productRefillSchema } from "../controllers/product.controller.ts";
import generateBatchNumber from "../utils/generateSubProductBatchNumber.ts";
import z from "zod";
import { FileService } from './fileService.ts';

type createProductData = z.infer<typeof productSchema>;
type updateProductData = z.infer<typeof productUpdateSchema>;
type refillProductData = z.infer<typeof productRefillSchema>;


export default class ProductService {
    async create(productData: createProductData, vendor: Vendor) {
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

                // ✅ Handle uploaded images (if any)
                if (productImages && productImages.length > 0) {
                    const imageRecords = productImages.map((path, index) => {
                        const isDefault = defaultImageIndex === index;

                        return {
                            url: path,
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
            if (productData.productImages?.length > 0) {
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

    async update(productId: number, productData: updateProductData, vendor: Vendor) {
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
                    // Delete old images
                    const oldImages = await tx.productImage.findMany({
                        where: { productId: product.id },
                    });

                    if (oldImages.length > 0) {
                        await FileService.deleteMultiple(oldImages.map(img => img.url));
                        await tx.productImage.deleteMany({
                            where: { id: { in: oldImages.map(img => img.id) } },
                        });
                    }

                    // Insert new images
                    const imageRecords = productImages.map((path, index) => ({
                        url: path,
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

                return product; // ✅ Return the updated product
            });

            return updatedProduct;
        } catch (error) {
            // Ensure uploaded files are rolled back if something failed
            if (productData && productData.productImages.length > 0) {
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

    async delete(productId: number) {
        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Delete subProducts that don't have any orderSubProducts
                await tx.subProduct.deleteMany({
                    where: {
                        productId,
                        orderSubProducts: {
                            none: {}
                        }
                    }
                });

                const images = await tx.productImage.findMany({
                    where: {
                        productId
                    }
                })

                if (images.length > 0) {
                    await FileService.deleteMultiple(images.map(img => img.url));
                    await tx.productImage.deleteMany({
                        where: {
                            id: { in: images.map(img => img.id) }
                        }
                    })
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

    async refill(productId: number, refillData: refillProductData, vendor: Vendor) {
        try {
            const {
                expiry_date,
                quantity,
                cost_price,
                status,
                price
            } = refillData;

            const product = await prisma.product.findUnique({
                where: { id: productId, vendorId: vendor.id },
            });

            if (!product) {
                throw { status: 404, message: "Product not found or not owned by vendor" };
            }

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
                        productId,
                        quantity,
                        expiry_date: expiry_date ? new Date(expiry_date) : null,
                        cost_price,
                        status,
                    },
                }),
                prisma.product.update({
                    where: {
                        id: productId,
                        vendorId: vendor.id,
                    },
                    data: {
                        price: price ?? product.price,
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

    async toggleIsPublished (product: Product, vendorId: number) {
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
}