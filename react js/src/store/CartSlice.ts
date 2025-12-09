import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Cart } from '../../types/Index.ts';

const initialState: {
    carts: Cart[]
} = {
    carts: []
};

const authSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setCarts: (state, action: PayloadAction<Cart[]>) => {
            state.carts = action.payload
            
        },
        emptyCart: (state) => {
            state.carts = []
        },
        addToCart: (state, action: PayloadAction<Cart>) => {
            state.carts = [...state.carts, action.payload]
        },
        updateCartItem: (state, action: PayloadAction<Cart>) => {
            const item = state.carts.find((cart: Cart) => cart.id === action.payload.id);

            if (item) {
                item.quantity = action.payload.quantity; 
            }
        },
        removeFromCart: (state, action: PayloadAction<Cart>) => {
            state.carts = state.carts.filter((cart: Cart) => cart.id != action.payload.id)
        }
    },
    // extraReducers: (builder) => {
    //     builder
    //         // Handle RTK Query fulfilled action
    //         .addMatcher(authApi.endpoints.getAuthenticatedUser.matchFulfilled, (state, action) => {
    //             state.user = action.payload;
    //         });
    // }
})


export const { 
    setCarts, 
    emptyCart, 
    addToCart, 
    updateCartItem,   
    removeFromCart 
} = authSlice.actions;

export default authSlice.reducer
