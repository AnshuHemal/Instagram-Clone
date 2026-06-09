# Instagram Clone Mobile Application

A high-fidelity, high-performance Instagram Clone mobile client built with **React Native (Expo SDK 51+)** and **TypeScript**. Features a zero-delay Reels player, direct messaging, interactive animations, and a dynamic theme system.

---

## Architecture Overview

```
src/
├── app/                  # File-based routing (Expo Router)
│   ├── (auth)/           # Authentication Flow (Login, Register Complete, OTP)
│   ├── (chat)/           # Direct Messaging details screen
│   ├── (tabs)/           # Main App tabs (Home, Search, Create, Reels, Profile)
│   └── _layout.tsx       # Core navigation entry point
├── components/           # Reusable UI widgets
│   ├── ReelItem.tsx      # Video Player container with seekbar
│   ├── ReelShimmer.tsx   # Video Skeleton loader
│   ├── PostCard.tsx      # Home Feed detailed post card
│   └── ...
├── contexts/             # Global state providers
│   ├── AuthContext.tsx   # Login/Register state, token storage
│   ├── ReelsContext.tsx  # Video player caching pools & feed state
│   └── ThemeContext.tsx  # Dynamic Dark & Light mode
├── services/             # API layer
│   └── api.ts            # Axios configuration with JWT headers
└── constants/            # Styling, Colors, & Mock data
```

---

## Key Features

### 1. Zero-Delay Reels Player (Instagram Fidelity)
- **Video Caching Pool**: Pre-warms and preloads the current ($N$), previous ($N-1$), and next ($N+1$) videos using `expo-video`. Automatically releases and pauses players outside this window to prevent decoder starvation.
- **Zero-Flash Shimmer Loader**: Features custom skeleton shimmers ([ReelShimmer.tsx](file:///c:/Users/MobileDev-05/Desktop/Projects/Instagram%20Clone/insta-frontend/src/components/ReelShimmer.tsx)) that utilize synchronous state guards to instantly bypass loading states if the video is already cached in memory.
- **Interactive Seekbar**: Micro-animated progress bar that scales up in height and pops a scrub handle on touch, supporting dragging to seek.
- **HUD Controls**: Double-tap to like with springing center heart animation, hold-to-pause gestures, and custom mute status indicator overlays.
- **System Media Lock**: Explicitly disables `showNowPlayingNotification` so playback doesn't clutter the system notification drawer with "Unknown Song" cards.

### 2. Home Feed & Stories
- **Dynamic Headers**: Auto-hiding header layouts with shortcuts to messaging and alerts.
- **Story Circles**: Visual story rings displaying user avatars on the home feed.
- **Detailed Posts**: Support for rich content displays, like/unlike animations, expand/collapse caption text blocks, and comment overlays.

### 3. Full Authentication Flow
- **Email Registration**: Implements multi-step signup (Email Input $\rightarrow$ OTP Code Verification $\rightarrow$ Password Definition $\rightarrow$ Username Selection $\rightarrow$ Birthday Entry $\rightarrow$ Terms Acceptance).
- **Secure Token Caching**: Local secure storage of JWT keys for automatic session recovery.

### 4. Direct Messaging (Chat)
- **Chats List Tab**: Real-time listing of active direct message conversations.
- **Detail View**: Interactive, responsive message thread window with chat bubbles.

### 5. Dynamic Themes
- Supports dynamic Switching between a clean **Light Mode** and a premium **Dark Mode** utilizing a unified color token palette.

---

## Technical Stack

- **Framework**: Expo (SDK 51+)
- **Language**: TypeScript
- **Routing**: Expo Router (File-based navigation)
- **Video Player**: `expo-video` (Core engine)
- **HTTP Client**: Axios with automatic interceptors for JWT token attachment
- **Icons**: Vector Icons (Ionicons, Feather)
- **Layouts**: React Native Safe Area Context

---

## Quick Start

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```
*(Replace `localhost` with your local machine's IP address if testing on a physical iOS or Android device).*

### 3. Start Metro Bundler
```bash
# Clear caches and start Expo dev server
npx expo start --clear
```

In the terminal output, press:
- `a` to run on an Android Emulator.
- `i` to run on an iOS Simulator.
- Scan the QR code with the **Expo Go** app to run on a physical device.

---

## Reels Optimization Details

### Stable Scrolling Position
We bypass `onLayout` measurements in the FlatList by providing a stable height derived directly from `useWindowDimensions()`. When navigating between tabs, this keeps item offset calculations constant, preventing visual shifts and maintaining the current scrolling focus.

### Memoized Renders
Every card in the feed uses a strict prop comparison memoization wrapper (`React.memo`). Instead of passing down the active string ID (which causes all cards to re-render on scroll), we pass down an `isActive` boolean. This confines updates strictly to the card being focused and the card being unfocused, leaving other items untouched and eliminating VirtualizedList lag warnings.
