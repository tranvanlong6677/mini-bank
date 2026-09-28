import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { 
  ApiResponse, 
  AuthRequest, 
  RegisterRequest, 
  AuthResponse, 
  UserRequest, 
  UserResponse 
} from '../types';

const API_BASE_URL = 'http://localhost:7000/api';

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm JWT token vào header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Extend config để track retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Interceptor để xử lý response errors và auto refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Gọi API refresh token
          const response = await axios.post<ApiResponse<AuthResponse>>(
            `${API_BASE_URL}/auth/refresh`, 
            { refreshToken }
          );

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry request với token mới
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh token cũng hết hạn -> logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } else {
        // Không có refresh token -> logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== Auth APIs ====================
export const authApi = {
  login: (credentials: AuthRequest) => 
    api.post<ApiResponse<AuthResponse>>('/auth/login', credentials),
  
  register: (data: RegisterRequest) => 
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  
  refresh: (refreshToken: string) => 
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken }),
  
  logout: (refreshToken: string) => 
    api.post<ApiResponse<void>>('/auth/logout', { refreshToken }),
  
  logoutAll: () => 
    api.post<ApiResponse<void>>('/auth/logout-all'),
};

// ==================== User APIs ====================
export const userApi = {
  getAll: () => 
    api.get<ApiResponse<UserResponse[]>>('/users'),
  
  getById: (id: number) => 
    api.get<ApiResponse<UserResponse>>(`/users/${id}`),
  
  create: (data: UserRequest) => 
    api.post<ApiResponse<UserResponse>>('/users', data),
  
  update: (id: number, data: UserRequest) => 
    api.put<ApiResponse<UserResponse>>(`/users/${id}`, data),
  
  delete: (id: number) => 
    api.delete<ApiResponse<void>>(`/users/${id}`),
};

export default api;
