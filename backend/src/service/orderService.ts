import type { Cart, SubProduct } from "@prisma/client";
import prisma from "../libs/prisma.js";
import generateBatchNumber from "../utils/generateSubProductBatchNumber.js";
import { getOrderStatusValue } from "../enums/orderStatus.js";
import logger from "../libs/logger.js";

type CartFull = Cart & {
    product: {
        id: number,
        name: string,
        price: number,
        quantity: number,
        subProducts: SubProduct[]
    }
};

export default class OrderGroupService {
    async createOrder(carts: CartFull[], paymentRefNo: string) {
        if (!carts || carts.length === 0) {
            throw { status: 400, message: "Cart is empty" };
        }

        try {
            await prisma.$transaction(async (tx) => {
                // Generate unique reference number
                let ref_no;
                do {
                    ref_no = generateBatchNumber(12);
                } while (await tx.orderGroup.findUnique({ where: { ref_no } }));

                const totalAmount = carts.reduce((total, cart) => total + (cart.quantity * cart.product.price), 0);

                // Pre-validate all products before creating orders
                const insufficientProducts = carts.filter(cart => cart.quantity > cart.product.quantity);
                if (insufficientProducts.length > 0) {
                    const errorMsg = insufficientProducts.map(cart => 
                        `${cart.product.name} (requested: ${cart.quantity}, available: ${cart.product.quantity})`
                    ).join(', ');
                    
                    logger.error({
                        message: `Insufficient inventory for products: ${errorMsg}`,
                        status: 400,
                        stack: { carts, paymentRefNo },
                        timestamp: new Date().toISOString()
                    });

                    throw new Error(`Insufficient inventory for: ${errorMsg}`);
                }

                // Validate subproduct availability
                for (const cart of carts) {
                    const totalSubProductQuantity = cart.product.subProducts.reduce((sum, sp) => sum + sp.quantity, 0);
                    if (totalSubProductQuantity < cart.quantity) {
                        logger.error({
                            message: `Insufficient subproduct inventory for ${cart.product.name}`,
                            status: 400,
                            stack: { 
                                productId: cart.productId,
                                requestedQuantity: cart.quantity,
                                availableSubProductQuantity: totalSubProductQuantity,
                                paymentRefNo 
                            },
                            timestamp: new Date().toISOString()
                        });

                        throw new Error(`Insufficient subproduct inventory for ${cart.product.name}`);
                    }
                }

                // Create order group
                const orderGroup = await tx.orderGroup.create({
                    data: {
                        ref_no: ref_no,
                        status: getOrderStatusValue('DELIVERED'),
                        userId: carts[0]?.userId!,
                        deliveredAt: new Date(),
                        totalAmount : totalAmount,
                        paymentRefNo: paymentRefNo
                    }
                });

                // Batch operations for better performance
                const cartIds = carts.map(cart => cart.id);

                // Process each cart item
                for (const cart of carts) {
                    // Create order
                    const order = await tx.order.create({
                        data: {
                            productId: cart.productId,
                            requestedQuantity: cart.quantity,
                            quantity: cart.quantity,
                            orderGroupId: orderGroup.id,
                            priceOnPurchase: cart.product.price,
                        }
                    });

                    let remainingQuantity = cart.quantity;

                    // Process subproducts with FIFO inventory management
                    for (const subProduct of cart.product.subProducts) {
                        if (remainingQuantity === 0) break;

                        const quantityToDeduct = Math.min(subProduct.quantity, remainingQuantity);

                        await tx.orderSubProduct.create({
                            data: {
                                subProductId: subProduct.id,
                                orderId: order.id,
                                quantity: quantityToDeduct,
                            }
                        });

                        await tx.subProduct.update({
                            where: { id: subProduct.id },
                            data: { quantity: { decrement: quantityToDeduct } }
                        });

                        remainingQuantity -= quantityToDeduct;
                    }

                    // Update product quantity
                    await tx.product.update({
                        where: { id: cart.productId },
                        data: { quantity: { decrement: cart.quantity } }
                    });
                }

                // Delete all carts in batch
                await tx.cart.deleteMany({
                    where: {
                        id: { in: cartIds }
                    }
                });
            }, {
                timeout: 30000, // 30 second timeout
                maxWait: 10000, // Max 10 seconds to acquire lock
            });

            return { success: true, message: "Order created successfully" };
        } catch (error) {
            logger.error({
                message: 'Order creation failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: { carts, paymentRefNo },
                timestamp: new Date().toISOString()
            });

            if (error instanceof Error) {
                throw { status: 500, message: error.message };
            } else if (typeof error === "object" && error !== null && "status" in error) {
                throw error;
            } else {
                throw { status: 500, message: "An unexpected error occurred" };
            }
        }
    }
}