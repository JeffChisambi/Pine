# Pine — Stock Trading App

A React Native mobile app built with [Expo](https://expo.dev) and [Expo Router](https://expo.github.io/router).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- [Expo Go](https://expo.dev/go) on your iOS or Android device, **or** an emulator

### Install

```bash
pnpm install
```

### Run

```bash
pnpm start
```

Then scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

## Project Structure

```
pine/
├── app/                    # Screens (file-based routing via Expo Router)
│   ├── (tabs)/             # Bottom-tab navigator screens
│   │   ├── index.tsx       # Home / Dashboard
│   │   ├── market.tsx      # Market overview
│   │   ├── portfolio.tsx   # User portfolio
│   │   ├── news.tsx        # News feed
│   │   └── profile.tsx     # User profile
│   ├── _layout.tsx         # Root navigation layout
│   ├── index.tsx           # Onboarding splash screen
│   ├── login.tsx
│   ├── signup.tsx
│   ├── phone-number.tsx
│   ├── verify-code.tsx
│   ├── create-pin.tsx
│   ├── forgot-password.tsx
│   ├── onboarding-3.tsx
│   ├── deposit.tsx
│   ├── withdraw.tsx
│   ├── stock-search.tsx
│   ├── stock/
│   │   └── [ticker].tsx    # Stock detail screen
│   ├── trade/              # Trade flow screens
│   │   ├── buy.tsx
│   │   ├── sell.tsx
│   │   ├── exchange.tsx
│   │   ├── payment.tsx
│   │   ├── confirm.tsx
│   │   ├── success.tsx
│   │   └── history.tsx
│   └── profile/            # Profile sub-screens
│       ├── notifications.tsx
│       ├── personal-data.tsx
│       └── push-notifications.tsx
├── assets/
│   └── images/             # App icons and images
├── components/             # Reusable UI components
├── constants/              # Theme colors and constants
├── hooks/                  # Custom React hooks
├── designs/                # Design reference files (SVGs)
├── app.json                # Expo app configuration
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── package.json
```

## Tech Stack

| Library | Purpose |
|---|---|
| [Expo](https://expo.dev) | React Native toolchain |
| [Expo Router](https://expo.github.io/router) | File-based navigation |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Animations |
| [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | Gestures |
| [TanStack Query](https://tanstack.com/query) | Async state management |
| [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) | Gradient backgrounds |
| [Expo Blur](https://docs.expo.dev/versions/latest/sdk/blur-view/) | Glass/blur effects |
| [React Native SVG](https://github.com/software-mansion/react-native-svg) | SVG support |

## Scripts

| Command | Description |
|---|---|
| `pnpm start` | Start Expo dev server |
| `pnpm android` | Run on Android emulator/device |
| `pnpm ios` | Run on iOS simulator/device |
| `pnpm typecheck` | TypeScript type checking |
