import type { RequestHandler } from "express";
import prisma from "../libs/prisma.js";
import { FilterService } from "../service/filterService.js";
import { PRODUCT_FILTER_CONFIG } from "../config/filter.config.js";
import { startOfMonth, endOfMonth, format, startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";
import { getOrderStatusValue } from '../enums/orderStatus.js';

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

