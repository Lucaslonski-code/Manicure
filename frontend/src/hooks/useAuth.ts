import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import type { Profile, AuthState } from '../supabase/types';
import type { AuthClient, Session, AuthChangeEvent, Subscription } from '../types/auth';

const authClient = supabase.auth as AuthClient;

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    authClient.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } }: { data: { subscription: Subscription } } = authClient.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
    setLoading(false);
  }, []);

  const isEmailVerified = !!session?.user?.email_confirmed_at;

  const typedSession = session ? { user: session.user } : null;

  return { session: typedSession, profile, loading, isEmailVerified };
}
