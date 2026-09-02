/**
 * Device and transport hardening.
 *
 * Three defences, all best-effort and none allowed to break app startup:
 *   1. Certificate pinning  — a hostile network with a trusted proxy CA can
 *                             no longer read or alter Pine's traffic.
 *   2. Screen capture       — balances and card entry stay out of screenshots
 *                             and the app-switcher preview.
 *   3. Device integrity     — warn when running on a rooted/jailbroken device,
 *                             where another app can inspect this one's memory.
 */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as ScreenCapture from 'expo-screen-capture';
import { initializeSslPinning } from 'react-native-ssl-public-key-pinning';
import { API_BASE_URL, reportSystemError } from './api';

// ─── Certificate pinning ──────────────────────────────────────────────────────

/**
 * SHA-256 hashes of the Subject Public Key Info, read from the live chain of
 * api.appine.online.
 *
 * DELIBERATELY NOT the leaf certificate: certbot renews it roughly every 60
 * days and pinning it would take the whole app offline on renewal. These are
 * the issuing intermediate and the two roots above it, so a renewal — or a
 * rotation of the intermediate — still matches, while a corporate/interception
 * CA (which chains to neither) is rejected.
 *
 * To refresh, run:
 *   openssl s_client -servername api.appine.online -connect api.appine.online:443 -showcerts
 * then for each certificate:
 *   openssl x509 -pubkey -noout | openssl pkey -pubin -outform der \
 *     | openssl dgst -sha256 -binary | openssl enc -base64
 */
const PINS = {
  /** Let's Encrypt YE1 — the intermediate that issues our leaf. */
  intermediate: 'brzvtCELCIZUo4sD/qPX0ccRtPsd3DY6RfmxpOU9oB4=',
  /** ISRG Root YE. */
  rootYe: 'sCkq5UWXjg+7mKu9lMhhYF5bGLsy7VI/UNW3tccdR7w=',
  /** ISRG Root X2 — long-lived anchor, the backup that prevents a lockout. */
  rootX2: 'diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=',
};

/** Host extracted from the configured API URL, so the two can never drift. */
function apiHost(): string | null {
  try {
    return new URL(API_BASE_URL).hostname;
  } catch {
    return null;
  }
}

/**
 * Pin TLS for the Pine API.
 *
 * Skipped in development, where the API is reached over plain HTTP on a LAN
 * address and there is no stable certificate to pin.
 *
 * If initialisation itself fails the app continues UNPINNED rather than
 * refusing to start — a library or OS fault must not lock every user out of
 * their money — but the failure is reported so it cannot pass unnoticed.
 *
 * Only the Pine API host is pinned. Other hosts the app talks to — notably
 * the broker's Mastercard Gateway during a card payment — keep normal system
 * trust, since their certificates are outside our control.
 */
export async function initializeCertificatePinning(): Promise<void> {
  const host = apiHost();
  if (__DEV__ || !host || !API_BASE_URL.startsWith('https://')) return;

  try {
    await initializeSslPinning({
      [host]: {
        includeSubdomains: false,
        publicKeyHashes: [PINS.intermediate, PINS.rootYe, PINS.rootX2],
        /**
         * Safety valve. If an install stops receiving updates and these pins
         * eventually go stale, pinning switches OFF on this date instead of
         * locking that user out of their money permanently. Move it forward
         * whenever the pins are reviewed.
         */
        expirationDate: '2027-09-01',
      },
    });
  } catch (err) {
    reportSystemError('security.certificatePinning', err, 'HIGH');
  }
}

// ─── Screen capture ───────────────────────────────────────────────────────────

/**
 * Block screenshots and screen recording.
 *
 * Android: sets FLAG_SECURE, which also blanks the app in the recents
 * switcher — both halves of the problem in one call.
 *
 * iOS: the OS does not let an app block screenshots at all. This suppresses
 * capture during screen RECORDING; the app-switcher preview is handled
 * separately by <PrivacyScreen/>, which covers the UI as the app deactivates.
 */
export async function enableScreenCaptureProtection(): Promise<void> {
  try {
    await ScreenCapture.preventScreenCaptureAsync();
  } catch (err) {
    // Not fatal: the app is still perfectly usable without it.
    reportSystemError('security.screenCapture', err, 'LOW');
  }
}

// ─── Device integrity ─────────────────────────────────────────────────────────

let integrityChecked = false;

/**
 * Detect a rooted (Android) or jailbroken (iOS) device.
 *
 * On such a device another process can read this app's memory, so tokens and
 * anything typed here should be treated as observable. We warn rather than
 * block: rooting is legal, plenty of legitimate users do it, and locking them
 * out of their own money would be a worse outcome than an informed warning.
 *
 * Returns true when the device looks compromised. Runs at most once per launch.
 */
export async function checkDeviceIntegrity(): Promise<boolean> {
  if (integrityChecked) return false;
  integrityChecked = true;

  try {
    // Emulators trip root heuristics constantly; never warn on one.
    if (!Device.isDevice) return false;
    return await Device.isRootedExperimentalAsync();
  } catch {
    // A detection failure is not evidence of compromise.
    return false;
  }
}

/** Human-readable name for the warning copy. */
export const compromisedDeviceTerm =
  Platform.OS === 'ios' ? 'jailbroken' : 'rooted';
