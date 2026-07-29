---
name: KYC and user-isolation fixes
description: Key decisions and constraints from fixing the KYC workflow and data persistence issues in Pine.
---

# KYC workflow and user-isolation fixes

## What was fixed and why

### Query cache not cleared on logout (critical data-bleed fix)
The `QueryClient` is a module-level singleton. On logout, `queryClient.clear()` must be called to wipe cached wallet/portfolio/watchlist data before the next user logs in on the same device. The queryClient is exported from `services/query-client.ts` so that both `app/_layout.tsx` (provider) and `services/auth-context.tsx` (logout) share the exact same instance.

**Why:** TanStack Query's default `gcTime` is 10 minutes. Without `clear()` on logout, the outgoing user's data stays in memory and can be served to the next user.

**How to apply:** Any new logout path must also call `queryClient.clear()` before returning.

### Pending deposit cleared on logout
`clearPendingDeposit()` is called in `logout()` in `auth-context.tsx`. This prevents User A's pending deposit record (keyed at `@pine_pending_deposit` in AsyncStorage, not namespaced) from being picked up by User B's reconciliation on the same device.

### KYC session resumption (upload-id.tsx)
`kycApi.start()` was called on every mount of `upload-id.tsx`, creating a new application each time. Fixed by calling `kycApi.getStatus()` first; if there is an existing session with `canProcess === false` (docs not yet processed), its `applicationId` is reused.

**Why:** Each `/kyc/start` call creates a new backend KYC application. Users who exit mid-flow were accumulating orphaned applications.

### Fake upload in upload-proof-of-residency.tsx
The upload slot previously called `setUploaded(v => !v)` — a boolean toggle, no image picker, no API call. Fixed to use `ImagePicker.launchImageLibraryAsync()` with a real loading state. The actual API upload is stubbed with a TODO comment because there is no `/kyc/upload-proof-of-residency` backend endpoint yet.

**Backend change required:** `POST /kyc/upload-proof-of-residency` with `multipart/form-data { applicationId, file }` → `{ documentId }`.

### Fake progress bar removed from selfie-camera.tsx
The original progress bar ran a random interval timer independently of the actual API call, showing 45% while the API could already be done. Replaced with a plain spinner + text label that simply tracks `uploading` / `processing` state. No fake percentages.

### Missing applicationId guard in selfie-camera.tsx
If navigated to directly (without going through upload-id), `applicationId` would be `undefined` and `kycApi.uploadSelfie(undefined, ...)` would send a broken request. Added a `useEffect` guard that alerts and redirects to profile on mount if `applicationId` is missing.

### Premature refreshProfile() in selfie-camera.tsx
`refreshProfile()` was called *before* `router.replace()` to verify-success, blocking navigation unnecessarily (and silently eating errors). Removed — `verify-success.tsx` already calls `refreshProfile()` on the Done button press, which is the correct place (after the user has seen the result).

### Document type passed from proof-of-residency to upload-id
The proof-of-residency screen lets the user pick National ID vs Passport, but the selection was never forwarded. Now passed as `docType` route param. `upload-id.tsx` reads `docType` and: (a) adjusts all copy to match, (b) hides the back-of-ID slot for passports since they're single-page.

## Backend-only issues (cannot be fixed on frontend)

None additional beyond the upload-proof-of-residency endpoint noted above.

## Package install workaround
`pnpm install` is blocked by the Replit firewall for the `tar` package (any version, even as an explicit override) because `@expo/cli` requires it as a direct dep. Use `npm install --legacy-peer-deps` instead.
