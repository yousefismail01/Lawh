---
phase: quick-6
plan: 1
subsystem: mobile-navigation
tags: [hub, profile, bottom-tabs, navigation, dark-mode, auth]
dependency_graph:
  requires:
    - lawh-mobile/stores/authStore.ts
    - lawh-mobile/lib/supabase.ts
    - lawh-mobile/app/(main)/_layout.tsx
  provides:
    - hub.tsx tab-based home screen
    - profile.tsx full profile screen
  affects:
    - lawh-mobile/app/(main)/hub.tsx
    - lawh-mobile/app/(main)/profile.tsx
tech_stack:
  added: []
  patterns:
    - state-based tab switching (no nested expo-router tabs)
    - useColorScheme() dark mode palette
    - supabase.auth.signOut() + store clear + router.replace for log out
key_files:
  created: []
  modified:
    - lawh-mobile/app/(main)/hub.tsx
    - lawh-mobile/app/(main)/profile.tsx
decisions:
  - Used state-based tab switching (useState) to avoid expo-router nested tab restructuring
  - Navigation post-logout goes to /auth/sign-in (typed route; /auth alone is not typed)
  - Profile icon uses U+1F464 person silhouette emoji consistent with plan spec
metrics:
  duration: ~8 minutes
  completed_date: "2026-03-06T05:06:20Z"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 6: Home Page with Bottom Tabs, Hifz Goals, Dashboard Summary

State-based bottom tab home screen (Dashboard/Goals/Hifz/Activity) with top bar settings/profile icons, plus a full profile screen with avatar initial, user info, log out, and account links.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Rebuild hub.tsx as tab-based home with top bar | a5669d2 | lawh-mobile/app/(main)/hub.tsx |
| 2 | Rebuild profile.tsx as full profile screen | 64da0aa | lawh-mobile/app/(main)/profile.tsx |

## What Was Built

### hub.tsx

Replaced the feature-grid layout with a proper tab-based home screen:

- **Top bar:** Settings gear icon (left, navigates to `/(main)/settings`), bold "Lawh" title (center), person icon (right, navigates to `/(main)/profile`)
- **4 bottom tabs:** Dashboard (U+229E), Goals (U+25CE), Hifz (U+263E), Activity (U+224B)
- **Dashboard tab:** Prominent "Open Mushaf" card (dark background, white text) that calls `router.back()`, plus a Coming Soon placeholder section below
- **Goals/Hifz/Activity tabs:** Centered Coming Soon placeholder panels with title and descriptive subtitle
- **Bottom tab bar:** Active tab shows dark indicator line at top + dark text/icon; inactive shows muted gray; hairline top border
- **Dark mode:** Full palette via `useColorScheme()` — bg, surface, border, text, muted, card colors

### profile.tsx

Replaced the stub with a complete profile screen:

- **Top bar:** Back chevron (U+2039) on left, "Profile" title centered
- **Avatar section:** 80x80 circle with uppercase initial (from display name or email prefix), display name, email, "Joined Month Year" formatted date
- **Log Out button:** Full-width, red-bordered, calls `supabase.auth.signOut()` + clears auth store + navigates to `/auth/sign-in`
- **Links section:** Grouped card with About Lawh, Terms of Service, Privacy Policy (hairline separators, chevron arrows)
- **Delete Account:** Red text button showing informational alert
- **Null session handled:** Shows "Not signed in" placeholder when session is null

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected auth redirect route**
- **Found during:** Task 2 TypeScript verification
- **Issue:** Plan specified `router.replace('/(auth)')` but the typed routes only expose `/auth/sign-in` and `/auth/sign-up` (no index route for `/auth`)
- **Fix:** Changed destination to `/auth/sign-in` which is the correct typed route
- **Files modified:** lawh-mobile/app/(main)/profile.tsx
- **Commit:** 64da0aa

## Self-Check

### Files exist:

- lawh-mobile/app/(main)/hub.tsx: FOUND
- lawh-mobile/app/(main)/profile.tsx: FOUND
- .planning/quick/6-home-page-with-bottom-tabs-hifz-goals-da/6-SUMMARY.md: FOUND

### Commits exist:

- a5669d2: feat(quick-6): rebuild hub.tsx as tab-based home with top bar
- 64da0aa: feat(quick-6): rebuild profile.tsx as full profile screen

## Self-Check: PASSED
