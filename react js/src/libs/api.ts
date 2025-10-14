import type { loginData, PasswordResetData, registrationData } from "../types/Index.ts";
import axiosInstance from "./axios.ts";
// import { AxiosError } from "axios";


export const login = async (loginData: loginData) => {
    const res = await axiosInstance.post('/auth/login', loginData);
    return res.data
}

export const register = async (registrationData: registrationData) => {
    const res = await axiosInstance.post('/auth/register', registrationData)
    return res.data;
}

export const logout = async () => {
    const response = await axiosInstance.post("/auth/logout");
    return response.data
}

export const sendPasswordResetAuthenticationCode = async (email: string) => {
    const res = await axiosInstance.post('/auth/password/reset/code', {email})
    return res.data
}

export const resetPassword = async (passwordResetData: PasswordResetData) => {
    const res = await axiosInstance.post('/auth/password/reset', passwordResetData)
    return res.data
}

export const verifyEmail = async (verificationCode: string) => {
    const res = await axiosInstance.post('/auth/verify-email', {verificationCode})
    return res.data
}

export const getAuthUser = async () => {
    const res = await axiosInstance.get('/auth/user')
    return res.data;
}