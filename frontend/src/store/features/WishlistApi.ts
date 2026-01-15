import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Wishlist } from "../../types/Index";


export const wishlistApi = createApi({
    reducerPath: 'wishlistApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include'
    }),
    tagTypes: ['wishlist'],
    endpoints: (builder) => ({
        getUserWishlist: builder.query<Wishlist[], void>({
            query: () => ({
                url: '/wishlists',
                method: 'GET'
            })
        }),
        toggleProductInWishlist: builder.mutation<{ message: string, wishlist: Wishlist }, { productId: number }>({
            query: ({ productId }) => ({
                url: `/wishlists/${productId}`,
                method: 'POST'
            })
        }),
        clearWishlist: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: `/wishlists`,
                method: 'DELETE'
            })
        }),
        moveWishlistItemsToCart: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: `/wishlists/add-to-cart`,
                method: 'POST'
            })
        })
    })
})

export const {
    useGetUserWishlistQuery,
    useLazyGetUserWishlistQuery,
    useMoveWishlistItemsToCartMutation,
    useToggleProductInWishlistMutation,
    useClearWishlistMutation,
} = wishlistApi