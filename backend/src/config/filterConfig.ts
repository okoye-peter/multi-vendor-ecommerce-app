// config/filterConfigs.ts

/**
 * Product Filter Configuration
 */
export const PRODUCT_FILTER_CONFIG = {
    searchFields: [
        'name',
        'description',
        'slug',
        'category.name',
        'department.name',
        'vendor.name',
        'vendor.address',
    ],
    include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, slug: true } },
        vendor: { select: { id: true, name: true, address: true } },
    },
};

/**
 * Order Filter Configuration
 */
export const ORDER_FILTER_CONFIG = {
    searchFields: [
        'orderNumber',
        'user.name',
        'user.email',
        'vendor.name',
        'shippingAddress',
        'status',
    ],
    include: {
        user: { select: { id: true, name: true, email: true } },
        vendor: { select: { id: true, name: true } },
        orderItems: {
            include: {
                product: { select: { id: true, name: true, price: true } },
            },
        },
    },
};

/**
 * User Filter Configuration
 */
export const USER_FILTER_CONFIG = {
    searchFields: [
        'name',
        'email',
        'phone',
        'address',
        'role',
    ],
    include: {
        vendor: { select: { id: true, name: true } },
    },
};

/**
 * Vendor Filter Configuration
 */
export const VENDOR_FILTER_CONFIG = {
    searchFields: [
        'name',
        'email',
        'phone',
        'address',
        'description',
        'user.name',
        'user.email',
    ],
    include: {
        user: { select: { id: true, name: true, email: true } },
    },
};

/**
 * Category Filter Configuration
 */
export const CATEGORY_FILTER_CONFIG = {
    searchFields: [
        'name',
        'slug',
        'description',
    ],
    include: {
        _count: { select: { products: true } },
    },
};

/**
 * Department Filter Configuration
 */
export const DEPARTMENT_FILTER_CONFIG = {
    searchFields: [
        'name',
        'slug',
        'description',
    ],
    include: {
        _count: { select: { products: true } },
    },
};