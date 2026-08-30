// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: (path: string) => `appmanicure://${path}`,
  addEventListener: () => ({ remove: jest.fn() }),
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: { playAsync: jest.fn(), setOnPlaybackStatusUpdate: jest.fn(), unloadAsync: jest.fn() } }),
    },
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const View = require('react-native').View;
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const SafeAreaView = (props: any) => React.createElement(View, props, props.children);
  const SafeAreaProvider = (props: any) => React.createElement(View, props, props.children);
  return {
    __esModule: true,
    SafeAreaView,
    SafeAreaProvider,
    SafeAreaConsumer: ({ children }: any) => children(insets),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 360, height: 800 }),
  };
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const mockComponent = (name: string) => {
    const comp = (props: any) => React.createElement(name, props, props.children);
    comp.displayName = name;
    return comp;
  };
  return {
    __esModule: true,
    default: mockComponent('Svg'),
    Path: mockComponent('Path'),
    Circle: mockComponent('Circle'),
    Rect: mockComponent('Rect'),
    Line: mockComponent('Line'),
    Polygon: mockComponent('Polygon'),
    Polyline: mockComponent('Polyline'),
    G: mockComponent('G'),
    Defs: mockComponent('Defs'),
    Stop: mockComponent('Stop'),
    LinearGradient: mockComponent('LinearGradient'),
  };
});

// Silence console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

(global as any).__DEV__ = false;

// Load environment variables for integration tests from .env file
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch {
  // .env not present; integration tests will skip
}
