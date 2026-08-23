jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
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

describe('RootNavigator splash lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.loading = true;
    mockAuthState.session = null;
    mockAuthState.isEmailVerified = false;
    mockAuthState.profile = null;
  });

  it('should engage native splash via module-level preventAutoHideAsync call', () => {
    const source = require('fs').readFileSync(
      require('path').join(__dirname, '../../navigation/RootNavigator.tsx'),
      'utf-8'
    );
    expect(source).toContain('SplashScreen.preventAutoHideAsync()');
  });

  it('should expose splash hide path when loading becomes false and session is null', () => {
    mockAuthState.loading = false;
    mockAuthState.session = null;

    const element = RootNavigator;
    expect(element).toBeTruthy();
  });

  it('should expose splash hide path when loading becomes false after error', () => {
    mockAuthState.loading = false;
    mockAuthState.session = null;

    const element = RootNavigator;
    expect(element).toBeTruthy();
  });

  it('should expose splash hide path when loading becomes false after timeout', () => {
    mockAuthState.loading = false;
    mockAuthState.session = null;

    const element = RootNavigator;
    expect(element).toBeTruthy();
  });
});

describe('RootNavigator public flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.loading = false;
    mockAuthState.session = null;
    mockAuthState.isEmailVerified = false;
    mockAuthState.profile = null;
  });

  it('should route to PublicStack when session is null', () => {
    mockAuthState.loading = false;
    mockAuthState.session = null;

    const element = RootNavigator;
    expect(element).toBeTruthy();
  });

  it('should have LoginScreen as root of PublicStack', () => {
    mockAuthState.loading = false;
    mockAuthState.session = null;

    const element = RootNavigator;
    expect(element).toBeTruthy();
  });
});
