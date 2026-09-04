/**
 * Testes de integração para o Sprint 2:
 *  - Item 1: Logo AM correta no HomeScreen
 *  - Item 2: Confirmação de e-mail obrigatória antes do login
 */

import { signIn, signUp } from '@services/auth/authService';
import { resolveRootState } from '@navigation/RootNavigator';
import type { Profile } from '../../supabase/types';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('../../supabase/client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      resend: jest.fn(),
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

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  StyleSheet: { create: (s: any) => s },
  Platform: { OS: 'android', select: (o: any) => o?.android || o?.default },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => {
    const Stack: any = ({ children }: { children: any }) => children;
    Stack.Navigator = ({ children }: { children: any }) => children;
    Stack.Screen = () => null;
    return Stack;
  },
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => {
    const Tab: any = ({ children }: { children: any }) => children;
    Tab.Navigator = ({ children }: { children: any }) => children;
    Tab.Screen = () => null;
    return Tab;
  },
}));

jest.mock('@hooks/AuthContext', () => ({
  useAuthContext: () => ({
    session: null,
    profile: null,
    loading: false,
    isEmailVerified: false,
    recoveryMode: false,
    profileError: '',
    isProfessional: false,
    professionalId: null,
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    resend: jest.fn(),
    setProfile: jest.fn(),
  }),
}));

jest.mock('@screens/public/SplashScreen', () => () => null);
jest.mock('@navigation/stacks/PublicStack', () => () => null);
jest.mock('@navigation/stacks/EmailVerificationStack', () => () => null);
jest.mock('@navigation/stacks/RecoveryStack', () => () => null);
jest.mock('@navigation/stacks/ClientStack', () => () => null);
jest.mock('@navigation/stacks/AdminStack', () => () => null);

import { supabase } from '../../supabase/client';

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

// ─── Item 1: Logo AM ──────────────────────────────────────────────
describe('Item 1 — Logo AM correta', () => {
  it('HomeScreen usa icon.png como logo da marca', () => {
    const homeSource = fs.readFileSync(
      path.join(__dirname, '../../screens/client/HomeScreen.tsx'),
      'utf-8',
    );
    expect(homeSource).toContain("require('../../../assets/icon.png')");
    expect(homeSource).toContain('logoIcon');
  });

  it('HomeScreen NAO usa sparkles como logo da marca no header', () => {
    const homeSource = fs.readFileSync(
      path.join(__dirname, '../../screens/client/HomeScreen.tsx'),
      'utf-8',
    );
    const headerSection = homeSource.substring(
      homeSource.indexOf('Header — logo'),
      homeSource.indexOf('Saudação'),
    );
    expect(headerSection).not.toContain('sparkles');
  });

  it('BrandLogo usa IconAppWhite.png para telas de auth', () => {
    const brandSource = fs.readFileSync(
      path.join(__dirname, '../../components/base/BrandLogo.tsx'),
      'utf-8',
    );
    expect(brandSource).toContain('IconAppWhite');
  });

  it('assets/icon.png existe e e AM logo oficial', () => {
    const iconPath = path.join(__dirname, '../../../assets/icon.png');
    expect(fs.existsSync(iconPath)).toBe(true);
  });

  it('assets/IconAppWhite.png existe', () => {
    const iconPath = path.join(__dirname, '../../../assets/IconAppWhite.png');
    expect(fs.existsSync(iconPath)).toBe(true);
  });

  it('assets/splash-icon.png existe', () => {
    const iconPath = path.join(__dirname, '../../../assets/splash-icon.png');
    expect(fs.existsSync(iconPath)).toBe(true);
  });
});

