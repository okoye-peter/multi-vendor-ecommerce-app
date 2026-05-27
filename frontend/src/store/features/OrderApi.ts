import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { cartApi } from './CartApi';

export interface CheckoutInitResponse {
    success: boolean;
    message: string;
    data: {
        authorizationUrl: string;
        accessCode: string;
        reference: string;
    };
}

export interface PaymentStatusResponse {
    success: boolean;
    message: string;
    order_ref_no?: string;
    data?: {
        id: number;
        ref_no: string;
        status: number;
        totalAmount: number;
        createdAt: string;
        paymentRefNo: string;
    };
}

export const orderApi = createApi({
    reducerPath: 'orderApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include',
    }),
    endpoints: (builder) => ({
        initializeCheckout: builder.mutation<CheckoutInitResponse, void>({
            query: () => ({ url: 'orders', method: 'POST' }),
            // Once payment is confirmed the cart is cleared server-side via webhook;
            // invalidate cartApi so the badge and cart page stay in sync.
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch { /* handled in component */ }
            },
        }),
        checkPaymentStatus: builder.query<PaymentStatusResponse, string>({
            query: (reference) => `orders/check-payment-status?reference=${encodeURIComponent(reference)}`,
        }),
    }),
});

export const { useInitializeCheckoutMutation, useCheckPaymentStatusQuery } = orderApi;
