import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Cart, addToCartData  } from "../../types/Index";

export const cartApi = createApi({
    reducerPath: 'cartApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL + 'carts',
        credentials: 'include',
    }),
    tagTypes: ['cart'],
    endpoints: (builder) => ({
        getCarts: builder.query<Cart[], void>({
            query: () => ({
                url: '/',
                method: 'GET'
            })
        }), 
        addToCart: builder.mutation<{message: string, cart: Cart}, {cartData:  addToCartData}>({
            query: ({ cartData }) => ({
                url: '/',
                method: 'POST',
                body: cartData
            }),
        }),
        updateCart: builder.mutation<{message: string, cart: Cart}, {cartId:  number, quantity: number}>({
            query: ({ cartId, quantity }) => ({
                url: `/${cartId}`,
                method: 'PUT',
                body: { quantity }
            }),
        }),
        deleteCartItem: builder.mutation<{message: string, cart: Cart}, {cartId:  number}>({
            query: ({ cartId }) => ({
                url: `/${cartId}`,
                method: 'DELETE',
            }),
        })
    })
})

// export const {
//     useGetCartsQuery,
//     useDeleTeCartItemMutation,

// } = cartApi;

export const {
    useGetCartsQuery,
    useLazyGetCartsQuery,
    useDeleteCartItemMutation, 
    useAddToCartMutation, 
    useUpdateCartMutation, 
} = cartApi;