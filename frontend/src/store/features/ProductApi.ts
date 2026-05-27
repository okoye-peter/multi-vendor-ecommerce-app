import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Product, Category, Department, PaginationInfo } from "../../types/Index.ts";

export interface ProductsResponse {
    data: Product[];
    pagination: PaginationInfo;
    message?: string;
}

export const productApi = createApi({
    reducerPath: 'productApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include',
    }),
    tagTypes: ['Product', 'Category', 'Department'],
    endpoints: (builder) => ({
        getProducts: builder.query<ProductsResponse, { page?: number; limit?: number; search?: string; categoryId?: string; departmentId?: string; vendorId?: string }>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.page) searchParams.append('page', params.page.toString());
                if (params.limit) searchParams.append('limit', params.limit.toString());
                if (params.search) searchParams.append('search', params.search);
                if (params.categoryId) searchParams.append('categoryId', params.categoryId);
                if (params.departmentId) searchParams.append('departmentId', params.departmentId);
                if (params.vendorId) searchParams.append('vendorId', params.vendorId);
                
                return {
                    url: `/products?${searchParams.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['Product'],
        }),
        getProductBySlug: builder.query<{ product: Product; relatedProducts: Product[] }, string>({
            query: (slug) => `/products/${slug}`,
            providesTags: (result, error, slug) => [{ type: 'Product', id: slug }],
        }),
        getCategories: builder.query<Category[], { departmentId?: string; q?: string } | void>({
            query: (params) => {
                if (!params) return '/categories';
                const sp = new URLSearchParams();
                if (params.departmentId) sp.append('departmentId', params.departmentId);
                if (params.q) sp.append('q', params.q);
                const qs = sp.toString();
                return qs ? `/categories?${qs}` : '/categories';
            },
            providesTags: ['Category'],
        }),
        getDepartments: builder.query<Department[], void>({
            query: () => '/departments',
            providesTags: ['Department'],
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductBySlugQuery,
    useGetCategoriesQuery,
    useGetDepartmentsQuery,
} = productApi;
