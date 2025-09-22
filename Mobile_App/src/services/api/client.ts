import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Config from 'react-native-config';
import { useAuthStore } from '@store/authStore';
import { ApiResponse } from '@types/index';

// API client configuration
const API_BASE_URL = Config.API_BASE_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(Config.API_TIMEOUT || '30000', 10);

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add timestamp to prevent caching
    if (config.params) {
      config.params._t = Date.now();
    } else {
      config.params = { _t: Date.now() };
    }

    // Add authorization header if token exists
    const { token } = useAuthStore.getState();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (__DEV__) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('📤 Request Data:', JSON.stringify(config.data, null, 2));
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (__DEV__) {
      console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (__DEV__) {
      console.error(`❌ API Error: ${error.response?.status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);
      console.error('📥 Error Response:', error.response?.data);
    }

    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const success = await useAuthStore.getState().refreshToken();
        
        if (success) {
          // Retry original request with new token
          const { token } = useAuthStore.getState();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } else {
          // Refresh failed, logout user
          await useAuthStore.getState().logout();
          // You might want to navigate to login screen here
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await useAuthStore.getState().logout();
      }
    }

    // Handle other HTTP errors
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';

    // Create standardized error object
    const apiError = {
      message: errorMessage,
      status: error.response?.status,
      code: error.response?.data?.code,
      details: error.response?.data?.details,
    };

    return Promise.reject(apiError);
  }
);

// API client wrapper with typed responses
class ApiService {
  // Generic request method
  async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.request<ApiResponse<T>>(config);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  // POST request
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  // PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  // PATCH request
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // Upload file with progress tracking
  async uploadFile<T>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });
  }

  // Download file
  async downloadFile(url: string, onProgress?: (progress: number) => void): Promise<Blob> {
    try {
      const response = await apiClient.request({
        method: 'GET',
        url,
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(Math.round(progress));
          }
        },
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

// Create and export API service instance
export const api = new ApiService();

// Export individual methods for convenience
export const { get, post, put, patch, delete: del, uploadFile, downloadFile } = api;

// Network status helper
export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health', { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

export default apiClient;
