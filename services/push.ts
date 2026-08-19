/**
 * Push-notification registration service.
 *
 * Wraps expo-notifications for remote push. Every call is defensively guarded:
 * if the native module is not present in the running binary (e.g. a dev client
 * built before expo-notifications was added), the functions resolve to an
 * "unavailable" status instead of throwing, so the JS bundle keeps working and
 * the feature simply lights up after the app is rebuilt.
 *
 * Backend contract: POST/DELETE /notifications/devices (see BACKEND_API.md).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { notificationsApi } from './api';

export type PushPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'unavailable';

// Lazily resolve the native modules. `require` is wrapped so a missing native
// module (or a bundle that never linked it) can never crash the app.
//
// In Expo Go the native push module isn't present and merely importing
// expo-notifications logs a noisy "not fully supported in Expo Go" warning, so
// we skip the import entirely there and report push as unavailable. Real push
// works in a development/production build (appOwnership !== 'expo').
const isExpoGo = (Constants as any).appOwnership === 'expo';

let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch {
    Notifications = null;
    Device = null;
  }
}

/** True when the native push module is actually available in this build. */
export function isPushAvailable(): boolean {
  return Notifications != null;
}

/** Remember the last token we registered so we can unregister it later. */
let lastRegisteredToken: string | null = null;

function resolveProjectId(): string | undefined {
  return (
    (Constants.expoConfig as any)?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId
  );
}

/**
 * Configure how notifications behave while the app is foregrounded, and create
 * the default Android channel. Safe to call multiple times; no-ops when the
 * native module is unavailable. Call once from the app root.
 */
export async function configurePushNotifications(): Promise<void> {
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        // Legacy fields for older expo-notifications typings.
        shouldShowAlert: true,
      }) as any,
    });

    if (Platform.OS === 'android') {
      // MAX importance = heads-up pop-up banner with sound, not a silent tray
      // entry. Android freezes a channel's importance after first creation,
      // so devices that already created 'default' at DEFAULT importance can't
      // be upgraded — hence a NEW 'alerts' channel; the backend targets it
      // via channelId in the push payload.
      await Notifications.setNotificationChannelAsync('alerts', {
        name: 'Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
      });
      // Keep the legacy channel functional for any in-flight pushes.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  } catch {
    // Non-fatal — foreground presentation just falls back to system defaults.
  }
}

/** Read the current OS permission status without prompting. */
export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (!Notifications) return 'unavailable';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unavailable';
  }
}

/**
 * Ensure OS permission, fetch the Expo push token, and register it with the
 * backend. Prompts for permission only when `promptIfNeeded` is true (pass
 * false for silent, launch-time registration that should not nag the user).
 *
 * Returns the resulting permission status and, on success, the token.
 */
export async function registerForPushNotificationsAsync(
  promptIfNeeded = true,
): Promise<{ status: PushPermissionStatus; token?: string }> {
  if (!Notifications) return { status: 'unavailable' };

  try {
    // Physical device check — push tokens are not issued to simulators.
    if (Device && Device.isDevice === false) {
      return { status: 'unavailable' };
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      if (!promptIfNeeded) return { status: status === 'denied' ? 'denied' : 'undetermined' };
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') {
      return { status: status === 'denied' ? 'denied' : 'undetermined' };
    }

    await configurePushNotifications();

    const projectId = resolveProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;

    // Best-effort backend sync; a failure here does not revoke OS permission.
    try {
      await notificationsApi.registerDevice(token, Platform.OS as 'ios' | 'android' | 'web', {
        deviceName: Device?.deviceName ?? undefined,
        appVersion: (Constants.expoConfig as any)?.version ?? undefined,
      });
      lastRegisteredToken = token;
    } catch {
      // Keep the granted status; the launch-time retry will re-sync later.
    }

    return { status: 'granted', token };
  } catch {
    return { status: 'unavailable' };
  }
}

/**
 * Best-effort removal of this device's push token from the backend (e.g. on
 * logout, or when the user turns push off). Never throws.
 */
export async function unregisterPushDevice(): Promise<void> {
  if (!Notifications) return;
  try {
    let token = lastRegisteredToken;
    if (!token) {
      const projectId = resolveProjectId();
      const res = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      token = res.data;
    }
    if (token) await notificationsApi.unregisterDevice(token);
    lastRegisteredToken = null;
  } catch {
    // Ignore — the backend can also expire stale tokens on send failure.
  }
}

/**
 * Navigate to the appropriate screen when a push notification is tapped.
 */
function handleNotificationResponse(data: Record<string, any> | undefined) {
  if (!data) return;

  try {
    if (data.orderId) {
      router.push('/trade/history' as any);
    } else if (data.type === 'KYC_APPROVED' || data.type === 'KYC_REJECTED') {
      router.push('/profile/personal-data' as any);
    } else if (data.type === 'DEPOSIT' || data.type === 'WITHDRAWAL') {
      router.push('/(tabs)/' as any);
    } else {
      router.push('/profile/notifications' as any);
    }
  } catch {
    // Navigation may not be ready yet — ignore.
  }
}

/**
 * Set up listeners for notification taps (foreground, background, and cold
 * start). Returns a cleanup function. Call once from the root layout.
 */
export function setupNotificationListeners(): () => void {
  if (!Notifications) return () => {};

  // Handle taps on notifications that arrived while the app was backgrounded
  // or foregrounded.
  const responseSub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as
        | Record<string, any>
        | undefined;
      handleNotificationResponse(data);
    },
  );

  // Handle a cold-start tap: the user tapped a notification that launched the
  // app from a killed state.
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) {
        const data = response.notification.request.content.data as
          | Record<string, any>
          | undefined;
        handleNotificationResponse(data);
      }
    })
    .catch(() => {});

  return () => {
    responseSub.remove();
  };
}
