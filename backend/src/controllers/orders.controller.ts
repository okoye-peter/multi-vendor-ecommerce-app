import type { RequestHandler } from 'express';
import { FilterService } from '../service/filterService.js';
import { ORDER_FILTER_CONFIG } from '../config/filter.config.js';
import prisma from '../libs/prisma.js';
import https from 'https';
import crypto from 'crypto';
import logger from '../libs/logger.js';
import OrderGroupService from '../service/orderService.js';
import type { orderGroup } from '@prisma/client';

const orderService = new OrderGroupService;

type fullOrderGroupType = orderGroup & {
    _count: {
        order: number
    }
}

export const getUserOrders: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return next({ status: 401, message: "Unauthorized" });
        }

        const filterOptions = FilterService.parseQueryParams(req.query);

        // Override/merge filter options
        filterOptions.filters = [
            ...(filterOptions.filters || []),
            {
                field: "userId",
                operator: "equals" as const,
                value: user.id,
            }
        ];

        // Set search fields for ref_no
        filterOptions.searchFields = ['ref_no'];

        // Set default sort if not provided
        if (!filterOptions.sortBy) {
            filterOptions.sortBy = 'createdAt';
            filterOptions.sortOrder = 'desc';
        }

        // Validate sortBy - only allow totalAmount or createdAt
        if (filterOptions.sortBy && !['totalAmount', 'createdAt'].includes(filterOptions.sortBy)) {
            filterOptions.sortBy = 'createdAt';
        }

        const result = await FilterService.executePaginatedQuery(
            prisma.orderGroup,
            {
                ...filterOptions,
                include: {
                    ...(filterOptions.include || {}),
                    _count: {
                        select: { orders: true },
                    },
                },
            }
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getAllOrders: RequestHandler = async (req, res, next) => {
    try {
        const filterOptions = FilterService.parseQueryParams(req.query);
        Object.assign(filterOptions, ORDER_FILTER_CONFIG);

        const result = await FilterService.executePaginatedQuery(
            prisma.order,
            filterOptions
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};


export const initializePaymentForCheckout: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user?.emailVerifiedAt) {
            return res.status(400).json({ message: 'User has not verified their email' })
        }

        const carts = await prisma.cart.findMany({
            where: {
                userId: user?.id!
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                    }
                }
            }
        })

        if (!carts.length) {
            return res.status(400).json({
                message: 'User cart is empty',
            });
        }

        const cartTotal = carts.reduce((total, cart) => {
            return total + (cart.quantity * cart.product.price)
        }, 0)

        if (!cartTotal) {
            return res.status(400).json({
                message: 'User cart total is zero',
            });
        }

        const params = JSON.stringify({
            email: user?.email,
            amount: Math.round(cartTotal * 100),
            callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
            metadata: {
                userId: user?.id,
                cartItemsCount: carts.length,
                cartItems: carts.map(cart => cart.id),
            }
        });

        const options: https.RequestOptions = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/transaction/initialize',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(params),
            },
        };

        const paystackReq = https.request(options, paystackRes => {
            let data = '';

            paystackRes.on('data', chunk => {
                data += chunk;
            });

            paystackRes.on('end', () => {
                try {
                    if (data.trim().startsWith('<')) {
                        console.error('Paystack returned HTML:', data);
                        return res.status(500).json({
                            success: false,
                            message: 'Payment initialization failed - invalid response from Paystack',
                        });
                    }

                    const response = JSON.parse(data);

                    if (!response.status) {
                        return res.status(400).json({
                            success: false,
                            message: response.message || 'Payment initialization failed',
                        });
                    }

                    // ✅ Return payment URL to frontend
                    return res.status(200).json({
                        success: true,
                        message: 'Payment initialized successfully',
                        data: {
                            authorizationUrl: response.data.authorization_url,
                            accessCode: response.data.access_code,
                            reference: response.data.reference,
                        }
                    });
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.error('Response data:', data);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to parse payment response',
                    });
                }
            });
        });

        paystackReq.on('error', error => {
            console.error('Paystack Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Payment initialization failed',
                error: error.message,
            });
        });

        paystackReq.write(params);
        paystackReq.end();
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            res.status(500).json({ message: "Server Error" });
        }
    }
};

