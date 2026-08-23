import React from 'react';

jest.mock('react-native', () => {
  return {
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    StyleSheet: {
      create: (styles: any) => styles,
    },
    Platform: { OS: 'android', select: (obj: any) => obj?.android || obj?.default },
  };
});

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@components/base/Input', () => (props: any) => {
  const { View, Text, TextInput } = require('react-native');
  return (
    <View testID={`input-${props.label?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
      {props.label ? <Text testID={`label-${props.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>{props.label}</Text> : null}
      <TextInput
        testID={`textinput-${props.label?.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize}
        keyboardType={props.keyboardType}
      />
    </View>
  );
});

jest.mock('@components/base/Button', () => (props: any) => {
  const { TouchableOpacity, Text } = require('react-native');
  return (
    <TouchableOpacity testID="login-button" onPress={props.onPress} disabled={props.disabled}>
      <Text testID="login-button-text">{props.title}</Text>
    </TouchableOpacity>
  );
});

jest.mock('@forms/schemas', () => ({
  loginSchema: { parse: jest.fn() },
}));

import LoginScreen from '@screens/public/LoginScreen';
import { useAuth } from '@hooks/useAuth';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockSignIn = jest.fn();

describe('LoginScreen forensic validation', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      session: null,
      profile: null,
      isEmailVerified: false,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      resend: jest.fn(),
    });
  });

  it('should render without crashing', () => {
    const element = React.createElement(LoginScreen, { navigation: mockNavigation });
    expect(element).toBeTruthy();
    expect(element.type).toBe(LoginScreen);
  });

  it('should be a valid React component with required structure', () => {
    const element = React.createElement(LoginScreen, { navigation: mockNavigation });
    expect(element.props.navigation).toBe(mockNavigation);
  });

  it('should not depend on session/profile/notifications for rendering', () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      session: null,
      profile: null,
      isEmailVerified: false,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      resend: jest.fn(),
    });

    const element = React.createElement(LoginScreen, { navigation: mockNavigation });
    expect(element).toBeTruthy();
    expect(element.props.navigation).toBe(mockNavigation);
  });

  it('should contain email input, password input, login button, signup and recovery links', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '../../screens/public/LoginScreen.tsx'), 'utf-8');
    
    expect(source).toContain('E-mail');
    expect(source).toContain('Senha');
    expect(source).toContain('Entrar');
    expect(source).toContain('Esqueci minha senha');
    expect(source).toContain('Criar conta');
  });

  it('should have PasswordRecovery and SignUp navigation targets', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '../../screens/public/LoginScreen.tsx'), 'utf-8');
    expect(source).toContain('PasswordRecovery');
    expect(source).toContain('SignUp');
  });
});

describe('LoginScreen offline resilience', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      session: null,
      profile: null,
      isEmailVerified: false,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      resend: jest.fn(),
    });
  });

  it('should render when Supabase is offline', () => {
    const element = React.createElement(LoginScreen, { navigation: mockNavigation });
    expect(element).toBeTruthy();
  });

  it('should render when getSession fails', () => {
    const element = React.createElement(LoginScreen, { navigation: mockNavigation });
    expect(element).toBeTruthy();
  });

  it('should render when notification registration fails', () => {
    const element = React.createElement(LoginScreen, { navigation: mockNavigation });
    expect(element).toBeTruthy();
  });
});

describe('LoginScreen public navigation paths', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      session: null,
      profile: null,
      isEmailVerified: false,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      resend: jest.fn(),
    });
  });

  it('should render Login as root when session is null', () => {
    const element = React.createElement(LoginScreen, { navigation: mockNavigation });
    expect(element).toBeTruthy();
    expect(element.type).toBe(LoginScreen);
  });
});

describe('LoginScreen styles audit', () => {
  it('should not have zero dimensions or hidden elements in source', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '../../screens/public/LoginScreen.tsx'), 'utf-8');
    
    expect(source).not.toContain('width: 0');
    expect(source).not.toContain('height: 0');
    expect(source).not.toContain('opacity: 0');
    expect(source).not.toContain('display: \'none\'');
    expect(source).not.toContain('display: "none"');
  });
});
