import type { RequestHandler } from "express";
import prisma from "../libs/prisma.js";
import { FilterService } from "../service/filterService.js";
import { PRODUCT_FILTER_CONFIG } from "../config/filter.config.js";
import { startOfMonth, endOfMonth, format, startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";
import { getOrderStatusValue, isValidOrderStatus } from '../enums/orderStatus.js';

export const getAllVendors: RequestHandler = async (req, res, next) => {
    try {
        const { search, page = '1', limit = '12' } = req.query as {
            search?: string;
            page?: string;
            limit?: string;
        };

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = search
            ? { name: { contains: search, mode: 'insensitive' as const } }
            : {};

        const [vendors, total] = await Promise.all([
            prisma.vendor.findMany({
                where,
                include: {
                    state: { select: { id: true, name: true } },
                    _count: { select: { products: { where: { is_published: true } } } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
            }),
            prisma.vendor.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limitNum);

        return res.status(200).json({
            data: vendors,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1,
            },
        });
    } catch (error) {
        next(
            error instanceof Error
                ? { message: error.message, status: 500 }
                : { message: 'Server Error', status: 500 }
        );
    }
};

export const getAuthUserVendors: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;

        const vendors = await prisma.vendor.findMany({
            where: {
                userId: user?.id!,
            },
            include: {
                state: true,
            },
        });

        return res.status(200).json(vendors);
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (
            typeof error === "object" &&
            error !== null &&
            "status" in (error as Record<string, any>)
        ) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
};

export const getVendorProducts: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const { vendorId } = req.query;

        const filterOptions = FilterService.parseQueryParams(req.query);

        const vendors = await prisma.vendor.findMany({
            where: { userId: user?.id! },
            select: { id: true },
        });
        const vendorIds = vendors.map((v) => v.id);
        const vendorFilterIds = vendorId ? [Number(vendorId)] : vendorIds;

        // ✅ Always use config searchFields (most comprehensive)
        Object.assign(filterOptions, {
            searchFields: PRODUCT_FILTER_CONFIG.searchFields,
            include: PRODUCT_FILTER_CONFIG.include,
            filters: [
                ...(filterOptions.filters || []),
                {
                    field: "vendorId",
                    operator: "in" as const,
                    value: vendorFilterIds,
                },
            ],
        });

        const result = await FilterService.executePaginatedQuery(
            prisma.product,
            filterOptions
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(
            error instanceof Error
                ? { message: error.message, status: 500 }
                : { message: "Server Error", status: 500 }
        );
    }
};

export const vendorDashboardStats: RequestHandler = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query as {
            start_date?: string;
            end_date?: string;
        };

        const startDate = start_date
            ? startOfDay(new Date(start_date))
            : startOfMonth(new Date());

        const endDate = end_date
            ? endOfDay(new Date(end_date))
            : endOfMonth(new Date());

        const vendor = req.vendor;

        const productIds = await prisma.product.findMany({
            where: { vendorId: vendor?.id! },
            select: { id: true },
        });

        const productIdsOnly = productIds.map(p => p.id);

        if (!productIdsOnly.length) {
            return res.status(200).json({
                start_date: startDate,
                end_date: endDate,
                totalSales: 0,
            });
        }

        const sales = await prisma.$queryRaw<{ total_sales: bigint | null; total_orders: bigint | null }[]>(Prisma.sql`
            SELECT 
            COALESCE(SUM(quantity * price_on_purchase), 0) AS total_sales,
            COALESCE(Count(*), 0) as total_orders
            FROM "orders"
            WHERE "product_id" IN (${Prisma.join(productIdsOnly)})
            AND "created_at" BETWEEN ${startDate} AND ${endDate}
        `);

        const pendingOrdersCount = await prisma.order.count({
            where: {
                productId: { in: productIdsOnly },
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                orderGroup: {
                    status: {
                        notIn: [getOrderStatusValue('DELIVERED'), getOrderStatusValue('CANCELLED')],
                    },
                },
            },
        });

        console.log('sales', sales)



        res.status(200).json({
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            totalSales: Number(sales[0]?.total_sales ?? 0),
            totalOrders: Number(sales[0]?.total_orders ?? 0),
            pendingOrders: pendingOrdersCount
        });
    } catch (error) {
        next(
            error instanceof Error
                ? { message: error.message, status: 500 }
                : { message: "Server Error", status: 500 }
        );
    }
};

export const getPaginatedOrderList: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user

        if (user?.type !== 'VENDOR')
            return res.status(400).json({ message: 'user unauthorized' })

        const vendorIds = await prisma.vendor.findMany({
            where: {
                userId: user?.id
            },
            select: {
                id: true
            }
        })

        const filterOptions = FilterService.parseQueryParams(req.query);

        filterOptions.searchFields = filterOptions.searchFields || ['product.name', 'orderGroup.ref_no'];

        filterOptions.filters = filterOptions.filters || [];
        filterOptions.filters.push({
            field: 'product.vendorId',
            operator: 'in',
            value: vendorIds.map(vendor => vendor.id)
        });

        // Add your custom includes
        filterOptions.include = {
            product: {
                select: {
                    id: true,
                    name: true,
                }
            },
            orderGroup: {
                select: {
                    id: true,
                    ref_no: true,
                    status: true,
                }
            }
        };

        const result = await FilterService.executePaginatedQuery(
            prisma.order,
            filterOptions
        )

        res.status(200).json({ success: true, ...result })
    } catch (error) {
        next(
            error instanceof Error
                ? { message: error.message, status: 500 }
                : { message: "Server Error", status: 500 }
        );
    }
}

export const updateOrderGroupStatus: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const orderGroupId = Number(req.params.orderGroupId);
        const statusNum = Number(req.body.status);

        if (isNaN(orderGroupId)) return next({ status: 400, message: 'Invalid order group ID' });
        if (!isValidOrderStatus(statusNum)) return next({ status: 400, message: 'Invalid status value' });

        // Verify this order group has at least one order belonging to this vendor
        const vendorIds = await prisma.vendor.findMany({
            where: { userId: user?.id! },
            select: { id: true },
        });
        const vendorIdList = vendorIds.map((v) => v.id);

        const orderGroup = await prisma.orderGroup.findFirst({
            where: {
                id: orderGroupId,
                orders: { some: { product: { vendorId: { in: vendorIdList } } } },
            },
        });

        if (!orderGroup) return next({ status: 404, message: 'Order group not found' });

        const TERMINAL = new Set([
            getOrderStatusValue('DELIVERED'),
            getOrderStatusValue('CANCELLED'),
        ]);
        if (TERMINAL.has(orderGroup.status as any)) {
            return next({ status: 400, message: 'Cannot update a delivered or cancelled order' });
        }

        const prevStatus = orderGroup.status;

        const updated = await prisma.orderGroup.update({
            where: { id: orderGroupId },
            data: {
                status: statusNum,
                ...(statusNum === 4 ? { deliveredAt: new Date() } : {}),
            },
        });

        await prisma.orderStatusLog.create({
            data: { from: prevStatus, to: statusNum, orderGroupId, userId: user?.id ?? null },
        });

        res.status(200).json({ message: 'Status updated', orderGroup: updated });
    } catch (error) {
        next(
            error instanceof Error
                ? { message: error.message, status: 500 }
                : { message: 'Server Error', status: 500 }
        );
    }
};

