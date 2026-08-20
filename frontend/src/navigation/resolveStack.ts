import type { Profile } from '../supabase/types';

export type RootStackName = 'Public' | 'EmailVerification' | 'Client' | 'Admin';

export function resolveStack(
  loading: boolean,
  session: { user: { id: string } } | null,
  isEmailVerified: boolean,
  profile: Profile | null
): RootStackName {
  if (loading) {
    return 'Public';
  }

  if (!session) {
    return 'Public';
  }

  if (!isEmailVerified) {
    return 'EmailVerification';
  }

  if (profile?.role === 'admin') {
    return 'Admin';
  }

  if (profile?.role === 'client') {
    return 'Client';
  }

  return 'Public';
}
