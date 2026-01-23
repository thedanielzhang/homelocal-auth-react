/**
 * Axios integration for authenticated API clients.
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Configuration for creating an authenticated axios client.
 */
export interface AuthenticatedClientConfig {
  /**
   * Base URL for the API.
   */
  baseUrl: string;

  /**
   * Function to get the current access token.
   * If not provided, must use attachBearerToken separately.
   */
  tokenGetter?: () => string | null;

  /**
   * Callback when a 401 response is received.
   * Default: redirect to /dev
   */
  onUnauthorized?: () => void;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * Whether to include credentials (cookies) with requests.
   * @default true
   */
  withCredentials?: boolean;
}

/**
 * Retry configuration for error handling.
 */
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an axios instance that automatically attaches Bearer token.
 *
 * @example
 * ```ts
 * import axios from 'axios';
 * import { createAuthenticatedClient } from '@homelocal/auth';
 * import { TokenManager } from '@homelocal/auth';
 *
 * const apiClient = createAuthenticatedClient(axios, {
 *   baseUrl: 'https://api.example.com',
 *   tokenGetter: () => TokenManager.getToken(),
 *   onUnauthorized: () => window.location.href = '/login',
 * });
 *
 * // Use the client
 * const response = await apiClient.get('/apps');
 * ```
 */
export function createAuthenticatedClient(
  axios: { create: (config: Record<string, unknown>) => AxiosInstance },
  config: AuthenticatedClientConfig
): AxiosInstance {
  const {
    baseUrl,
    tokenGetter,
    onUnauthorized = () => {
      if (typeof window !== 'undefined' && window.location.pathname !== '/dev') {
        window.location.href = '/dev';
      }
    },
    timeout = 30000,
    withCredentials = true,
  } = config;

  const client = axios.create({
    baseURL: baseUrl,
    withCredentials,
    timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: add Bearer token
  client.interceptors.request.use((reqConfig: InternalAxiosRequestConfig) => {
    // Add retry count header
    reqConfig.headers = reqConfig.headers || {};
    if (!reqConfig.headers['x-retry-count']) {
      reqConfig.headers['x-retry-count'] = '0';
    }

    // Add Bearer token if available
    if (tokenGetter) {
      const token = tokenGetter();
      if (token) {
        reqConfig.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return reqConfig;
  });

  // Response interceptor: handle errors and retries
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const reqConfig = error.config;

      if (!reqConfig) {
        return Promise.reject(error);
      }

      const retryCount = parseInt(reqConfig.headers?.['x-retry-count'] || '0', 10);
      const status = error.response?.status;

      // Check if we should retry
      const shouldRetry =
        retryCount < RETRY_CONFIG.maxRetries &&
        (!error.response || (status && RETRY_CONFIG.retryableStatuses.includes(status)));

      if (shouldRetry) {
        reqConfig.headers = reqConfig.headers || {};
        reqConfig.headers['x-retry-count'] = String(retryCount + 1);

        // Exponential backoff
        const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
        await sleep(delay);

        return client(reqConfig);
      }

      // Handle 401 errors
      if (status === 401) {
        onUnauthorized();
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Attach Bearer token interceptor to an existing axios instance.
 *
 * @example
 * ```ts
 * import axios from 'axios';
 * import { attachBearerToken, TokenManager } from '@homelocal/auth';
 *
 * const client = axios.create({ baseURL: 'https://api.example.com' });
 * attachBearerToken(client, () => TokenManager.getToken());
 * ```
 */
export function attachBearerToken(
  client: AxiosInstance,
  tokenGetter: () => string | null
): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenGetter();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });
}

/**
 * API error type classification.
 */
export type ApiErrorType =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'server'
  | 'unknown';

/**
 * Structured API error.
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  status?: number;
  retryable: boolean;
}

/**
 * Classify an axios error into a structured ApiError.
 *
 * @example
 * ```ts
 * try {
 *   await apiClient.get('/resource');
 * } catch (err) {
 *   const apiError = classifyError(err);
 *   if (apiError.retryable) {
 *     // Retry logic
 *   }
 * }
 * ```
 */
export function classifyError(
  error: unknown,
  axiosModule?: { isAxiosError: (e: unknown) => boolean }
): ApiError {
  // Try to use axios.isAxiosError if available
  const isAxiosError = axiosModule?.isAxiosError ?? ((e: unknown): boolean => {
    return typeof e === 'object' && e !== null && 'isAxiosError' in e;
  });

  if (!isAxiosError(error)) {
    return {
      type: 'unknown',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      retryable: false,
    };
  }

  const axiosError = error as {
    response?: { status: number; data?: { detail?: string; message?: string } };
    code?: string;
    message: string;
  };

  // Network error (no response)
  if (!axiosError.response) {
    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'Request timed out. Please check your connection and try again.',
        retryable: true,
      };
    }
    return {
      type: 'network',
      message: 'Unable to connect to the server. Please check your internet connection.',
      retryable: true,
    };
  }

  const status = axiosError.response.status;
  const serverMessage = axiosError.response.data?.detail || axiosError.response.data?.message;

  switch (status) {
    case 401:
      return {
        type: 'unauthorized',
        message: 'Your session has expired. Please log in again.',
        status,
        retryable: false,
      };
    case 403:
      return {
        type: 'forbidden',
        message: serverMessage || 'You do not have permission to perform this action.',
        status,
        retryable: false,
      };
    case 404:
      return {
        type: 'not_found',
        message: serverMessage || 'The requested resource was not found.',
        status,
        retryable: false,
      };
    case 400:
    case 422:
      return {
        type: 'validation',
        message: serverMessage || 'Invalid request. Please check your input.',
        status,
        retryable: false,
      };
    default:
      if (status >= 500) {
        return {
          type: 'server',
          message: serverMessage || 'A server error occurred. Please try again later.',
          status,
          retryable: true,
        };
      }
      return {
        type: 'unknown',
        message: serverMessage || 'An error occurred. Please try again.',
        status,
        retryable: false,
      };
  }
}

/**
 * Extract error message from an error (axios or standard).
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as {
      response?: { data?: { detail?: string } };
      message?: string;
    };
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
