declare module 'expo-notifications' {
  export interface NotificationPermissionsStatus {
    status: 'granted' | 'denied' | 'undetermined';
    granted: boolean;
    canAskAgain: boolean;
  }

  export interface NotificationHandlerInput {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowBanner: boolean;
      shouldShowList: boolean;
    }>;
  }

  export interface ExpoPushToken {
    data: string;
  }

  export interface NotificationContentInput {
    title?: string;
    body?: string;
    data?: Record<string, any>;
    sound?: string;
    badge?: number;
  }

  export interface NotificationRequest {
    identifier: string;
    content: NotificationContentInput;
    trigger: any;
  }

  export interface NotificationTrigger {
    type: 'timeInterval' | 'calendar' | 'location';
    [key: string]: any;
  }

  export interface NotificationChannel {
    id: string;
    name: string;
    importance?: number;
    bypassDnd?: boolean;
    sound?: string;
    vibrationPattern?: number[];
    lightColor?: string;
    showBadge?: boolean;
    enableLights?: boolean;
    enableVibration?: boolean;
  }

  export function setNotificationHandler(handler: NotificationHandlerInput): void;
  export function getPermissionsAsync(): Promise<NotificationPermissionsStatus>;
  export function requestPermissionsAsync(): Promise<NotificationPermissionsStatus>;
  export function getExpoPushTokenAsync(options?: { experienceId?: string; development?: boolean }): Promise<{ data: string }>;
  export function setNotificationChannelAsync(channelId: string, channel: NotificationChannel): Promise<void>;
  export function addPushTokenListener(listener: (token: { data: string }) => void): { remove: () => void };
  export function addNotificationReceivedListener(listener: (notification: { request: NotificationRequest }) => void): { remove: () => void };
  export function addNotificationResponseReceivedListener(listener: (response: { notification: { request: NotificationRequest }; actionIdentifier: string }) => void): { remove: () => void };
  export function removeNotificationSubscription(subscription: { remove: () => void }): void;
  export function scheduleNotificationAsync(notification: NotificationContentInput, trigger: NotificationTrigger): Promise<string>;
  export function cancelAllScheduledNotificationsAsync(): Promise<void>;
  export function cancelScheduledNotificationAsync(notificationId: string): Promise<void>;
  export function getAllScheduledNotificationsAsync(): Promise<NotificationRequest[]>;
  export function getBadgeCountAsync(): Promise<number>;
  export function setBadgeCountAsync(count: number): Promise<void>;
  export function dismissAllNotificationsAsync(): Promise<void>;
  export function dismissNotificationAsync(notificationId: string): Promise<void>;

  export const DEFAULT_ACTION_IDENTIFIER: string;
  export const NotificationPermissionsStatus: {
    GRANTED: 'granted';
    DENIED: 'denied';
    UNDETERMINED: 'undetermined';
  };
}
