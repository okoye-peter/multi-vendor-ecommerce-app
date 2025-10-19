import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from '../../types/Index.ts';
import { authApi } from './features/AuthApi.ts';

const initialState = {
    user: null as User | null,
    showEmailVerificationModal: false
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload
        },
        logout: (state) => {
            state.user = null;
        },
        setShowEmailVerificationModal: (state, action: PayloadAction<boolean>) => {
            state.showEmailVerificationModal = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle RTK Query fulfilled action
            .addMatcher(authApi.endpoints.getAuthenticatedUser.matchFulfilled, (state, action) => {
                state.user = action.payload;
            });
    }
})


export const { setUser, setShowEmailVerificationModal } = authSlice.actions;
export default authSlice.reducer
