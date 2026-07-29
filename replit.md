# Pine — Stock Trading App

React Native mobile app built with Expo and Expo Router. Targets Malawi market (MWK currency, Malawi phone numbers).

## Running the app

The app runs on a physical device or emulator via **Expo Go** (tunnel mode):

```bash
npx expo start --tunnel
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

**There is no browser/web preview** — this is a React Native app and must run on a device.

## Stack

| Layer | Library |
|---|---|
| Framework | Expo 54, React Native 0.81 |
| Navigation | Expo Router (file-based) |
| Data fetching | TanStack React Query v5 |
| Auth storage | expo-secure-store (tokens + profile) |
| Local storage | AsyncStorage (non-sensitive flags only) |
| Animations | React Native Reanimated 4 |
| UI | Custom components, react-native-svg |

## Project structure

```
app/               # Screens (Expo Router file-based routing)
  (tabs)/          # Bottom-tab navigator
  kyc/             # KYC verification flow
  trade/           # Buy / sell flow
  treasury/        # T-bill investment flow
  profile/         # Profile sub-screens
components/        # Reusable UI components
constants/         # Theme colors
contexts/          # ThemeContext (dark mode)
hooks/             # useColors, useWatchlist, etc.
services/          # API client, auth, query client
  api.ts           # All API calls + kycApi
  auth-context.tsx # AuthProvider / useAuth
  auth-store.ts    # SecureStore wrapper for tokens
  query-client.ts  # Shared TanStack QueryClient singleton
  wallet-queries.ts # Wallet balance hooks + reconciliation
utils/             # navigation helpers
data/              # Static data (stocks, treasury)
```

## Environment

- `EXPO_PUBLIC_API_URL` — Backend base URL (e.g. `https://api.pine.mw/v1`). Required in production builds. In development, auto-derived from the Metro bundler host.

## Package installation

pnpm is the package manager. The `tar` package is blocked by the Replit firewall as a direct dependency — use `npm install --legacy-peer-deps` as the workaround to install all packages.

## User preferences

_None recorded yet._
