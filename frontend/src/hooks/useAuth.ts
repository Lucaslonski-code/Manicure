import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import type { Profile, AuthState } from '../supabase/types';
import type { AuthClient, Session, AuthChangeEvent, Subscription } from '../types/auth';
import { signUp as signUpService, signIn as signInService, signOut as signOutService, resetPassword as resetPasswordService, updatePassword as updatePasswordService, fetchProfile as fetchProfileService, resendConfirmation } from '../services/auth/authService';
import { useNotifications } from './useNotifications';
import * as Linking from 'expo-linking';

const authClient = supabase.auth as AuthClient;

function extractTokensFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  const tokens: { access_token?: string; refresh_token?: string } = {};
  const hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    const hash = url.substring(hashIndex + 1);
    const params = new URLSearchParams(hash);
    tokens.access_token = params.get('access_token') || undefined;
    tokens.refresh_token = params.get('refresh_token') || undefined;
  }
  const queryIndex = url.indexOf('?');
  if (queryIndex >= 0) {
    const query = url.substring(queryIndex + 1, hashIndex >= 0 ? hashIndex : url.length);
    const params = new URLSearchParams(query);
    if (!tokens.access_token) tokens.access_token = params.get('access_token') || undefined;
    if (!tokens.refresh_token) tokens.refresh_token = params.get('refresh_token') || undefined;
  }
  return tokens;
}

export function useAuth(): AuthState & {
  signUp: (name: string, email: string, phone: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resend: (email: string) => Promise<void>;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { register: registerNotification, unregister: unregisterNotification } = useNotifications();

  const loadProfile = useCallback(async (userId: string) => {
    const profileData = await fetchProfileService(userId);
    if (profileData) {
      setProfile(profileData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let linkingSubscription: { remove: () => void } | null = null;

    authClient.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const handleUrl = async (event: { url: string }) => {
      const tokens = extractTokensFromUrl(event.url);
      if (tokens.access_token && tokens.refresh_token) {
        const { error } = await authClient.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        if (error) {
          console.error('Error setting session from deep link:', error);
        }
      }
    };

    linkingSubscription = Linking.addEventListener('url', handleUrl);

    const { data: { subscription } }: { data: { subscription: Subscription } } = authClient.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        setSession(session);
        if (session?.user) {
          await loadProfile(session.user.id);
          await registerNotification();
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (linkingSubscription) {
        linkingSubscription.remove();
      }
    };
  }, [loadProfile, registerNotification]);

  const signUp = async (name: string, email: string, phone: string, password: string): Promise<void> => {
    const result = await signUpService(name, email, phone, password);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const result = await signInService(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const signOut = async (): Promise<void> => {
    await unregisterNotification();
    const result = await signOutService();
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const result = await resetPasswordService(email);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const updatePassword = async (password: string): Promise<void> => {
    const result = await updatePasswordService(password);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const resend = async (email: string): Promise<void> => {
    const result = await resendConfirmation(email);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const isEmailVerified = !!session?.user?.email_confirmed_at;

  const typedSession = session ? { user: session.user } : null;

  return { session: typedSession, profile, loading, isEmailVerified, signUp, signIn, signOut, resetPassword, updatePassword, resend };
}
