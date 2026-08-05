/**
 * Biometric authentication service (fingerprint / Face ID).
 *
 * Wraps expo-local-authentication and persists the user's opt-in in the
 * device secure store. Every native call is guarded so a build without the
 * native module (or a device with no sensor) degrades gracefully to
 * "unavailable" instead of throwing.
 *
 * The `pine_biometric_enabled` flag is the single source of truth other
 * surfaces (e.g. an app-unlock gate) can read via isBiometricEnabled().
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

let LocalAuth: typeof import('expo-local-authentication') | null = null;
try {
  LocalAuth = require('expo-local-authentication');
} catch {
  LocalAuth = null;
}

const PREF_KEY = 'pine_biometric_enabled';

export interface BiometricInfo {
  /** Device has biometric hardware AND the native module is present. */
  available: boolean;
  /** At least one fingerprint / face is enrolled on the device. */
  enrolled: boolean;
  /** Human label for the strongest available modality. */
  label: string;
}

/** True when the native biometric module is present in this build. */
export function isBiometricSupported(): boolean {
  return LocalAuth != null;
}

export async function getBiometricInfo(): Promise<BiometricInfo> {
  if (!LocalAuth) return { available: false, enrolled: false, label: 'Biometrics' };
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuth.hasHardwareAsync(),
      LocalAuth.isEnrolledAsync(),
      LocalAuth.supportedAuthenticationTypesAsync(),
    ]);

    let label = 'Biometrics';
    if (types.includes(LocalAuth.AuthenticationType.FACIAL_RECOGNITION)) {
      label = Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock';
    } else if (types.includes(LocalAuth.AuthenticationType.FINGERPRINT)) {
      label = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (types.includes(LocalAuth.AuthenticationType.IRIS)) {
      label = 'Iris';
    }

    return { available: hasHardware, enrolled, label };
  } catch {
    return { available: false, enrolled: false, label: 'Biometrics' };
  }
}

/** Prompt the OS biometric dialog. Returns true only on a verified success. */
export async function authenticate(promptMessage = 'Confirm your identity'): Promise<boolean> {
  if (!LocalAuth) return false;
  try {
    const result = await LocalAuth.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      // Allow the device PIN/pattern as a fallback so users are never locked out.
      disableDeviceFallback: false,
    });
    return !!result.success;
  } catch {
    return false;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(PREF_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) await SecureStore.setItemAsync(PREF_KEY, 'true');
    else await SecureStore.deleteItemAsync(PREF_KEY);
  } catch {
    // Non-fatal — the toggle state simply won't persist across launches.
  }
}
