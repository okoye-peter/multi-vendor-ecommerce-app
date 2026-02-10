import axios from 'axios';

const BASE_URL = import.meta.env.MODE === 'development' ? import.meta.env.VITE_API_URL : '/api'

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 120000 // 2 minutes timeout for file uploads
})

export default axiosInstance;