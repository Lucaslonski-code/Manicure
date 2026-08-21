import { supabase } from '../../supabase/client';

export type NotificationToken = {
  id: string;
  user_id: string;
  token: string;
  platform: 'android' | 'ios';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function registerNotificationToken(token: string, platform: 'android' | 'ios'): Promise<void> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  if (!userId) {
    throw new Error('Usuário não autenticado');
  }

  const { error } = await supabase
    .from('notifications_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deactivateNotificationToken(token: string): Promise<void> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  if (!userId) {
    throw new Error('Usuário não autenticado');
  }

  const { error } = await supabase
    .from('notifications_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('token', token)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchNotificationTokens(): Promise<NotificationToken[]> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('notifications_tokens')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as NotificationToken[];
}
