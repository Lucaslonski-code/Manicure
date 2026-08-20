import { supabase } from '../../supabase/client';
import type { Profile } from '../../supabase/types';

export interface AuthResult {
  success: boolean;
  error?: string;
  profile?: Profile;
}

export async function signUp(name: string, email: string, phone: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Erro ao criar conta' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Credenciais inválidas' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function resendConfirmation(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resend({ type: 'signup', email });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function updatePassword(password: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Profile;
  } catch {
    return null;
  }
}
