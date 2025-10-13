import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from '../types/Index.ts';

const initialState = {
    user: null as User | null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {

    }
})


export default authSlice.reducer
