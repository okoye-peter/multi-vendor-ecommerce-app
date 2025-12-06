// controllers/userController.ts
import type { RequestHandler } from 'express';
import { FilterService } from '../service/filterService.js';
import { USER_FILTER_CONFIG } from '../config/filter.config.js';
import prisma from '../libs/prisma.js';

export const getAllUsers: RequestHandler = async (req, res, next) => {
    try {
        const filterOptions = FilterService.parseQueryParams(req.query);
        Object.assign(filterOptions, USER_FILTER_CONFIG);

        const result = await FilterService.executePaginatedQuery(
            prisma.user,
            filterOptions
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};