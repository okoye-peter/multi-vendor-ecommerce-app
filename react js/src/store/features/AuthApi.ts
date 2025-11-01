// authApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { loginData, PasswordResetData, User } from "../types/Index.ts";
import type { LogoutResponse } from '../../types/Index.ts';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        credentials: 'include', // ✅ send cookies with every request
    }),
    tagTypes: ['user'],
    endpoints: (builder) => ({
        login: builder.mutation<{ user: User, message: string }, loginData>({
            query: (loginData) => ({
                url: '/auth/login',
                method: 'POST',
                body: loginData,
            }),
        }),
        register: builder.mutation<{ user: User, message: string }, FormData>({
            query: (formData: FormData) => ({
                url: '/auth/register',
                method: 'POST',
                body: formData,
            }),
        }),
        logout: builder.mutation<LogoutResponse, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),
        sendPasswordResetAuthenticationCode: builder.mutation<{ message: string }, { email: string }>({
            query: ({ email }) => ({
                url: '/auth/password/reset/code',
                method: 'POST',
                body: { email },
            }),
        }),
        resetPassword: builder.mutation<{ message: string }, PasswordResetData>({
            query: (passwordResetData) => ({
                url: '/auth/password/reset',
                method: 'POST',
                body: passwordResetData,
            }),
        }),
        resendEmailVerificationCode: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/auth/email/verification/code/resend',
                method: 'POST'
            })
        }),
        verifyEmail: builder.mutation<{ message: string }, { verificationCode: string }>({
            query: (verificationCode) => ({
                url: '/auth/email/verify',
                method: 'POST',
                body: verificationCode,
            }),
            invalidatesTags: ['user']
        }),
        getAuthenticatedUser: builder.query<{user: User, message: string}, void>({
            query: () => '/auth/user',
            providesTags: ['user']
        }),
    }),
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useLogoutMutation,
    useSendPasswordResetAuthenticationCodeMutation,
    useResetPasswordMutation,
    useVerifyEmailMutation,
    useGetAuthenticatedUserQuery,
    useResendEmailVerificationCodeMutation
} = authApi;