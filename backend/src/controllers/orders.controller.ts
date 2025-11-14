// controllers/orderController.ts
import { RequestHandler } from 'express';
import { FilterService } from '../services/filterService';
import { ORDER_FILTER_CONFIG } from '../config/filterConfigs';
import prisma from '../libs/prisma';

export const getUserOrders: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
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