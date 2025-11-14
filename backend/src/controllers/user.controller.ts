// controllers/userController.ts
import { RequestHandler } from 'express';
import { FilterService } from '../services/filterService';
import { USER_FILTER_CONFIG } from '../config/filterConfigs';
import prisma from '../libs/prisma';

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