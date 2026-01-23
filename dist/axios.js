/**
 * Axios integration for authenticated API clients.
 */
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
function sleep(ms) {
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
export function createAuthenticatedClient(axios, config) {
    const { baseUrl, tokenGetter, onUnauthorized = () => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/dev') {
            window.location.href = '/dev';
        }
    }, timeout = 30000, withCredentials = true, } = config;
    const client = axios.create({
        baseURL: baseUrl,
        withCredentials,
        timeout,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    // Request interceptor: add Bearer token
    client.interceptors.request.use((reqConfig) => {
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
    client.interceptors.response.use((response) => response, async (error) => {
        const reqConfig = error.config;
        if (!reqConfig) {
            return Promise.reject(error);
        }
        const retryCount = parseInt(reqConfig.headers?.['x-retry-count'] || '0', 10);
        const status = error.response?.status;
        // Check if we should retry
        const shouldRetry = retryCount < RETRY_CONFIG.maxRetries &&
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
    });
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
export function attachBearerToken(client, tokenGetter) {
    client.interceptors.request.use((config) => {
        const token = tokenGetter();
        if (token) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    });
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
export function classifyError(error, axiosModule) {
    // Try to use axios.isAxiosError if available
    const isAxiosError = axiosModule?.isAxiosError ?? ((e) => {
        return typeof e === 'object' && e !== null && 'isAxiosError' in e;
    });
    if (!isAxiosError(error)) {
        return {
            type: 'unknown',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
            retryable: false,
        };
    }
    const axiosError = error;
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
export function getErrorMessage(error) {
    if (typeof error === 'object' && error !== null) {
        const axiosError = error;
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
//# sourceMappingURL=axios.js.map