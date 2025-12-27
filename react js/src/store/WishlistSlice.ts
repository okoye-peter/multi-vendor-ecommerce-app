import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Wishlist } from "../types/Index";



const initialState: {
    wishlists: Wishlist[]
} = {
    wishlists: []
}


export const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState,
    reducers: {
        setWishlists: (state, action: PayloadAction<Wishlist[]>) => {
            state.wishlists = action.payload
        },
        emptyWishlist: (state) => {
            state.wishlists = []
        },
        // addToWishlist: (state, )
    }
})