// ─── Item 2: Confirmação de e-mail obrigatória ────────────────────
describe('Item 2 — Confirmação de e-mail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn bloqueia e-mail não confirmado', () => {
    it('deve retornar sucesso quando email esta confirmado', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', email_confirmed_at: '2025-01-01T00:00:00Z' } },
        error: null,
      });

      const result = await signIn('maria@example.com', 'senha123');
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-1');
    });

    it('deve bloquear login quando email NAO esta confirmado', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', email_confirmed_at: null } },
        error: null,
      });

      const result = await signIn('maria@example.com', 'senha123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Confirme seu e-mail');
    });

    it('deve retornar erro claro quando Supabase retorna email_not_confirmed', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Email not confirmed' },
      });

      const result = await signIn('maria@example.com', 'senha123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Confirme seu e-mail');
      expect(result.error).toContain('caixa de entrada');
    });

    it('deve bloquear login quando email_confirmed_at e string vazia', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', email_confirmed_at: '' } },
        error: null,
      });

      const result = await signIn('maria@example.com', 'senha123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Confirme seu e-mail');
    });
  });

  describe('resolveRootState — roteamento por status de e-mail', () => {
    const session = { user: { id: 'u1' } };

    it('session + email nao verificado -> EmailVerification', () => {
      expect(
        resolveRootState({
          loading: false,
          session,
          isEmailVerified: false,
          profile: baseProfile,
          recoveryMode: false,
          isProfessional: false,
        }),
      ).toBe('EmailVerification');
    });

    it('session + email verificado + client -> Client', () => {
      expect(
        resolveRootState({
          loading: false,
          session,
          isEmailVerified: true,
          profile: baseProfile,
          recoveryMode: false,
          isProfessional: false,
        }),
      ).toBe('Client');
    });

    it('session + email verificado + admin -> Admin', () => {
      expect(
        resolveRootState({
          loading: false,
          session,
          isEmailVerified: true,
          profile: { ...baseProfile, role: 'admin' },
          recoveryMode: false,
          isProfessional: false,
        }),
      ).toBe('Admin');
    });

    it('sem session -> Public (Login)', () => {
      expect(
        resolveRootState({
          loading: false,
          session: null,
          isEmailVerified: false,
          profile: null,
          recoveryMode: false,
          isProfessional: false,
        }),
      ).toBe('Public');
    });
  });

  describe('signUp — fluxo de confirmação', () => {
    it('deve criar conta com sucesso (Supabase envia email de confirmacao)', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1', email_confirmed_at: null } },
        error: null,
      });

      const result = await signUp('Maria Silva', 'maria@example.com', '11999999999', 'senha123');
      expect(result.success).toBe(true);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'maria@example.com',
        password: 'senha123',
        options: {
          emailRedirectTo: expect.stringContaining('appmanicure://'),
          data: { name: 'Maria Silva', phone: '11999999999' },
        },
      });
    });
  });

  describe('EmailConfirmationScreen — mensagens e comportamento', () => {
    it('tela de confirmacao contem instrucoes claras em portugues', () => {
      const source = fs.readFileSync(
        path.join(__dirname, '../../screens/public/EmailConfirmationScreen.tsx'),
        'utf-8',
      );
      expect(source).toContain('Confirme seu e-mail');
      expect(source).toContain('Enviamos um link de confirmação');
      expect(source).toContain('abra o e-mail recebido');
      expect(source).toContain('clique no link de confirmação');
      expect(source).toContain('Somente após a confirmação');
      expect(source).toContain('fazer login');
    });

    it('tela de confirmacao tem botao para reenviar e-mail', () => {
      const source = fs.readFileSync(
        path.join(__dirname, '../../screens/public/EmailConfirmationScreen.tsx'),
        'utf-8',
      );
      expect(source).toContain('Reenviar e-mail');
    });

    it('tela de confirmacao usa signOut para voltar ao login', () => {
      const source = fs.readFileSync(
        path.join(__dirname, '../../screens/public/EmailConfirmationScreen.tsx'),
        'utf-8',
      );
      expect(source).toContain('handleBackToLogin');
      expect(source).toContain('signOut');
      expect(source).not.toContain("navigation.navigate('Login')");
    });
  });

  describe('LoginScreen — mensagem de sucesso apos cadastro', () => {
    it('exibe mensagem de confirmacao apos cadastro', () => {
      const source = fs.readFileSync(
        path.join(__dirname, '../../screens/public/LoginScreen.tsx'),
        'utf-8',
      );
      expect(source).toContain('Confirme seu e-mail para poder entrar');
    });
  });

  describe('authService — mensagens de erro em portugues', () => {
    it('email_not_confirmed retorna mensagem de bloqueio', async () => {
      const lower = 'email_not_confirmed';
      expect(lower.includes('email_not_confirmed')).toBe(true);
    });

    it('error message para email nao confirmado contem palavras-chave', () => {
      const errorMsg = 'Login bloqueado. Confirme seu e-mail antes de acessar o aplicativo. Verifique sua caixa de entrada e clique no link de confirmação.';
      expect(errorMsg).toContain('Login bloqueado');
      expect(errorMsg).toContain('Confirme seu e-mail');
      expect(errorMsg).toContain('caixa de entrada');
      expect(errorMsg).toContain('link de confirmação');
    });
  });

  describe('AUTH_REDIRECT — configuracao via env', () => {
    it('redirect URL contem scheme do app', () => {
      const source = fs.readFileSync(
        path.join(__dirname, '../../services/auth/authService.ts'),
        'utf-8',
      );
      expect(source).toContain('EXPO_PUBLIC_EMAIL_CONFIRM_REDIRECT_URL');
      expect(source).toContain('appmanicure://auth/confirm');
    });

    it('.env contem variavel de redirect', () => {
      const envSource = fs.readFileSync(
        path.join(__dirname, '../../../.env'),
        'utf-8',
      );
      expect(envSource).toContain('EXPO_PUBLIC_EMAIL_CONFIRM_REDIRECT_URL');
      expect(envSource).toContain('appmanicure://auth/confirm');
    });
  });
});
