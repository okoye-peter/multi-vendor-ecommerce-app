import type { RequestHandler } from "express";
import z from "zod";
import prisma from "../libs/prisma.js";


export const updateCartSchema = z.object({
    quantity: z.coerce.number().int(),
})

export const createCartSchema = z.object({
    productId: z.coerce.number().int().min(1),
})



export const getCarts: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user

        const carts = await prisma.cart.findMany({
            where: {
                userId: user?.id!
            },
            include: {
                product: {
                    include: {
                        images: {
                            where: {
                                default: true
                            }
                        }
                    }
                }
            }
        })

        res.status(200).json(carts)
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
}

export const addToCart: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        // const productId = Number(req.params.productId)

        const result = createCartSchema.safeParse({
            ...req.body,
        });

        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const [product, cart] = await Promise.all([
            await prisma.product.findFirst({ where: { id: result.data.productId, is_published: true } }),
            await prisma.cart.findFirst({ where: { userId: user?.id!, productId: result.data.productId } }),
        ])

        if (!product) {
            throw { status: 404, message: 'product not found' }
        }

        if (cart) {
            throw { status: 400, message: 'product already in cart' }
        }


        const newCart = await prisma.cart.create({
            data: {
                quantity: 1,
                productId: result.data.productId,
                userId: user?.id!
            }
        })

        const cartWithDetails = await prisma.cart.findUnique({
            where: {
                id: newCart.id, 
            },
            include: {
                product: {
                    include: {
                        images: {
                            where: {
                                default: true,
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json({ message: 'product added to cart successfully', cart: cartWithDetails })
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
}

export const removeFromCartByProductId: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const productId = Number(req.params.productId)

        const cart = await prisma.cart.findFirst({ where: { userId: user?.id!, productId: productId } })

        await prisma.cart.delete({
            where: {
                productId_userId: {
                    productId,
                    userId: user?.id!
                }
            }
        })

        res.status(201).json({ message: 'product removed from cart successfully', cart })
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
}

export const removeFromCartByCartId: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const cartId = Number(req.params.cartId)

        const cart = await prisma.cart.findFirst({ where: { userId: user?.id!, id: cartId } })

        await prisma.cart.delete({
            where: {
                id: cartId,
                userId: user?.id!
            }
        })

        res.status(201).json({ message: 'product removed from cart successfully', cart })
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
}

export const updateCart: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;

        const cartId = Number(req.params.cartId)

        const cart = await prisma.cart.findFirst({ where: { userId: user?.id!, id: cartId } })

        if (!cart) throw { status: 404, message: 'cart not found' }

        const result = updateCartSchema.safeParse({
            ...req.body,
        });

        if (!result.success) {
            const { fieldErrors, formErrors } = result.error.flatten();

            const hasFieldErrors = Object.values(fieldErrors).some(
                (errors) => errors && errors.length > 0
            );

            const errors = hasFieldErrors ? fieldErrors : formErrors;

            return next({ status: 400, message: errors });
        }

        const newCart = await prisma.cart.update({
            where: {
                id: cartId,
                userId: user?.id!
            },
            data: {
                quantity: cart.quantity + result.data.quantity
            }
        })

        res.status(200).json({ message: 'cart updated successfully', cart: newCart })
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
}