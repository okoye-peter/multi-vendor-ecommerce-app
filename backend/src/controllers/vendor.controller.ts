import type { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { FilterService } from "../service/filterService.ts";
import { PRODUCT_FILTER_CONFIG } from "../config/filterConfig.ts";

const prisma = new PrismaClient();

export const getAuthUserVendors:RequestHandler = async (req, res, next) =>  {
    try {
        const user = req.user;

        const vendors = await prisma.vendor.findMany({
            where: {
                userId: user.id
            },
            include: {
                state: true
            }
        });

        return res.status(200).json(vendors)
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

export const getVendorProducts: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const { vendorId } = req.query;
        
        // Parse query params automatically
        const filterOptions = FilterService.parseQueryParams(req.query);
        
        // Get user's vendor IDs
        const vendors = await prisma.vendor.findMany({
            where: { userId: user.id },
            select: { id: true }
        });
        const vendorIds = vendors.map((v) => v.id);
        const vendorFilterIds = vendorId ? [Number(vendorId)] : vendorIds;

        // Apply configuration and vendor filter
        Object.assign(filterOptions, {
            ...PRODUCT_FILTER_CONFIG,
            filters: [
                ...(filterOptions.filters || []),
                {
                    field: "vendorId",
                    operator: "in" as const,
                    value: vendorFilterIds,
                }
            ]
        });

        const result = await FilterService.executePaginatedQuery(
            prisma.product,
            filterOptions
        );

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error instanceof Error
            ? { message: error.message, status: 500 }
            : { message: "Server Error", status: 500 }
        );
    }
};
