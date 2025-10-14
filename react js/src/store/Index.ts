import { configureStore } from "@reduxjs/toolkit";
import AuthSliceReducer from './AuthSlice.ts';
import { authApi } from './features/AuthApi.ts';


export const store = configureStore({
    reducer: {
        auth: AuthSliceReducer,
        [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;