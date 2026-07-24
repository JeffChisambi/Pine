---
name: Dark mode implementation
description: How global dark mode is implemented in the Pine app — what was done, what is excluded, and the key patterns.
---

## Rule
All screens **except** `app/index.tsx`, `app/login.tsx`, `app/signup.tsx`, `app/onboarding-2.tsx`, `app/onboarding-3.tsx` must use `useColors()` for background/text/border/card colors.

**Why:** User requested dark mode only for the authenticated part of the app; onboarding/auth screens stay light.

## How to apply
- Import `useColors` from `@/hooks/useColors`
- Call `const c = useColors()` inside the component body
- Use `c.background`, `c.card`, `c.border`, `c.text` for dynamic surfaces
- Brand colors (TEAL `#164951`, GREEN `#45B369`, RED `#EF4770`) and chart SVG colors stay static — they are correct on both themes

## Key files
- `contexts/theme-context.tsx` — `ThemeProvider` + `useTheme()` hook; persisted to AsyncStorage under `@pine_dark_mode`
- `constants/colors.ts` — `light` and `dark` palettes; dark background is `#1F2937`, card `#374151`, border `#4B5563`, text `#F9FAFB`
- `hooks/useColors.ts` — reads `isDark` from `useTheme()`, returns the right palette
- `app/_layout.tsx` — `ThemeProvider` is outermost provider, wraps `AuthProvider`
- Native stack scene and navigation-bar backgrounds must also use the active palette so pop transitions do not reveal a white surface in dark mode.
- Hydrate the saved dark-mode preference before mounting navigation; otherwise the initial light render can flash before AsyncStorage restores the dark palette.
- `app/(tabs)/profile.tsx` — the toggle itself; uses `isDark`/`toggleTheme` from `useTheme()`

## Completed screens
All authenticated screens have been updated: tabs (index, market, news, portfolio, profile), stock/[ticker].tsx, stock-search.tsx, profile/personal-data.tsx, profile/notifications.tsx, profile/push-notifications.tsx, trade/buy.tsx, trade/sell.tsx (redirect only), trade/confirm.tsx, trade/exchange.tsx, trade/history.tsx, trade/payment.tsx, trade/success.tsx.
