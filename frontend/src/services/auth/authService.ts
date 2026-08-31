import { supabase } from '../../supabase/client';
import type { Profile } from '../../supabase/types';

export interface AuthResult {
  success: boolean;
  error?: string;
  profile?: Profile;
  userId?: string;
}

const AUTH_REDIRECT = 'appmanicure://auth/confirm';

// emailRedirectTo/redirectTo garantem que, após confirmar o e-mail ou
// redefinir a senha, o usuário retorne ao aplicativo mobile via deep link
// (não para localhost ou URLs de desenvolvimento).
// O scheme deve coincidir com o configurado em app.json.

function getAuthError(message: string): string {
  if (!message) return 'Ocorreu um erro inesperado. Tente novamente.';
  const lower = message.toLowerCase();

  // Credenciais
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  // E-mail
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
  }
  if (lower.includes('user already registered') || lower.includes('user_already_exists')) {
    return 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.';
  }
  if (lower.includes('email address') && lower.includes('invalid')) {
    return 'E-mail inválido. Verifique o endereço informado.';
  }
  if (lower.includes('unable to validate email') || lower.includes('invalid format')) {
    return 'E-mail inválido. Verifique o endereço informado.';
  }

  // Cadastro
  if (lower.includes('signup is disabled') || lower.includes('signups_disabled')) {
    return 'O cadastro está temporariamente indisponível. Tente novamente mais tarde.';
  }
  if (lower.includes('password') && lower.includes('at least')) {
    return 'A senha não atende aos requisitos mínimos de segurança.';
  }
  if (lower.includes('password') && lower.includes('weak')) {
    return 'A senha é muito fraca. Use uma combinação de letras, números e símbolos.';
  }

  // Token / Link
  if (lower.includes('token has expired') || lower.includes('expired')) {
    return 'O link expirou. Solicite um novo.';
  }
  if (lower.includes('invalid token') || lower.includes('invalid_grant')) {
    return 'O link é inválido ou já foi utilizado. Solicite um novo.';
  }

  // Rate limit / ban
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('email rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (lower.includes('security purposes') || lower.includes('you can only request this after')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (lower.includes('request limit') || lower.includes('over_request_rate_limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }

  // Rede
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('network request failed')) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }

  // Fallback seguro — nunca expor mensagem técnica do Supabase
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export async function signUp(name: string, email: string, phone: string, password: string): Promise<AuthResult> {
  try {
    console.log('[AUTH_SERVICE] signUp called — email_len=%d password_len=%d', email.length, password.length);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: AUTH_REDIRECT,
        data: {
          name,
          phone,
        },
      },
    });

    console.log('[AUTH_SERVICE] signUp response — error=%s data.user=%s data.session=%s',
      error ? `${error.status || 'no-status'}/${error.message}` : 'null',
      data?.user ? `${data.user.id}` : 'null',
      data?.session ? 'exists' : 'null',
    );

    if (error) {
      console.error('[AUTH_SERVICE] signUp ERROR:', error.status, error.name, error.message);
      return { success: false, error: getAuthError(error.message) };
    }

    if (!data.user) {
      console.error('[AUTH_SERVICE] signUp returned user=null without error');
      return { success: false, error: 'Erro ao criar conta' };
    }

    console.log('[AUTH_SERVICE] signUp SUCCESS — user_id=%s email_confirmed_at=%s',
      data.user.id,
      data.user.email_confirmed_at || 'null',
    );
    return { success: true };
  } catch (err: any) {
    console.error('[AUTH_SERVICE] signUp EXCEPTION:', err?.name, err?.message);
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    console.log('[AUTH_SERVICE] signIn called — email_len=%d', email.length);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[AUTH_SERVICE] signIn response — error=%s data.user=%s data.session=%s',
      error ? `${error.status || 'no-status'}/${error.message}` : 'null',
      data?.user ? `${data.user.id}` : 'null',
      data?.session ? 'exists' : 'null',
    );

    if (error) {
      console.error('[AUTH_SERVICE] signIn ERROR:', error.status, error.name, error.message);
      return { success: false, error: getAuthError(error.message) };
    }

    if (!data.user) {
      console.error('[AUTH_SERVICE] signIn returned user=null without error');
      return { success: false, error: 'Credenciais inválidas' };
    }

    console.log('[AUTH_SERVICE] signIn SUCCESS — user_id=%s', data.user.id);
    return { success: true, userId: data.user.id };
  } catch (err: any) {
    console.error('[AUTH_SERVICE] signIn EXCEPTION:', err?.name, err?.message);
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: getAuthError(error.message) };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: AUTH_REDIRECT,
    });

    if (error) {
      return { success: false, error: getAuthError(error.message) };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function resendConfirmation(email: string): Promise<AuthResult> {
  try {
    console.log('[AUTH_SERVICE] resendConfirmation called — email_len=%d', email.length);
    const { data, error } = await supabase.auth.resend({ type: 'signup', email });

    console.log('[AUTH_SERVICE] resendConfirmation response — error=%s data=%s',
      error ? `${error.status || 'no-status'}/${error.message}` : 'null',
      data ? JSON.stringify(data) : 'null',
    );

    if (error) {
      console.error('[AUTH_SERVICE] resendConfirmation ERROR:', error.status, error.name, error.message);
      return { success: false, error: getAuthError(error.message) };
    }

    console.log('[AUTH_SERVICE] resendConfirmation SUCCESS');
    return { success: true };
  } catch (err: any) {
    console.error('[AUTH_SERVICE] resendConfirmation EXCEPTION:', err?.name, err?.message);
    return { success: false, error: 'Erro de conexão' };
  }
}

export async function updatePassword(password: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { success: false, error: getAuthError(error.message) };
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
