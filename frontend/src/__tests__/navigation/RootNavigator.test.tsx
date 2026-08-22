import React from 'react';
import { render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => {
    const Stack: any = ({ children }: { children: React.ReactNode }) => children;
    Stack.Navigator = ({ children }: { children: React.ReactNode }) => children;
    Stack.Screen = () => null;
    return Stack;
  },
}));

jest.mock('@hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@screens/public/SplashScreen', () => () => null);
jest.mock('@navigation/stacks/PublicStack', () => () => null);
jest.mock('@navigation/stacks/EmailVerificationStack', () => () => null);
jest.mock('@navigation/stacks/ClientStack', () => () => null);
jest.mock('@navigation/stacks/AdminStack', () => () => null);

const mockAuthState = { loading: true, session: null, isEmailVerified: false, profile: null };

import RootNavigator from '@navigation/RootNavigator';

let current: ReturnType<typeof render> | null = null;

afterEach(() => {
  current?.unmount();
  current = null;
  jest.clearAllMocks();
});

describe('RootNavigator splash', () => {
  it('should keep splash visible while loading', () => {
    mockAuthState.loading = true;
    (SplashScreen.hideAsync as jest.Mock).mockClear();

    current = render(<RootNavigator />);

    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('should hide splash when loading finishes (success/error/timeout)', () => {
    mockAuthState.loading = false;
    mockAuthState.session = null;
    mockAuthState.profile = null;
    (SplashScreen.hideAsync as jest.Mock).mockClear();

    current = render(<RootNavigator />);

    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});
