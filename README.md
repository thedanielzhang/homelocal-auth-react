# @homelocal/auth

Reusable authentication library for Home.Local React applications.

## Features

- **AuthProvider** - React context for authentication state
- **useAuth hook** - Access auth state and methods
- **Token management** - Dual storage (memory + sessionStorage) with auto-renewal
- **Axios integration** - Automatic Bearer token attachment
- **Role helpers** - `hasRole`, `isAdmin`, `isDeveloper`, etc.
- **TypeScript** - Full type safety

## Installation

```bash
# From private npm registry
npm install @homelocal/auth@0.1.0

# Or with registry URL
npm install @homelocal/auth --registry https://npm.homelocal.internal/
```

## Quick Start

### 1. Wrap your app with AuthProvider

```tsx
import { AuthProvider } from '@homelocal/auth';

function App() {
  return (
    <AuthProvider config={{ authServiceUrl: 'https://auth.example.com' }}>
      <Router>
        <Routes />
      </Router>
    </AuthProvider>
  );
}
```

### 2. Use the useAuth hook

```tsx
import { useAuth } from '@homelocal/auth';

function UserProfile() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Create authenticated API clients

```tsx
import axios from 'axios';
import { createAuthenticatedClient, useAuth } from '@homelocal/auth';

// Create client outside component
const deployClient = createAuthenticatedClient(axios, {
  baseUrl: 'https://deploy.example.com',
  tokenGetter: () => {
    // Will be set up after AuthProvider mounts
    return sessionStorage.getItem('access_token');
  },
});

// Or use TokenManager from context
function MyComponent() {
  const { getTokenManager } = useAuth();

  useEffect(() => {
    const manager = getTokenManager();
    // manager.ensureAccessToken() for renewal
  }, [getTokenManager]);
}
```

## API Reference

### AuthProvider

```tsx
import { AuthProvider } from '@homelocal/auth';

<AuthProvider
  config={{
    authServiceUrl: 'https://auth.example.com',  // Required
    tokenStorageKey: 'access_token',             // Default
    tokenExpiryKey: 'access_token_expiry',       // Default
    loginPath: '/dev',                           // Default redirect path
    tokenRefreshBuffer: 60,                      // Seconds before expiry to refresh
    onUnauthorized: () => { /* custom handler */ },
  }}
>
  {children}
</AuthProvider>
```

### useAuth Hook

```tsx
const {
  // State
  user,           // User | null
  isAuthenticated, // boolean
  isLoading,      // boolean
  error,          // string | null

  // Actions
  login,          // (credentials) => Promise<void>
  logout,         // () => Promise<void>
  signup,         // (data) => Promise<void>
  refreshUser,    // () => Promise<User | null>
  refreshToken,   // () => Promise<void>
  clearError,     // () => void

  // Role checks
  hasRole,        // (role) => boolean
  hasAnyRole,     // (roles) => boolean
  isAdmin,        // boolean
  isDeveloper,    // boolean

  // Token manager
  getTokenManager, // () => TokenManagerInstance
} = useAuth();
```

### Protected Routes

```tsx
import { useRequireAuth, useRequireRole } from '@homelocal/auth';

// Require any authentication
function ProtectedPage() {
  const { user } = useRequireAuth();
  return <div>Welcome, {user?.name}</div>;
}

// Require specific role
function AdminPage() {
  const { hasRequiredRole } = useRequireRole('admin');

  if (!hasRequiredRole) {
    return <AccessDenied />;
  }

  return <AdminContent />;
}

// Require any of multiple roles
function DashboardPage() {
  const { hasRequiredRole } = useRequireRole(['dev', 'admin']);
  // ...
}
```

### Token Management

```tsx
import { createTokenManager, TokenManager } from '@homelocal/auth';

// Use default instance
const token = TokenManager.getToken();
TokenManager.setToken('jwt...', 3600);
TokenManager.clearToken();

// Or create custom instance
const manager = createTokenManager({
  storageKey: 'my_token',
  expiryBuffer: 120,
  tokenFetcher: async () => {
    // Fetch new token via OAuth refresh token
    const response = await fetch('/oauth/token', {
      method: 'POST',
      credentials: 'include', // Sends httpOnly refresh_token cookie
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'your-client-id',
      }),
    });
    return response.json();
  },
  onRenewalFailure: (error) => {
    console.error('Token renewal failed:', error);
    window.location.href = '/login';
  },
});

// Ensure valid token (auto-renews if expiring)
const token = await manager.ensureAccessToken();
```

### Axios Integration

```tsx
import axios from 'axios';
import { createAuthenticatedClient, attachBearerToken } from '@homelocal/auth';

// Option 1: Create new authenticated client
const client = createAuthenticatedClient(axios, {
  baseUrl: 'https://api.example.com',
  tokenGetter: () => TokenManager.getToken(),
  onUnauthorized: () => window.location.href = '/login',
  timeout: 30000,
  withCredentials: true,
});

// Option 2: Attach to existing client
const existingClient = axios.create({ baseURL: 'https://api.example.com' });
attachBearerToken(existingClient, () => TokenManager.getToken());
```

### Role Helpers

```tsx
import { hasRole, hasAnyRole, isAdmin, isDeveloper } from '@homelocal/auth';

// With User object
if (hasRole(user, 'admin')) { /* ... */ }
if (hasAnyRole(user, ['dev', 'admin'])) { /* ... */ }
if (isAdmin(user)) { /* ... */ }
if (isDeveloper(user)) { /* ... */ }
```

### Error Handling

```tsx
import { classifyError, getErrorMessage, type ApiError } from '@homelocal/auth/axios';

try {
  await client.get('/resource');
} catch (error) {
  // Get structured error
  const apiError: ApiError = classifyError(error, axios);
  console.log(apiError.type);     // 'unauthorized', 'forbidden', etc.
  console.log(apiError.retryable); // true/false

  // Or just get message
  const message = getErrorMessage(error);
}
```

## Migration from frontend-service

### Replace AuthContext

```tsx
// Before
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// After
import { AuthProvider, useAuth } from '@homelocal/auth';

// Update config
<AuthProvider config={{ authServiceUrl: AUTH_SERVICE_URL }}>
```

### Replace tokenManager

```tsx
// Before
import { setAccessToken, getAccessToken, clearAccessToken } from '../services/tokenManager';

// After
import { TokenManager } from '@homelocal/auth';

// setAccessToken -> TokenManager.setToken
// getAccessToken -> TokenManager.getToken
// clearAccessToken -> TokenManager.clearToken
```

### Replace axios-config

```tsx
// Before
import { deployClient, authClient } from '../services/axios-config';

// After
import axios from 'axios';
import { createAuthenticatedClient, TokenManager } from '@homelocal/auth';

export const authClient = axios.create({
  baseURL: AUTH_SERVICE_URL,
  withCredentials: true,
});

export const deployClient = createAuthenticatedClient(axios, {
  baseUrl: DEPLOY_SERVICE_URL,
  tokenGetter: () => TokenManager.getToken(),
});
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run type-check

# Run tests
npm test
```

## Publishing

See [PUBLISHING.md](./PUBLISHING.md) for instructions on publishing to private npm registry.
