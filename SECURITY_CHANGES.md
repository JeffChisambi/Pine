# Security Changes — Pine

Generated: 2026-07-26

---

## Changes Applied in This Frontend

### 1. Auth tokens migrated to OS secure storage — `services/auth-store.ts`

**Severity:** Medium  
**Was:** Access token, refresh token, and user profile stored in `AsyncStorage` — an unencrypted SQLite database on Android and an unencrypted flat file on iOS. Readable on rooted/jailbroken devices without any special tooling.  
**Now:** All three keys are stored using `expo-secure-store`, which maps to:
- **iOS** — Keychain Services, hardware-backed on modern iPhones, protected by the device passcode / biometrics.
- **Android** — `EncryptedSharedPreferences` backed by Android Keystore. Tokens are encrypted at rest and tied to the app's signing certificate.

The non-sensitive onboarding flag (`@pine_has_onboarded`) intentionally stays in `AsyncStorage` — it carries no credentials.

**Package added:** `expo-secure-store ~14.0.1` (run `pnpm install` after pulling this change).

**Migration note for existing users:** The first time a user opens the updated app their secure-store read will return `null` (the old AsyncStorage token is still present but not read). They will be logged out and redirected to the login screen. This is the correct and safe behaviour — re-login writes the token into secure storage. No data is lost; the old AsyncStorage keys can be cleaned up with a one-time migration if a silent upgrade is required.

---

### 2. Dependency CVEs pinned via pnpm overrides — `package.json`

**Severity:** High (10 findings)  
All were transitive build-tool dependencies, not runtime app code.

| Package | Old version | CVE / GHSA | Fix version | Change type |
|---|---|---|---|---|
| `postcss` | 8.4.49 | GHSA-r28c-9q8g-f849 | ≥ 8.5.18 | Patch (non-breaking) |
| `postcss` | 8.4.49 | CVE-2026-45623 / GHSA-6g55-p6wh-862q | ≥ 8.5.12 | Patch (non-breaking) |
| `brace-expansion` | 5.0.6 | CVE-2026-14257 / GHSA-mh99-v99m-4gvg | ≥ 5.0.8 | Patch (non-breaking) |

Added to `pnpm.overrides`:
```json
"postcss": "^8.5.18",
"brace-expansion": "^5.0.8"
```

**Remaining unfixed dependency:** `brace-expansion@2.1.2` (same DoS CVE) — see backend section below.

---

### 3. WebView `originWhitelist` restricted — `app/trade/payment-webview.tsx`

**Severity:** Low  
**Was:** `originWhitelist={["*"]}` — allowed any URL scheme (including `file://`, `intent://`, `javascript:`) to reach the WebView's navigation handlers.  
**Now:** `originWhitelist={["https://*", "http://*", "pine://*"]}` — limited to the three schemes the payment flow actually uses.

---

## Issues Requiring Backend / Infrastructure Action

### A. `brace-expansion@2.x` DoS (CVE-2026-14257) — Build System

**Severity:** High  
The scanner found `brace-expansion@2.1.2` in `package-lock.json` (not the pnpm lockfile). This version is pulled in by a transitive dependency that expects the `^2.x` range — bumping to `5.x` directly would be a cross-major override and may break that dependent.

**Action required:**
1. Identify which direct dependency pulls in `brace-expansion@2.x`:
   ```bash
   npm why brace-expansion
   # or
   pnpm why brace-expansion
   ```
2. Upgrade that direct dependency to a version that already requires `brace-expansion@^5`, or apply a scoped override once the culprit is known:
   ```json
   "pnpm": {
     "overrides": {
       "culprit-package>brace-expansion": "^5.0.8"
     }
   }
   ```
3. If the direct dependency cannot be upgraded, assess whether the build pipeline is exposed to untrusted input in glob patterns (the DoS only triggers on attacker-controlled pattern strings). CI/CD pipelines are typically low-risk here.

---

### B. Raw Card Data Flowing Through the Backend — PCI DSS

**Severity:** Informational (feature not yet active — returns 501)  
**File:** `app/payment-card.tsx` + `services/api.ts` (`cardPaymentsApi.initiateCardPayment`)

The card entry screen collects `cardNumber`, `cvv`, `expiryMonth`, and `expiryYear` and sends them as JSON to `POST /payments/card/initiate` on the Pine backend. If the backend receives raw Primary Account Numbers (PANs), it falls within the scope of **PCI DSS SAQ D**, the most demanding compliance tier (quarterly penetration tests, network segmentation, dedicated cardholder data environment, etc.).

**Recommended backend approach — tokenise on the device:**
Use the card processor's official mobile SDK (Stripe, Flutterwave, Adyen, etc.) so the raw PAN never leaves the device and never touches the Pine backend:

```
User enters card → Processor SDK → Processor servers → token returned
                                                           ↓
                                        Pine app sends token to Pine backend
                                        Pine backend calls processor with token
```

This reduces Pine's PCI scope to **SAQ A** (the lightest tier, no cardholder data on your servers).

If your processor is **Flutterwave / Rave** (the PayChangu integration already in use suggests this region):
- Use the Flutterwave React Native SDK or their inline charge API with tokenisation enabled.
- The backend calls `/v3/charges?type=card` with the token, not the raw PAN.

**Frontend change needed once backend is ready:** Replace the `cardPaymentsApi.initiateCardPayment` body — instead of forwarding raw card fields, pass only the processor-issued token.

---

### C. API Base URL Falls Back to HTTP in Development — `services/api.ts`

**Severity:** Informational  
Lines 26 and 29 fall back to `http://` when `EXPO_PUBLIC_API_URL` is unset (dev builds only).

**Action required on the backend / deployment side:**
- Ensure `EXPO_PUBLIC_API_URL` is always set to an `https://` URL in production builds (EAS Build environment variables or CI).
- On the backend, enforce HTTPS-only (redirect or reject plain HTTP) and add HSTS headers.
- Optionally enforce in the app:
  ```typescript
  // services/api.ts — add after resolveBaseUrl()
  if (!__DEV__ && !API_BASE_URL.startsWith('https://')) {
    throw new Error('API_BASE_URL must use HTTPS in production');
  }
  ```

---

## Summary Table

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Auth tokens in unencrypted AsyncStorage | Medium | ✅ Fixed — migrated to `expo-secure-store` |
| 2 | `postcss` path traversal / file read CVEs | High | ✅ Fixed — pinned via pnpm overrides |
| 3 | `brace-expansion@5.x` DoS | High | ✅ Fixed — pinned via pnpm overrides |
| 4 | WebView `originWhitelist={["*"]}` | Low | ✅ Fixed — restricted to `https`, `http`, `pine` |
| 5 | `brace-expansion@2.x` DoS | High | ⚠️ Backend/build — see section A |
| 6 | Raw card PAN sent to Pine backend | Informational | ⚠️ Backend — see section B (feature not live) |
| 7 | HTTP fallback URL in dev mode | Informational | ⚠️ Backend/deploy — see section C |
