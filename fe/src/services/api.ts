import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { 
  ApiResponse, 
  AuthRequest, 
  RegisterRequest, 
  AuthResponse, 
  UserRequest, 
  UserResponse,
  Post,
  PostRequest
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

// Flag để tránh gọi refresh nhiều lần cùng lúc
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor để xử lý response errors và auto refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    const status = error.response?.status;

    // Nếu lỗi 401 hoặc 403 và chưa retry
    if ((status === 401 || status === 403) && originalRequest && !originalRequest._retry) {
      
      // Nếu đang refresh token, đợi kết quả
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Gọi API refresh token (dùng axios trực tiếp, không qua interceptor)
          const response = await axios.post<ApiResponse<AuthResponse>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Process các request đang đợi
          processQueue(null, accessToken);

          // Retry request gốc với token mới
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token cũng hết hạn hoặc invalid -> logout
          processQueue(refreshError as AxiosError, null);
          
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
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

// ==================== Post APIs (External) ====================
export const postApi = {
  getAll: () => 
    api.get<ApiResponse<Post[]>>('/external/posts'),
  
  getById: (id: number) => 
    api.get<ApiResponse<Post>>(`/external/posts/${id}`),
  
  getByUserId: (userId: number) => 
    api.get<ApiResponse<Post[]>>(`/external/posts/user/${userId}`),
  
  create: (data: PostRequest) => 
    api.post<ApiResponse<Post>>('/external/posts', data),
};

export default api;
