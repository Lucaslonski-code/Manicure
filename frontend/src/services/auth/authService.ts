import { supabase } from '../../supabase/client';
import type { Profile } from '../../supabase/types';

export interface AuthResult {
  success: boolean;
  error?: string;
  profile?: Profile;
}

function mapAuthError(message: string): string {
  if (!message) return 'Erro desconhecido';
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'E-mail ou senha inválidos';
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Confirme seu e-mail antes de entrar';
  }
  if (lower.includes('user already registered') || lower.includes('user_already_exists')) {
    return 'Usuário já cadastrado';
  }
  if (lower.includes('signup is disabled') || lower.includes('signups_disabled')) {
    return 'Cadastro desativado no momento';
  }
  if (lower.includes('token has expired') || lower.includes('expired')) {
    return 'Link expirado. Solicite um novo.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde um momento.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  return message;
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
      return { success: false, error: mapAuthError(error.message) };
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
      return { success: false, error: mapAuthError(error.message) };
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
      return { success: false, error: mapAuthError(error.message) };
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
      return { success: false, error: mapAuthError(error.message) };
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
      return { success: false, error: mapAuthError(error.message) };
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
      return { success: false, error: mapAuthError(error.message) };
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
