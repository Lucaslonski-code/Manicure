import { renderHook, act } from '@testing-library/react-native';
import { useNotifications } from '@hooks/useNotifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test]' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
  DEFAULT_ACTION_IDENTIFIER: 'default',
}));

jest.mock('expo-linking', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  openURL: jest.fn(() => Promise.resolve()),
  createURL: jest.fn((path: string) => `appmanicure://${path}`),
}));

jest.mock('../../services/notifications/notifications', () => ({
  registerNotificationToken: jest.fn(() => Promise.resolve()),
  deactivateNotificationToken: jest.fn(() => Promise.resolve()),
  fetchNotificationTokens: jest.fn(() => Promise.resolve([])),
}));

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading true', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.loading).toBe(true);
  });

  it('should register token successfully', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.token).toBe('ExponentPushToken[test]');
  });

  it('should handle permission denied', async () => {
    const mockRequestPermissions = require('expo-notifications').requestPermissionsAsync;
    mockRequestPermissions.mockImplementationOnce(() => Promise.resolve({ granted: false }));

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.register();
    });

    expect(result.current.token).toBeNull();
  });
});