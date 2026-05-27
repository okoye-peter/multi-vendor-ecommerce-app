import { cartApi } from './features/CartApi.ts';
import { configureStore } from "@reduxjs/toolkit";
import AuthSliceReducer from './AuthSlice.ts';
import CartSlideReducer from './CartSlice.ts'
import { authApi } from './features/AuthApi.ts';
import { productApi } from './features/ProductApi.ts';
import WishlistSlideReducer from './WishlistSlice.ts'
import { wishlistApi } from './features/WishlistApi.ts';
import { vendorApi } from './features/VendorApi.ts';
import { profileApi } from './features/ProfileApi.ts';
import { orderApi } from './features/OrderApi.ts';


export const store = configureStore({
    reducer: {
        auth: AuthSliceReducer,
        [authApi.reducerPath]: authApi.reducer,
        cart: CartSlideReducer,
        [cartApi.reducerPath]: cartApi.reducer,
        [productApi.reducerPath]: productApi.reducer,
        wishlist: WishlistSlideReducer,
        [wishlistApi.reducerPath]: wishlistApi.reducer,
        [vendorApi.reducerPath]: vendorApi.reducer,
        [profileApi.reducerPath]: profileApi.reducer,
        [orderApi.reducerPath]: orderApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(authApi.middleware)
            .concat(cartApi.middleware)
            .concat(wishlistApi.middleware)
            .concat(productApi.middleware)
            .concat(vendorApi.middleware)
            .concat(profileApi.middleware)
            .concat(orderApi.middleware),
    devTools: import.meta.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;