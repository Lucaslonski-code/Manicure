import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  profileError: string;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [isProfessional, setIsProfessional] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const { register: registerNotification, unregister: unregisterNotification } = useNotifications();

  const PROFILE_TIMEOUT_MS = 10000;
  const AUTO_CREATE_TIMEOUT_MS = 10000;
  const loadProfileRunning = useRef(false);

  const loadProfile = useCallback(async (userId: string) => {
    if (loadProfileRunning.current) {
      console.log('[USE_AUTH] loadProfile SKIPPED — already running for another call');
      return;
    }
    loadProfileRunning.current = true;

    try {
      console.log('[USE_AUTH] loadProfile called — userId=%s', userId);

      const profilePromise = fetchProfileService(userId);
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), PROFILE_TIMEOUT_MS);
      });
      const profileData = await Promise.race([profilePromise, timeoutPromise]);

      console.log('[USE_AUTH] loadProfile result — profile=%s', profileData ? `${profileData.id}/${profileData.role}` : 'null');

      if (profileData) {
        if (profileData.deleted_at || !profileData.is_active) {
          console.warn('[USE_AUTH] loadProfile — profile deleted/inactive, signing out');
          await authClient.signOut();
          setProfile(null);
          setSession(null);
          setIsProfessional(false);
          setProfessionalId(null);
          setProfileError('Sua conta foi desativada. Entre em contato com o suporte.');
        } else {
          setProfile(profileData);
          setProfileError('');
          // Check if this user is also a professional
          try {
            const { data: profData } = await supabase
              .from('professionals')
              .select('id')
              .eq('user_id', userId)
              .eq('is_active', true)
              .maybeSingle();
            if (profData) {
              setIsProfessional(true);
              setProfessionalId(profData.id);
              console.log('[USE_AUTH] loadProfile — user IS a professional, professionalId=%s', profData.id);
            } else {
              setIsProfessional(false);
              setProfessionalId(null);
            }
          } catch {
            setIsProfessional(false);
            setProfessionalId(null);
          }
        }
      } else {
        console.warn('[USE_AUTH] loadProfile — profile NOT FOUND for userId=%s, attempting auto-create', userId);

        const getUserPromise = authClient.getUser();
        const getUserTimeout = new Promise<{ data: { user: null } }>((resolve) => {
          setTimeout(() => resolve({ data: { user: null } }), AUTO_CREATE_TIMEOUT_MS);
        });
        const { data: { user: authUser } } = await Promise.race([getUserPromise, getUserTimeout]);

        if (authUser) {
          const name = (authUser.user_metadata?.name as string) || '';
          const phone = (authUser.user_metadata?.phone as string) || '';

          const insertPromise = supabase
            .from('users')
            .insert({
              id: userId,
              name,
              phone,
              email: authUser.email || '',
              role: 'client',
              is_active: true,
            })
            .select()
            .single();
          const insertTimeout = new Promise<{ data: null; error: { message: string } }>((resolve) => {
            setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), AUTO_CREATE_TIMEOUT_MS);
          });
          const { data: newProfile, error: insertError } = await Promise.race([insertPromise, insertTimeout]);

          if (!insertError && newProfile) {
            console.log('[USE_AUTH] loadProfile — auto-created profile for userId=%s', userId);
            setProfile(newProfile as Profile);
            setProfileError('');
            // Check if this user is also a professional
            try {
              const { data: profData } = await supabase
                .from('professionals')
                .select('id')
                .eq('user_id', userId)
                .eq('is_active', true)
                .maybeSingle();
              if (profData) {
                setIsProfessional(true);
                setProfessionalId(profData.id);
              } else {
                setIsProfessional(false);
                setProfessionalId(null);
              }
            } catch {
              setIsProfessional(false);
              setProfessionalId(null);
            }
          } else {
            console.warn('[USE_AUTH] loadProfile — auto-create failed:', insertError?.message);
            setProfileError('Perfil não encontrado. Entre em contato com o suporte.');
          }
        } else {
          setProfileError('Perfil não encontrado. Entre em contato com o suporte.');
        }
      }
    } catch (err) {
      console.error('[USE_AUTH] loadProfile EXCEPTION:', err);
      setProfileError('Erro ao carregar perfil. Verifique sua conexão e tente novamente.');
    } finally {
      loadProfileRunning.current = false;
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
              setIsProfessional(false);
              setProfessionalId(null);
              setLoading(false);
            }
          }
        } else {
          setSession(null);
          setProfile(null);
          setIsProfessional(false);
          setProfessionalId(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error during auth initialization:', err);
        if (!isMounted) return;
        setSession(null);
        setProfile(null);
        setIsProfessional(false);
        setProfessionalId(null);
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
            loadProfile(session.user.id);
         } else {
           setProfile(null);
           setIsProfessional(false);
           setProfessionalId(null);
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

  const signUp = useCallback(async (name: string, email: string, phone: string, password: string): Promise<void> => {
    console.log('[USE_AUTH] signUp called');
    const result = await signUpService(name, email, phone, password);
    console.log('[USE_AUTH] signUp result — success=%s error=%s', result.success, result.error || 'none');
    if (!result.success) {
      throw new Error(result.error);
    }
    setRecoveryMode(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setProfileError('');
    const result = await signInService(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
    setRecoveryMode(false);
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await unregisterNotification();
    const result = await signOutService();
    if (!result.success) {
      throw new Error(result.error);
    }
  }, [unregisterNotification]);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    const result = await resetPasswordService(email);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<void> => {
    const result = await updatePasswordService(password);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const resend = useCallback(async (email: string): Promise<void> => {
    console.log('[USE_AUTH] resend called');
    const result = await resendConfirmation(email);
    console.log('[USE_AUTH] resend result — success=%s error=%s', result.success, result.error || 'none');
    if (!result.success) {
      throw new Error(result.error);
    }
  }, []);

  const isEmailVerified = !!session?.user?.email_confirmed_at;

  const typedSession = useMemo(() => session ? { user: session.user } : null, [session]);

  return useMemo(() => ({ session: typedSession, profile, loading, isEmailVerified, recoveryMode, profileError, isProfessional, professionalId, signUp, signIn, signOut, resetPassword, updatePassword, resend }), [
    typedSession, profile, loading, isEmailVerified, recoveryMode, profileError, isProfessional, professionalId, signUp, signIn, signOut, resetPassword, updatePassword, resend
  ]);
}