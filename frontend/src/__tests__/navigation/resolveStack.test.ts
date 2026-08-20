import { resolveStack } from '@navigation/resolveStack';
import type { Profile } from '../../supabase/types';

describe('resolveStack', () => {
  const baseSession = { user: { id: 'user-1' } };
  const clientProfile: Profile = {
    id: 'user-1',
    name: 'Maria',
    email: 'maria@example.com',
    phone: '11999999999',
    role: 'client',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
  const adminProfile: Profile = {
    ...clientProfile,
    role: 'admin',
  };

  it('deve retornar Public quando loading', () => {
    expect(resolveStack(true, null, false, null)).toBe('Public');
  });

  it('deve retornar Public quando não autenticado', () => {
    expect(resolveStack(false, null, false, null)).toBe('Public');
  });

  it('deve retornar EmailVerification quando autenticado mas e-mail não verificado', () => {
    expect(resolveStack(false, baseSession, false, clientProfile)).toBe('EmailVerification');
  });

  it('deve retornar Client quando autenticado, verificado e role client', () => {
    expect(resolveStack(false, baseSession, true, clientProfile)).toBe('Client');
  });

  it('deve retornar Admin quando autenticado, verificado e role admin', () => {
    expect(resolveStack(false, baseSession, true, adminProfile)).toBe('Admin');
  });

  it('deve retornar Public quando role é inválido', () => {
    const invalidProfile = { ...clientProfile, role: 'invalid' as any };
    expect(resolveStack(false, baseSession, true, invalidProfile)).toBe('Public');
  });
});
