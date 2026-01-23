/**
 * Axios integration for authenticated API clients.
 */
import type { AxiosInstance } from 'axios';
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
export declare function createAuthenticatedClient(axios: {
    create: (config: Record<string, unknown>) => AxiosInstance;
}, config: AuthenticatedClientConfig): AxiosInstance;
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
export declare function attachBearerToken(client: AxiosInstance, tokenGetter: () => string | null): void;
/**
 * API error type classification.
 */
export type ApiErrorType = 'network' | 'timeout' | 'unauthorized' | 'forbidden' | 'not_found' | 'validation' | 'server' | 'unknown';
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
export declare function classifyError(error: unknown, axiosModule?: {
    isAxiosError: (e: unknown) => boolean;
}): ApiError;
/**
 * Extract error message from an error (axios or standard).
 */
export declare function getErrorMessage(error: unknown): string;
//# sourceMappingURL=axios.d.ts.map