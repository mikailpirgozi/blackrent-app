/**
 * API Client Configuration
 * Centralized axios instance with interceptors and error handling
 */

import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, ERROR_MESSAGES, STORAGE_KEYS } from './constants';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  _meta?: Record<string, unknown>;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request in debug mode
      if (__DEV__) {
        console.log('🌐 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
          data: config.data,
        });
      }

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in debug mode
    if (__DEV__) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log error in debug mode
    if (__DEV__) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          // Attempt to refresh token
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data.data;
          await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed - logout user
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
        
        // Trigger logout event (will be handled by AuthContext)
        // You can emit a custom event here or use a state management solution
        
        return Promise.reject(new ApiError(ERROR_MESSAGES.UNAUTHORIZED, 401, 'UNAUTHORIZED'));
      }
    }

    // Transform error to ApiError
    const apiError = transformError(error);
    return Promise.reject(apiError);
  }
);

/**
 * Transform axios error to ApiError
 */
function transformError(error: AxiosError<ApiResponse>): ApiError {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    const message = data?.error || data?.message || getErrorMessageByStatus(status);
    
    return new ApiError(message, status, data?.code, data);
  } else if (error.request) {
    // Request made but no response
    return new ApiError(ERROR_MESSAGES.NETWORK_ERROR, undefined, 'NETWORK_ERROR');
  } else {
    // Something else happened
    return new ApiError(error.message || ERROR_MESSAGES.UNKNOWN_ERROR, undefined, 'UNKNOWN_ERROR');
  }
}

/**
 * Get error message by HTTP status code
 */
function getErrorMessageByStatus(status: number): string {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 500:
    case 502:
    case 503:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

/**
 * Generic GET request
 */
export async function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params, ...config });
  
  if (response.data.success) {
    return response.data.data as T;
  }
  
  throw new ApiError(
    response.data.error || ERROR_MESSAGES.UNKNOWN_ERROR,
    response.status,
    response.data.code
  );
}

/**
 * Generic POST request
 */
export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  
  if (response.data.success) {
    return response.data.data as T;
  }
  
  throw new ApiError(
    response.data.error || ERROR_MESSAGES.UNKNOWN_ERROR,
    response.status,
    response.data.code
  );
}

/**
 * Generic PUT request
 */
export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, data, config);
  
  if (response.data.success) {
    return response.data.data as T;
  }
  
  throw new ApiError(
    response.data.error || ERROR_MESSAGES.UNKNOWN_ERROR,
    response.status,
    response.data.code
  );
}

/**
 * Generic DELETE request
 */
export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  
  if (response.data.success) {
    return response.data.data as T;
  }
  
  throw new ApiError(
    response.data.error || ERROR_MESSAGES.UNKNOWN_ERROR,
    response.status,
    response.data.code
  );
}

/**
 * Upload file (multipart/form-data)
 */
export async function uploadFile<T = unknown>(
  url: string,
  file: File | Blob,
  fieldName = 'file',
  additionalData?: Record<string, unknown>,
  onProgress?: (progress: number) => void
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  const response = await apiClient.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  if (response.data.success) {
    return response.data.data as T;
  }

  throw new ApiError(
    response.data.error || ERROR_MESSAGES.UNKNOWN_ERROR,
    response.status,
    response.data.code
  );
}

// Export axios instance for custom use
export { apiClient };
export default apiClient;



