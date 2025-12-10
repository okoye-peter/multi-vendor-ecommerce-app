// services/filterService.ts

import { Prisma } from '@prisma/client';

/**
 * Filter operators supported by the service
 */
export type FilterOperator =
    | 'equals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'in'
    | 'notIn'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'between';

/**
 * Single filter condition
 */
export interface FilterCondition {
    field: string;
    operator: FilterOperator;
    value: string | number | boolean | string[] | number[] | Date | null;
}

/**
 * Filter options for the service
 */
export interface FilterOptions {
    search?: string;
    searchFields?: string[];
    filters?: FilterCondition[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    include?: Record<string, boolean | object>;
    select?: Record<string, boolean>;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/**
 * Reusable Filter Service Class
 */
export class FilterService {
    /**
     * Build Prisma WHERE clause from filter options
     */
    static buildWhereClause(options: FilterOptions): Record<string, unknown> {
        const where: Record<string, unknown> = {};

        // Global search across multiple fields (always uses OR)
        if (options.search && options.searchFields && options.searchFields.length > 0) {
            where.OR = options.searchFields.map(field => {
                // Handle nested fields (e.g., "category.name")
                if (field.includes('.')) {
                    const parts = field.split('.');
                    const relation = parts[0];
                    const nestedField = parts[1];

                    if (!relation || !nestedField) return {};

                    return {
                        [relation]: {
                            [nestedField]: {
                                contains: options.search,
                                mode: 'insensitive' as Prisma.QueryMode,
                            },
                        },
                    };
                }

                // Handle regular fields
                return {
                    [field]: {
                        contains: options.search,
                        mode: 'insensitive' as Prisma.QueryMode,
                    },
                };
            });
        }

        // Apply specific filters (always uses AND)
        if (options.filters && options.filters.length > 0) {
            options.filters.forEach(filter => {
                const { field, operator, value } = filter;

                // Skip if value is empty/null
                if (value === null || value === undefined || value === '') return;

                // Handle nested fields
                if (field.includes('.')) {
                    const parts = field.split('.');
                    const relation = parts[0];
                    const nestedField = parts[1];

                    if (!relation || !nestedField) return;

                    // Special handling: if filtering by relation.id, convert to relationId
                    if (nestedField === 'id' && typeof value === 'number') {
                        const relationIdField = `${relation}Id`;
                        where[relationIdField] = this.getOperatorClause(operator, value);
                    } else {
                        if (!where[relation]) {
                            where[relation] = {};
                        }

                        (where[relation] as Record<string, unknown>)[nestedField] = this.getOperatorClause(operator, value);
                    }
                } else {
                    // Handle regular fields
                    where[field] = this.getOperatorClause(operator, value);
                }
            });
        }

        return where;
    }

    /**
     * Get Prisma operator clause based on filter operator
     */
    private static getOperatorClause(
        operator: FilterOperator,
        value: string | number | boolean | string[] | number[] | Date | null
    ): Record<string, unknown> | string | number | boolean | Date | null {
        switch (operator) {
            case 'equals':
                return { equals: value };

            case 'contains':
                return { contains: value, mode: 'insensitive' as Prisma.QueryMode };

            case 'startsWith':
                return { startsWith: value, mode: 'insensitive' as Prisma.QueryMode };

            case 'endsWith':
                return { endsWith: value, mode: 'insensitive' as Prisma.QueryMode };

            case 'in':
                return { in: Array.isArray(value) ? value : [value] };

            case 'notIn':
                return { notIn: Array.isArray(value) ? value : [value] };

            case 'lt':
                return { lt: value };

            case 'lte':
                return { lte: value };

            case 'gt':
                return { gt: value };

            case 'gte':
                return { gte: value };

            case 'between':
                if (Array.isArray(value) && value.length === 2) {
                    return { gte: value[0], lte: value[1] };
                }
                return {};

            default:
                return { equals: value };
        }
    }

    /**
     * Build ORDER BY clause
     */
    static buildOrderByClause(options: FilterOptions): Record<string, unknown> | undefined {
        if (!options.sortBy) return undefined;

        const sortOrder = options.sortOrder || 'asc';

        // Handle nested sorting (e.g., "category.name")
        if (options.sortBy.includes('.')) {
            const parts = options.sortBy.split('.');
            const relation = parts[0];
            const field = parts[1];

            if (!relation || !field) return undefined;

            return {
                [relation]: {
                    [field]: sortOrder,
                },
            };
        }

        return {
            [options.sortBy]: sortOrder,
        };
    }

    /**
     * Calculate pagination values
     */
    static getPagination(options: FilterOptions) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.max(1, Math.min(100, options.limit || 10)); // Max 100 items per page
        const skip = (page - 1) * limit;

        return { page, limit, skip };
    }

    /**
     * Build complete Prisma query options
     */
    static buildQueryOptions(options: FilterOptions) {
        const { page, limit, skip } = this.getPagination(options);

        return {
            where: this.buildWhereClause(options),
            orderBy: this.buildOrderByClause(options),
            skip,
            take: limit,
            include: options.include,
            select: options.select,
        };
    }

    /**
     * Execute paginated query with any Prisma model
     */
    static async executePaginatedQuery<T>(
        model: {
            findMany: (args?: any) => Promise<T[]>;
            count: (args?: any) => Promise<number>;
        },
        options: FilterOptions
    ): Promise<PaginatedResponse<T>> {
        const { page, limit } = this.getPagination(options);
        const queryOptions = this.buildQueryOptions(options);

        // Execute both queries in parallel
        const [data, total] = await Promise.all([
            model.findMany(queryOptions),
            model.count({ where: queryOptions.where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Parse query parameters from request
     */
    static parseQueryParams(query: Record<string, unknown>): FilterOptions {
        const options: FilterOptions = {
            page: typeof query.page === 'string' ? parseInt(query.page) : 1,
            limit: typeof query.limit === 'string' ? parseInt(query.limit) : 10,
            sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc',
        };

        // Only set optional properties if they have values
        if (typeof query.sortBy === 'string') {
            options.sortBy = query.sortBy;
        }

        if (typeof query.search === 'string') {
            options.search = query.search;
        }

        // Parse search fields (comma-separated)
        if (typeof query.searchFields === 'string') {
            options.searchFields = query.searchFields.split(',').map((f: string) => f.trim());
        }

        // Parse filters from query params
        const filters: FilterCondition[] = [];

        Object.keys(query).forEach(key => {
            // Skip pagination, sorting, and special params
            if (['page', 'limit', 'sortBy', 'sortOrder', 'search', 'searchFields', 'start_date', 'end_date'].includes(key)) {
                return;
            }

            // Handle filter syntax: field[operator]=value
            const operatorMatch = key.match(/^(.+)\[(.+)\]$/);
            
            if (operatorMatch) {
                const field = operatorMatch[1];
                const operator = operatorMatch[2];

                if (field && operator) {
                    filters.push({
                        field,
                        operator: operator as FilterOperator,
                        value: this.parseValue(query[key]),
                    });
                }
            } else {
                const value = this.parseValue(query[key]);
                
                // Handle nested field filtering intelligently
                if (key.includes('.')) {
                    const parts = key.split('.');
                    if (parts.length === 2) {
                        const [relation, field] = parts;
                        
                        // If value is numeric and field is 'id', use direct foreign key
                        if (field === 'id' && typeof value === 'number') {
                            filters.push({
                                field: `${relation}Id`,
                                operator: 'equals',
                                value: value,
                            });
                        } else {
                            // For other nested fields (like name), use the nested path
                            // Determine operator based on field type
                            const operator = field === 'name' || typeof value === 'string' 
                                ? 'contains' 
                                : 'equals';
                            
                            filters.push({
                                field: key,
                                operator: operator as FilterOperator,
                                value: value,
                            });
                        }
                        return;
                    }
                }
                
                // Handle direct ID fields (categoryId, departmentId, etc.)
                if (key.endsWith('Id') && typeof value === 'number') {
                    filters.push({
                        field: key,
                        operator: 'equals',
                        value: value,
                    });
                    return;
                }
                
                // Default: use 'equals' for numbers/booleans, 'contains' for strings
                const operator = typeof value === 'string' ? 'contains' : 'equals';
                filters.push({
                    field: key,
                    operator: operator as FilterOperator,
                    value: value,
                });
            }
        });

         // Handle date range filters
    if (typeof query.start_date === 'string') {
        const dateFrom = new Date(query.start_date);
        if (!isNaN(dateFrom.getTime())) {
            filters.push({
                field: 'createdAt',
                operator: 'gte',
                value: dateFrom,
            });
        }
    }

    if (typeof query.end_date === 'string') {
        const dateTo = new Date(query.end_date);
        if (!isNaN(dateTo.getTime())) {
            // Add one day to include the entire end date
            dateTo.setDate(dateTo.getDate() + 1);
            filters.push({
                field: 'createdAt',
                operator: 'lte',
                value: dateTo,
            });
        }
    }

        if (filters.length > 0) {
            options.filters = filters;
        }

        return options;
    }

    /**
     * Parse query parameter value to appropriate type
     */
    private static parseValue(value: unknown): string | number | boolean | string[] | number[] | Date | null {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === 'string') {
            // Check if it's a comma-separated list
            if (value.includes(',')) {
                const items = value.split(',').map(v => v.trim());
                // Try to convert to numbers if all items are numeric
                if (items.every(item => !isNaN(Number(item)) && item !== '')) {
                    return items.map(item => Number(item));
                }
                return items;
            }

            // Check if it's a number
            if (!isNaN(Number(value)) && value !== '') {
                return Number(value);
            }

            // Check if it's a boolean
            if (value === 'true') return true;
            if (value === 'false') return false;

            // Check if it's a date
            const date = new Date(value);
            if (!isNaN(date.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                return date;
            }

            return value;
        }

        return value as string | number | boolean;
    }
}