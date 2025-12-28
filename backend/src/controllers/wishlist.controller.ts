import type { RequestHandler } from "express";
import z from "zod";
import prisma from "../libs/prisma.js";


export const getWishlists: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user

        const wishlists = await prisma.wishlist.findMany({
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
                        },
                        category: true,
                        department: true,
                    }
                }
            }
        })

        res.status(200).json(wishlists)
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

export const toggleProductInWishlist: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const productId = Number(req.params.productId)

        const [product, wishlist] = await Promise.all([
            await prisma.product.findFirst({ where: { id: productId, is_published: true } }),
            await prisma.wishlist.findFirst({ where: { userId: user?.id!, productId: productId } }),
        ])

        if (wishlist) {
            await prisma.wishlist.delete({
                where: {
                    id: wishlist.id
                }
            })

            return res.status(200).json({ message: 'product removed from wishlist successfully', wishlist })
        }

        if (!product) {
            throw { status: 404, message: 'product not found' }
        }

        const newWishlist = await prisma.wishlist.create({
            data: {
                productId,
                userId: user?.id!
            }
        })

        res.status(201).json({ message: 'product added to wishlist successfully', wishlist: newWishlist })
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

// export const removeFromWishlist: RequestHandler = async (req, res, next) => {
//     try {
//         const user = req.user;
//         const wishlistId = Number(req.params.wishlistId)

//         const wishlist = await prisma.wishlist.findFirst({ where: { userId: user?.id!, id: wishlistId } })

//         if(!wishlist)
//             return res.status(404).json({ message: 'product not in wishlist' })

//         await prisma.wishlist.delete({
//             where: {
//                 id: wishlistId
//             }
//         })

//         res.status(201).json({ message: 'product removed from wishlist successfully', wishlist })
//     } catch (error) {
//         if (error instanceof Error) {
//             res.status(500).json({ message: error.message });
//         } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
//             throw error;
//         } else {
//             res.status(500).json({ message: "Server Error" });
//         }
//     }
// }

export const moveWishlistItemToCart: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const wishlists = await prisma.wishlist.findMany({
            where: {
                userId: user.id,
            },
        });

        if (!wishlists.length) {
            return res.status(200).json({ message: "Wishlist is empty" });
        }

        await prisma.$transaction(async (tx) => {
            for (const wishlist of wishlists) {
                const existingCartItem = await tx.cart.findUnique({
                    where: {
                        productId_userId: {
                            productId: wishlist.productId,
                            userId: user.id,
                        },
                    },
                });

                if (!existingCartItem) {
                    await tx.cart.create({
                        data: {
                            quantity: 1,
                            productId: wishlist.productId,
                            userId: user.id,
                        },
                    });
                }
            }

            await tx.wishlist.deleteMany({
                where: {
                    userId: user.id,
                },
            });
        });

        res.status(200).json({
            message: "Wishlist items moved to cart successfully",
        });

    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
};

export const clearWishlist: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;

        await prisma.wishlist.deleteMany({
            where: {
                userId: user?.id!
            }
        })

        res.status(200).json({ message: 'wishlist cleared successfully' })
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
}


