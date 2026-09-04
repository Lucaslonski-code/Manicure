import { signUp, signIn, signOut, resetPassword, updatePassword, fetchProfile, resendConfirmation } from '@services/auth/authService';

jest.mock('../../supabase/client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      resend: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      setSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

import { supabase } from '../../supabase/client';

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('deve criar conta com sucesso', async () => {
      const mockUser = { id: 'user-1', email: 'maria@example.com' };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await signUp('Maria Silva', 'maria@example.com', '11999999999', 'senha123');
      expect(result.success).toBe(true);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'maria@example.com',
        password: 'senha123',
        options: {
          emailRedirectTo: 'appmanicure://auth/confirm',
          data: { name: 'Maria Silva', phone: '11999999999' },
        },
      });
    });

    it('deve retornar erro quando e-mail já existe', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const result = await signUp('Maria Silva', 'maria@example.com', '11999999999', 'senha123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
    });
  });

  describe('signIn', () => {
    it('deve autenticar com sucesso', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', email_confirmed_at: '2025-01-01T00:00:00Z' } },
        error: null,
      });

      const result = await signIn('maria@example.com', 'senha123');
      expect(result.success).toBe(true);
    });

    it('deve bloquear login quando e-mail nao esta confirmado', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', email_confirmed_at: null } },
        error: null,
      });

      const result = await signIn('maria@example.com', 'senha123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Confirme seu e-mail');
    });

    it('deve retornar erro com credenciais inválidas', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await signIn('maria@example.com', 'senha-errada');
      expect(result.success).toBe(false);
      expect(result.error).toBe('E-mail ou senha incorretos.');
    });
  });

  describe('signOut', () => {
    it('deve fazer logout com sucesso', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const result = await signOut();
      expect(result.success).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('deve enviar e-mail de recuperação', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      const result = await resetPassword('maria@example.com');
      expect(result.success).toBe(true);
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('maria@example.com', {
        redirectTo: 'appmanicure://auth/confirm',
      });
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar senha com sucesso', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null });

      const result = await updatePassword('novaSenha123');
      expect(result.success).toBe(true);
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' });
    });
  });

  describe('resendConfirmation', () => {
    it('deve reenviar confirmação com emailRedirectTo', async () => {
      (supabase.auth.resend as jest.Mock).mockResolvedValue({ error: null });

      const result = await resendConfirmation('maria@example.com');
      expect(result.success).toBe(true);
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'maria@example.com',
        options: { emailRedirectTo: 'appmanicure://auth/confirm' },
      });
    });
  });

  describe('fetchProfile', () => {
    it('deve retornar perfil quando encontrado', async () => {
      const mockProfile = { id: 'user-1', name: 'Maria', email: 'maria@example.com', phone: '11999999999', role: 'client', is_active: true };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          })),
        })),
      });

      const result = await fetchProfile('user-1');
      expect(result).toEqual(mockProfile);
    });

    it('deve retornar null quando perfil não encontrado', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          })),
        })),
      });

      const result = await fetchProfile('user-1');
      expect(result).toBeNull();
    });
  });
});
