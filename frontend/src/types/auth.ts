export type AuthChangeEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'TOKEN_REFRESHED'
  | 'MFA_CHALLENGE';

export interface Subscription {
  unsubscribe(): void;
}

export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  identities: unknown[];
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

export interface AuthClient {
  getSession(): Promise<{
    data: { session: Session | null };
    error: { message: string } | null;
  }>;
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>
  ): { data: { subscription: Subscription } };
  setSession(currentSession: { access_token: string; refresh_token: string }): Promise<{
    data: { session: Session | null; user: User | null };
    error: { message: string } | null;
  }>;
  getUser(): Promise<{
    data: { user: User | null };
    error: { message: string } | null;
  }>;
  signOut(): Promise<{
    error: { message: string } | null;
  }>;
  initialize(): Promise<{ error: { message: string } | null }>;
}
