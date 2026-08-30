import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import type { Profile, AuthState } from '../supabase/types';
import type { AuthClient, Session, AuthChangeEvent, Subscription } from '../types/auth';
import { signUp as signUpService, signIn as signInService, signOut as signOutService, resetPassword as resetPasswordService, updatePassword as updatePasswordService, fetchProfile as fetchProfileService, resendConfirmation } from '../services/auth/authService';
import { useNotifications } from './useNotifications';
import * as Linking from 'expo-linking';

const authClient = supabase.auth as AuthClient;

// O timeout de bootstrap existe para impedir que o app fique permanentemente
// em loading se initialize() nunca resolver (ex.: problema de rede ou
// inicialização do Supabase). Após o timeout, o fluxo público (Login) é
// liberado. getSession() não é chamado após timeout/erro porque isso
// reintroduziria uma promise potencialmente bloqueante no caminho crítico.
const BOOTSTRAP_TIMEOUT_MS = 5000;

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
  recoveryMode: boolean;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const { register: registerNotification, unregister: unregisterNotification } = useNotifications();

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const profileData = await fetchProfileService(userId);
      if (profileData) {
        // Perfis marcados como deletados ou inativos são considerados
        // encerrados: a sessão é invalidada e o usuário retorna ao estado
        // público (Login). Isso impede que contas desativadas acessem o app.
        if (profileData.deleted_at || !profileData.is_active) {
          await authClient.signOut();
          setProfile(null);
          setSession(null);
        } else {
          setProfile(profileData);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      await authClient.signOut();
      setProfile(null);
      setSession(null);
    } finally {
      // loading termina aqui porque o perfil é necessário para resolver
      // a pilha de navegação (admin/client).
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let linkingSubscription: { remove: () => void } | null = null;

    const processDeepLink = async (url: string | null) => {
      if (!url || !isMounted) return;
      const tokens = extractTokensFromUrl(url);
      if (tokens.access_token && tokens.refresh_token) {
        try {
          const lowerUrl = url.toLowerCase();
          if (lowerUrl.includes('recovery') || lowerUrl.includes('new_password') || lowerUrl.includes('reset')) {
            setRecoveryMode(true);
          }
          const { error } = await authClient.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          if (error) {
            console.error('Error setting session from deep link:', error);
          }
        } catch (err) {
          console.error('Error setting session from deep link:', err);
        }
      }
    };

    const bootstrap = async () => {
      try {
        // Processa deep link caso o app tenha sido aberto a partir de um
        // link de confirmação/redefinição enquanto estava fechado.
        const initialUrl = await Linking.getInitialURL();
        await processDeepLink(initialUrl);

        const initPromise = (async () => {
          await authClient.initialize();
          return { type: 'initialized' as const };
        })();

        const timeoutPromise = new Promise<{ type: 'timeout' }>((resolve) => {
          setTimeout(() => resolve({ type: 'timeout' }), BOOTSTRAP_TIMEOUT_MS);
        });

        const result = await Promise.race([initPromise, timeoutPromise]);

        if (!isMounted) return;

        if (result.type === 'initialized') {
          try {
            // getSession pode travar no Preview standalone (expo-secure-store nativo)
            const sessionPromise = authClient.getSession();
            const sessionTimeoutPromise = new Promise<{ data: { session: null } }>((resolve) => {
              setTimeout(() => resolve({ data: { session: null } }), BOOTSTRAP_TIMEOUT_MS);
            });
const { data } = await Promise.race([sessionPromise, sessionTimeoutPromise]);

             if (!isMounted) return;
             setSession(data.session);

              if (data.session?.user) {
                // Register push token (non-fatal: never block the bootstrap)
                try {
                  await registerNotification();
                } catch (tokenErr) {
                  console.warn('Push token registration failed, continuing without it:', tokenErr);
                }
                // loadProfile pode travar em rede no Preview standalone
                const profilePromise = loadProfile(data.session.user.id);
               const profileTimeoutPromise = new Promise<void>((resolve) => {
                 setTimeout(() => resolve(), BOOTSTRAP_TIMEOUT_MS);
               });
               await Promise.race([profilePromise, profileTimeoutPromise]);
             } else {
               setLoading(false);
             }
          } catch (err) {
            console.error('Error getting session after bootstrap:', err);
            if (isMounted) {
              setSession(null);
              setProfile(null);
              setLoading(false);
            }
          }
        } else {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error during auth initialization:', err);
        if (!isMounted) return;
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    };

    bootstrap();

    const handleUrl = async (event: { url: string }) => {
      await processDeepLink(event.url);
    };

    linkingSubscription = Linking.addEventListener('url', handleUrl);

const { data: { subscription } }: { data: { subscription: Subscription } } = authClient.onAuthStateChange(
       async (_event: AuthChangeEvent, session: Session | null) => {
         if (!isMounted) return;
         setSession(session);
          if (session?.user) {
            // Register push token (non-fatal: must not block profile load)
            try {
              await registerNotification();
            } catch (tokenErr) {
              console.warn('Push token registration failed, continuing without it:', tokenErr);
            }
            await loadProfile(session.user.id);
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
  }, [loadProfile]);

  const signUp = async (name: string, email: string, phone: string, password: string): Promise<void> => {
    const result = await signUpService(name, email, phone, password);
    if (!result.success) {
      throw new Error(result.error);
    }
    setRecoveryMode(false);
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const result = await signInService(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
    setRecoveryMode(false);
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

  return { session: typedSession, profile, loading, isEmailVerified, recoveryMode, signUp, signIn, signOut, resetPassword, updatePassword, resend };
}