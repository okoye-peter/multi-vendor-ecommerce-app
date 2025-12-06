// controllers/orderController.ts
import type { RequestHandler } from 'express';
import { FilterService } from '../service/filterService.js';
import { ORDER_FILTER_CONFIG } from '../config/filter.config.js';
import prisma from '../libs/prisma.js';

export const getUserOrders: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return next({ status: 401, message: "Unauthorized" });
        }
        const filterOptions = FilterService.parseQueryParams(req.query);

        Object.assign(filterOptions, {
            ...ORDER_FILTER_CONFIG,
            filters: [
                ...(filterOptions.filters || []),
                {
                    field: "userId",
                    operator: "equals" as const,
                    value: user.id,
                }
            ]
        });

        const result = await FilterService.executePaginatedQuery(
            prisma.order,
            filterOptions
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