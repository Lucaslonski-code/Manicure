jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: { create: (s: any) => s },
  Platform: { OS: 'android', select: (o: any) => o?.android || o?.default },
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: any }) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => {
    const Stack: any = ({ children }: { children: any }) => children;
    Stack.Navigator = ({ children }: { children: any }) => children;
    Stack.Screen = () => null;
    return Stack;
  },
}));

jest.mock('@hooks/AuthContext', () => ({ useAuthContext: () => ({}) }));

jest.mock('@screens/public/SplashScreen', () => () => null);
jest.mock('@navigation/stacks/PublicStack', () => () => null);
jest.mock('@navigation/stacks/EmailVerificationStack', () => () => null);
jest.mock('@navigation/stacks/RecoveryStack', () => () => null);
jest.mock('@navigation/stacks/ClientStack', () => () => null);
jest.mock('@navigation/stacks/AdminStack', () => () => null);

import { resolveRootState } from '@navigation/RootNavigator';
import type { Profile } from '../../supabase/types';

const session = { user: { id: 'u1' } };
const baseProfile: Profile = {
  id: 'u1',
  name: 'Maria',
  email: 'maria@example.com',
  phone: '11999999999',
  role: 'client',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('resolveRootState (auth -> destination)', () => {
  it('no session -> Public (Login)', () => {
    expect(resolveRootState({ loading: false, session: null, isEmailVerified: false, profile: null, recoveryMode: false })).toBe('Public');
  });

  it('client autenticado -> Client (Home)', () => {
    expect(resolveRootState({ loading: false, session, isEmailVerified: true, profile: baseProfile, recoveryMode: false })).toBe('Client');
  });

  it('admin autenticado -> Admin', () => {
    expect(resolveRootState({ loading: false, session, isEmailVerified: true, profile: { ...baseProfile, role: 'admin' }, recoveryMode: false })).toBe('Admin');
  });

  it('e-mail não verificado -> EmailVerification', () => {
    expect(resolveRootState({ loading: false, session, isEmailVerified: false, profile: baseProfile, recoveryMode: false })).toBe('EmailVerification');
  });

  it('recovery ativo -> Recovery', () => {
    expect(resolveRootState({ loading: false, session, isEmailVerified: true, profile: baseProfile, recoveryMode: true })).toBe('Recovery');
  });

  it('profile com role inválido -> Public (fallback seguro)', () => {
    expect(resolveRootState({ loading: false, session, isEmailVerified: true, profile: { ...baseProfile, role: 'invalid' as any }, recoveryMode: false })).toBe('Public');
  });
});