export const placeOrder: RequestHandler = async (req, res, next) => {
    try {
        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(JSON.stringify(req.body)).digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            logger.warn({
                message: 'Invalid Paystack signature',
                status: 401,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(400).json({ error: 'Invalid signature' });
        }
        const event = req.body;

        if (event.data.status !== 'success') {
            logger.info({
                message: 'Paystack payment not successful',
                status: event.data.status,
                reference: event.data.reference,
                timestamp: new Date().toISOString()
            });
            return res.status(200).json({ message: 'Payment status noted' });
        }
        console.log('event', event)


        const amountPaid: number = event.data.amount / 100;
        const userId = parseInt(event.data.metadata.userId);
        const cartItemIds: number[] = event.data.metadata.cartItems.map((id: string) => parseInt(id));

        // Validate metadata
        if (!userId || !cartItemIds || !Array.isArray(cartItemIds)) {
            logger.error({
                message: 'Missing or invalid metadata in Paystack webhook',
                status: 400,
                stack: { event: event.data },
                timestamp: new Date().toISOString()
            });
            return res.status(400).json({ error: 'Invalid metadata' });
        }

        const carts = await prisma.cart.findMany({
            where: {
                userId,
                id: { in: cartItemIds }
            },
            select: {
                id: true,
                quantity: true,
                productId: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        quantity: true,
                        // You can include subProducts with include here
                        subProducts: {
                            where: {
                                quantity: { gt: 0 },
                                status: true
                            },
                            orderBy: {
                                createdAt: "asc"
                            }
                        }
                    }
                }
            }
        });

        // Validate cart exists and matches request
        if (carts.length === 0) {
            logger.error({
                message: 'No cart items found for payment',
                status: 404,
                stack: { userId, cartItemIds, reference: event.data.reference },
                timestamp: new Date().toISOString()
            });
            return res.status(404).json({ error: 'Cart items not found' });
        }

        if (carts.length !== cartItemIds.length) {
            logger.warn({
                message: 'Cart item count mismatch',
                expected: cartItemIds.length,
                found: carts.length,
                reference: event.data.reference,
                timestamp: new Date().toISOString()
            });
        }

        // Verify payment amount matches cart total
        const cartTotal = carts.reduce((total, cart) =>
            total + (cart.quantity * cart.product.price), 0
        );

        const tolerance = 0.01; // Allow 1 cent difference due to rounding
        if (Math.abs(amountPaid - cartTotal) > tolerance) {
            logger.error({
                message: 'Payment amount mismatch',
                status: 400,
                stack: {
                    amountPaid,
                    cartTotal,
                    difference: amountPaid - cartTotal,
                    reference: event.data.reference,
                    event: event.data
                },
                method: req.method,
                url: req.url,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(400).json({ error: 'Payment amount mismatch' });
        }

        orderService.createOrder(carts, event.data.reference)
            .then(() => {
                logger.info({
                    message: 'Order created successfully',
                    reference: event.data.reference,
                    userId,
                    totalAmount: cartTotal,
                    timestamp: new Date().toISOString()
                });
            })
            .catch((error) => {
                logger.error({
                    message: 'Failed to create order after payment',
                    status: 500,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    stack: {
                        reference: event.data.reference,
                        userId,
                        error
                    },
                    timestamp: new Date().toISOString()
                });
                // Consider implementing a retry mechanism or dead letter queue here
            });


        // Respond to Paystack immediately (don't wait for order creation)
        res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
        logger.error({
            message: 'Webhook processing error',
            status: 500,
            data: error,
            error: error instanceof Error ? error.message : 'Unknown error',
            method: req.method,
            url: req.url,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Still return 200 to Paystack to prevent retries for non-recoverable errors
        res.status(200).json({ message: 'Error noted' });
    }
}

export const checkPaymentStatus: RequestHandler = async (req, res) => {
    try {
        const { reference } = req.query;
        const user = req.user;

        if (typeof reference !== "string" || !reference.trim()) {
            return res.status(400).json({
                success: false,
                message: "Payment reference is required",
            });
        }

        const orderGroup = await prisma.orderGroup.findFirst({
            where: {
                paymentRefNo: reference,
                userId: user?.id!  // ✅ Optional security check
            },
            select: {
                id: true,
                ref_no: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                paymentRefNo: true,
            },
        });

        if (!orderGroup) {
            return res.status(200).json({
                success: false,
                message: "Order is still being processed",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Order found",
            order_ref_no: orderGroup.ref_no,
            data: orderGroup,
        });
    } catch (error) {
        console.error("CHECK PAYMENT STATUS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getOrder: RequestHandler = async (req, res, next) => {
    try {
        const { ref_no } = req.params;

        if (!ref_no?.trim())
            return res.status(404).json({ message: 'order not found' })

        const orderGroup = await prisma.orderGroup.findFirst({
            where: {
                ref_no,
            },
            include: {
                orders: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    where: {
                                        default: true, // ✅ Only default images
                                    },
                                    select: {
                                        id: true,
                                        url: true,
                                        default: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!orderGroup)
            return res.status(404).json({ message: 'order not found' })

        res.status(200).json({ order_group: orderGroup })
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