import { cartApi } from './features/CartApi.ts';
import { configureStore } from "@reduxjs/toolkit";
import AuthSliceReducer from './AuthSlice.ts';
import CartSlideReducer from './CartSlice.ts'
import { authApi } from './features/AuthApi.ts';


export const store = configureStore({
    reducer: {
        auth: AuthSliceReducer,
        [authApi.reducerPath]: authApi.reducer,
        cart: CartSlideReducer,
        [cartApi.reducerPath]: cartApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware).concat(cartApi.middleware),
    devTools: import.meta.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;