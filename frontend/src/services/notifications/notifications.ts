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
  const authUserId = session.data.session?.user.id;
  if (!authUserId) {
    return; // Silently return if not authenticated
  }

  // Check if token already exists for this user/platform to avoid duplicate registration
  const { data: existing } = await supabase
    .from('notifications_tokens')
    .select('id')
    .eq('user_id', authUserId)
    .eq('token', token)
    .single();

  if (existing) {
    // Token already registered, just update is_active and updated_at
    const { error } = await supabase
      .from('notifications_tokens')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    
    if (error) {
      console.error('Error updating notification token:', error);
    }
    return;
  }

  // Insert new token using authUserId directly (the FK references users.id from auth session)
  const { error } = await supabase
    .from('notifications_tokens')
    .insert({
      user_id: authUserId,
      token,
      platform,
      is_active: true,
    });

  if (error) {
    console.error('Error registering notification token:', error);
    // Don't throw - just log the error to avoid breaking the app
  }
}

export async function deactivateNotificationToken(token: string): Promise<void> {
  const session = await supabase.auth.getSession();
  const authUserId = session.data.session?.user.id;
  if (!authUserId) {
    return;
  }

  const { error } = await supabase
    .from('notifications_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('token', token)
    .eq('user_id', authUserId);

  if (error) {
    console.error('Error deactivating notification token:', error);
  }
}

export async function fetchNotificationTokens(): Promise<NotificationToken[]> {
  const session = await supabase.auth.getSession();
  const authUserId = session.data.session?.user.id;
  if (!authUserId) {
    return [];
  }

  const { data, error } = await supabase
    .from('notifications_tokens')
    .select('*')
    .eq('user_id', authUserId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as NotificationToken[];
}
