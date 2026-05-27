import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Product, PaginationInfo, SubProduct } from '../../types/Index.ts';

export interface OrderGroup {
    id: number;
    ref_no: string;
    paymentRefNo: string;
    status: number;
    totalAmount: number;
    deliveredAt: string | null;
    createdAt: string;
    _count?: { orders: number };
}

export interface VendorOrder {
    id: number;
    productId: number | null;
    requestedQuantity: number;
    quantity: number;
    orderGroupId: number;
    priceOnPurchase: number;
    createdAt: string;
    product?: { id: number; name: string };
    orderGroup?: { id: number; ref_no: string; status: number };
    subProducts?: Array<{
        subProduct?: { id: number; batch_no: string; cost_price: number };
    }>;
}

export interface VendorInfo {
    id: number;
    name: string;
    address: string;
    stateId: number | null;
    state?: { id: number; name: string } | null;
    createdAt: string;
}

export interface DashboardStats {
    start_date: string;
    end_date: string;
    totalSales: number;
    totalOrders: number;
    pendingOrders: number;
}

export interface Paginated<T> {
    data: T[];
    pagination: PaginationInfo;
}

export interface OrderItem {
    id: number;
    productId: number;
    quantity: number;
    priceOnPurchase: number;
    createdAt: string;
    product?: {
        id: number;
        name: string;
        images?: { id: number; url: string; default: boolean }[];
    };
}

export interface OrderGroupDetail extends OrderGroup {
    orders: OrderItem[];
}

export const profileApi = createApi({
    reducerPath: 'profileApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include',
    }),
    tagTypes: ['CustomerOrders', 'VendorShops', 'VendorProducts', 'VendorOrders', 'Dashboard', 'Batches', 'ProductOrders'],
    endpoints: (builder) => ({
        // Customer
        getCustomerOrders: builder.query<Paginated<OrderGroup>, { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 10 }) => `/orders?page=${page}&limit=${limit}`,
            providesTags: ['CustomerOrders'],
        }),

        // Vendor — shops
        getAuthUserVendors: builder.query<VendorInfo[], void>({
            query: () => '/vendors/',
            providesTags: ['VendorShops'],
        }),

        // Vendor — products (all vendors of this user)
        getVendorProducts: builder.query<Paginated<Product>, { page?: number; limit?: number; search?: string; vendorId?: number }>({
            query: ({ page = 1, limit = 10, search, vendorId }) => {
                const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
                if (search) sp.append('search', search);
                if (vendorId) sp.append('vendorId', String(vendorId));
                return `/vendors/products?${sp.toString()}`;
            },
            providesTags: ['VendorProducts'],
        }),

        // Vendor — orders
        getVendorOrders: builder.query<Paginated<VendorOrder>, { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 10 }) => `/vendors/orders?page=${page}&limit=${limit}`,
            providesTags: ['VendorOrders'],
        }),

        // Vendor — dashboard stats
        getVendorDashboard: builder.query<DashboardStats, { vendorId: number; start_date?: string; end_date?: string }>({
            query: ({ vendorId, start_date, end_date }) => {
                const sp = new URLSearchParams();
                if (start_date) sp.append('start_date', start_date);
                if (end_date) sp.append('end_date', end_date);
                return `/vendors/${vendorId}/dashboard?${sp.toString()}`;
            },
            providesTags: ['Dashboard'],
        }),

        // Product batches / sub-products
        getProductBatches: builder.query<Paginated<SubProduct>, { vendorId: number; productId: number; page?: number }>({
            query: ({ vendorId, productId, page = 1 }) =>
                `/vendors/${vendorId}/products/${productId}/batches?page=${page}&limit=10`,
            providesTags: ['Batches'],
        }),

        // Customer — order details
        getOrderDetails: builder.query<{ order_group: OrderGroupDetail }, string>({
            query: (ref_no) => `/orders/${ref_no}`,
        }),

        // Product orders
        getProductOrders: builder.query<Paginated<VendorOrder>, { vendorId: number; productId: number; page?: number; limit?: number; start_date?: string; end_date?: string }>({
            query: ({ vendorId, productId, page = 1, limit = 10, start_date, end_date }) => {
                const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
                if (start_date) sp.append('createdAt_from', start_date);
                if (end_date) sp.append('createdAt_to', end_date);
                return `/vendors/${vendorId}/products/${productId}/orders?${sp.toString()}`;
            },
            providesTags: ['ProductOrders'],
        }),
    }),
});

export const {
    useGetCustomerOrdersQuery,
    useGetAuthUserVendorsQuery,
    useGetVendorProductsQuery,
    useGetVendorOrdersQuery,
    useGetVendorDashboardQuery,
    useGetProductBatchesQuery,
    useGetProductOrdersQuery,
    useGetOrderDetailsQuery,
    useLazyGetOrderDetailsQuery,
} = profileApi;
