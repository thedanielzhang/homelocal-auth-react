/**
 * Shared AuthContext — used by both AuthProvider and ExternalTokenProvider.
 */

import { createContext } from 'react';
import type { AuthContextValue } from './AuthProvider';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
