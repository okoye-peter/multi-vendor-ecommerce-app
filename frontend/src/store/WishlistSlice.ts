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
        addToWishlist: (state, action: PayloadAction<Wishlist>) => {
            state.wishlists = [...state.wishlists, action.payload]
        },
        removeFromWishlist: (state, action: PayloadAction<{ productId: number }>) => {
            state.wishlists = state.wishlists.filter((wishlist: Wishlist) => wishlist.productId != action.payload.productId)
        }
    }
})

export const { setWishlists, emptyWishlist, addToWishlist, removeFromWishlist } = wishlistSlice.actions

export default wishlistSlice.reducer