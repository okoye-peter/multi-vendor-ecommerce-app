import { PrismaClient, type Vendor } from "@prisma/client";
import { productSchema, productUpdateSchema, productRefillSchema } from "../controllers/product.controller.js";
import generateBatchNumber from "../utils/generateSubProductBatchNumber.js";
import z from "zod";

const prisma = new PrismaClient();

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
                status
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

            return product
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

    async update(productId: number, productData: updateProductData, vendor: Vendor) {
        try {
            const {
                name,
                description,
                price,
                categoryId,
                departmentId,
                status
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

            const updatedProduct = await prisma.product.update({
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

            return updatedProduct;
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

    async delete(productId: number, vendor: Vendor) {
        try {
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
                        purchased_quantity: quantity,
                        expiry_date: new Date(expiry_date),
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
}