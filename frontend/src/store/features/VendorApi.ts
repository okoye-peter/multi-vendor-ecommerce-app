import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { PaginationInfo } from '../../types/Index.ts';

export interface PublicVendor {
    id: number;
    name: string;
    address: string;
    state: { id: number; name: string } | null;
    _count: { products: number };
    createdAt: string;
}

export interface VendorsResponse {
    data: PublicVendor[];
    pagination: PaginationInfo;
}

export const vendorApi = createApi({
    reducerPath: 'vendorApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        getPublicVendors: builder.query<VendorsResponse, { page?: number; limit?: number; search?: string }>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.page) searchParams.append('page', params.page.toString());
                if (params.limit) searchParams.append('limit', params.limit.toString());
                if (params.search) searchParams.append('search', params.search);
                return `/vendors/public?${searchParams.toString()}`;
            },
        }),
    }),
});

export const { useGetPublicVendorsQuery } = vendorApi;
