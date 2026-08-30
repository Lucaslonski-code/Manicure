import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { registerNotificationToken, deactivateNotificationToken, fetchNotificationTokens } from '../services/notifications/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }) as any,
});

export function useNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const registrationRef = useRef<Promise<void> | null>(null);

  const register = useCallback(async () => {
    // Prevent duplicate registrations
    if (registrationRef.current) {
      return registrationRef.current;
    }

    registrationRef.current = (async () => {
      try {
        setLoading(true);
        const existingStatus = await Notifications.getPermissionsAsync();
        setPermissionStatus(existingStatus);
        let finalStatus = existingStatus;

        if (!existingStatus.granted) {
          const requested = await Notifications.requestPermissionsAsync();
          setPermissionStatus(requested);
          finalStatus = requested;
        }

        if (!finalStatus.granted) {
          setLoading(false);
          return;
        }

        const expoPushToken = await Notifications.getExpoPushTokenAsync();
        const pushToken = expoPushToken.data;
        if (!pushToken) {
          setLoading(false);
          return;
        }

        setToken(pushToken);
        await registerNotificationToken(pushToken, Platform.OS as 'android' | 'ios');
      } catch (err) {
        console.error('Error registering notification token:', err);
      } finally {
        setLoading(false);
        registrationRef.current = null;
      }
    })();

    return registrationRef.current;
  }, []);

  const unregister = useCallback(async () => {
    try {
      if (token) {
        await deactivateNotificationToken(token);
        setToken(null);
      }
    } catch (err) {
      console.error('Error unregistering notification token:', err);
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    let pushTokenSubscription: { remove: () => void } | null = null;
    let receivedSubscription: { remove: () => void } | null = null;
    let responseSubscription: { remove: () => void } | null = null;

    const init = async () => {
      if (!isMounted) return;
      try {
        const status = await Notifications.getPermissionsAsync();
        if (isMounted) {
          setPermissionStatus(status);
        }

        const tokens = await fetchNotificationTokens();
        const activeToken = tokens.find(t => t.is_active);
        if (activeToken && isMounted) {
          setToken(activeToken.token);
        }
      } catch (err) {
        console.error('Error initializing notifications:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();

    pushTokenSubscription = Notifications.addPushTokenListener(async (token) => {
      if (!isMounted) return;
      setToken(token.data);
      // Don't register here - register is already called by useAuth
      // Just update the local token state
    });

    receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        const url = response.notification.request.content.data?.url as string | undefined;
        if (url) {
          try {
            const parsed = new URL(url);
            if (parsed.protocol === 'appmanicure:') {
              Linking.openURL(url);
            }
          } catch {
            // Ignore malformed URLs
          }
        }
      }
    });

    return () => {
      isMounted = false;
      if (pushTokenSubscription) {
        pushTokenSubscription.remove();
      }
      if (receivedSubscription) {
        receivedSubscription.remove();
      }
      if (responseSubscription) {
        responseSubscription.remove();
      }
    };
  }, []);

  return {
    token,
    loading,
    permissionStatus,
    register,
    unregister,
  };
}