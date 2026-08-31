import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './useAuth';
import type { AuthState } from '../supabase/types';

type AuthContextValue = AuthState & {
  signUp: (name: string, email: string, phone: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resend: (email: string) => Promise<void>;
  recoveryMode: boolean;
  profileError: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const value = useMemo(() => auth, [auth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
