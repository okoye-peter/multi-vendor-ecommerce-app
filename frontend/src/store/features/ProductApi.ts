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
        getProducts: builder.query<ProductsResponse, { page?: number; limit?: number; search?: string; categoryId?: string; departmentId?: string }>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.page) searchParams.append('page', params.page.toString());
                if (params.limit) searchParams.append('limit', params.limit.toString());
                if (params.search) searchParams.append('search', params.search);
                if (params.categoryId) searchParams.append('categoryId', params.categoryId);
                if (params.departmentId) searchParams.append('departmentId', params.departmentId);
                
                return {
                    url: `/products?${searchParams.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: ['Product'],
        }),
        getProductBySlug: builder.query<{ data: Product }, string>({
            query: (slug) => `/products/${slug}`,
            providesTags: (result, error, slug) => [{ type: 'Product', id: slug }],
        }),
        getCategories: builder.query<Category[], void>({
            query: () => '/categories',
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
