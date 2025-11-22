import type { ProductData } from "../pages/vendor/products/modals/Create.tsx";
import type { Country, LGA, State, loginData, PasswordResetData, Vendor } from "../types/Index.ts";
import axiosInstance from "./axios.ts";
// import { AxiosError } from "axios";


export const login = async (loginData: loginData) => {
    const res = await axiosInstance.post('/auth/login', loginData);
    return res.data
}

export const register = async (registrationData: FormData) => {
    const res = await axiosInstance.post('/auth/register', registrationData)
    return res.data;
}

export const logout = async () => {
    const response = await axiosInstance.post("/auth/logout");
    return response.data
}

export const sendPasswordResetAuthenticationCode = async (email: string) => {
    const res = await axiosInstance.post('/auth/password/reset/code', { email })
    return res.data
}

export const resetPassword = async (passwordResetData: PasswordResetData) => {
    const res = await axiosInstance.post('/auth/password/reset', passwordResetData)
    return res.data
}

export const verifyEmail = async (verificationCode: string) => {
    const res = await axiosInstance.post('/auth/verify-email', { verificationCode })
    return res.data
}

export const getAuthUser = async () => {
    const res = await axiosInstance.get('/auth/user')
    return res.data;
}

export const getCountries = async (): Promise<Country[]> => {
    const response = await axiosInstance.get('/locations/countries');
    return response.data;
};

export const getStatesByCountry = async (countryId: number): Promise<State[]> => {
    const response = await axiosInstance.get(`/locations/${countryId}/states`);
    return response.data;
};

export const getLGAsByState = async (stateId: number): Promise<LGA[]> => {
    const response = await axiosInstance.get(`/locations/${stateId}/lgas`);
    return response.data;
};

export const getAllCategory = async () => {
    const response = await axiosInstance.get('/categories')
    return response.data
}

export const getAllDepartments = async () => {
    const response = await axiosInstance.get('/departments')
    return response.data
}

export const getUserVendors = async () => {
    const response = await axiosInstance.get('/vendors/');
    return response.data
}

export const createProduct = async (vendorId: number, productData: FormData) => {
    const response = await axiosInstance.post(`/vendors/${vendorId}/products`, productData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
}

export const updateProduct = async (vendorId: number, productId: number, productData: FormData) => {
    const response = await axiosInstance.put(`/vendors/${vendorId}/products/${productId}`, productData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
}

export const getProductForEdit = async (vendorId: number, productId: number) => {
    const response = await axiosInstance.get(`vendors/${vendorId}/products/${productId}`);
    return response.data
}

export const deleteProduct = async (vendorId: number, productId: number) => {
    const response = await axiosInstance.delete(`/vendors/${vendorId}/products/${productId}`)
    return response.data
}

export const toggleProductPublicity = async (vendorId: number, productId: number) => {
    const response = await axiosInstance.put(`/vendors/${vendorId}/products/${productId}/publish`)
    return response.data
}

export const getProduct = async (vendorId: number, productId: number) => {
    const response = await axiosInstance.get(`/vendors/${vendorId}/products/${productId}`);
    return response.data;
}