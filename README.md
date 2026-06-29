<h1 align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/132px-Instagram_logo_2016.svg.png" width="40" />
  Instagram Clone — Mobile App
</h1>

<p align="center">
  A pixel-perfect, feature-complete Instagram clone for Android & iOS.<br/>
  Built with <strong>Expo (React Native)</strong> · <strong>Expo Router</strong> · <strong>Reanimated 4</strong> · <strong>Socket.IO</strong>
</p>

<p align="center">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-56-000020?style=for-the-badge&logo=expo" />
  <img alt="React Native" src="https://img.shields.io/badge/React_Native-0.85-61DAFB?style=for-the-badge&logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript" />
  <img alt="Reanimated" src="https://img.shields.io/badge/Reanimated-4-FF6B6B?style=for-the-badge" />
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green?style=for-the-badge" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Screens & Features](#-screens--features)
- [Navigation Architecture](#-navigation-architecture)
- [Component Library](#-component-library)
- [State Management](#-state-management)
- [Services & API](#-services--api)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)

---

## 🌟 Overview

A **production-quality Instagram clone** mobile application built for Android and iOS. The app faithfully replicates Instagram's core experience with all major features: Stories, Reels, Feed, Explore, Chat, Notifications, and a full profile system.

### Highlights

- 🎨 **Pixel-perfect Instagram UI** — dark mode, gradients, glassmorphism effects
- 🔄 **Swipe-to-navigate tabs** — fluid horizontal pager with Reanimated spring animations
- 📲 **Multi-step onboarding** — OTP email verification, birthday, permissions, follow suggestions
- 🎬 **Full Reels experience** — HLS streaming, swipe-up feed, like/comment/share
- 📖 **Stories with progress bar** — auto-advance, view tracking, highlight creation, post/reel sticker sharing
- 💾 **Advanced Offline Caching** — instant cold start hydration of feeds via `expo-secure-store`
- ⚡ **Optimistic Actions with Rollback** — micro-interaction likes/bookmarks/comments with rollback retry banners
- 💬 **Real-time chat** — Socket.IO DMs with typing indicators, read receipts, media sharing
- 🔔 **Push notifications** — Expo Push Notifications with in-app banner overlay
- 🌐 **Explore & Search** — users, posts, hashtags with tabbed results
- 👤 **Rich profile** — grid/reels/highlights view, follow requests, private accounts
- ♻️ **Gradient pull-to-refresh** — consistent across all main tabs
- ⚡ **Haptic feedback** — tactile micro-interactions on every button

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Expo 56 (React Native 0.85) |
| **Language** | TypeScript 6 |
| **Navigation** | Expo Router 56 (file-based) |
| **Animations** | React Native Reanimated 4 |
| **Gestures** | React Native Gesture Handler |
| **HTTP Client** | Axios (with JWT auto-refresh interceptors) |
| **WebSocket** | Socket.IO Client 4 |
| **Media** | expo-image, expo-video (HLS), expo-image-picker |
| **Storage** | expo-secure-store (JWT tokens + Offline Feed Caches) |
| **Composition** | react-native-view-shot |
| **Notifications** | expo-notifications |
| **Typography** | Outfit (Google Fonts via @expo-google-fonts) |
| **Icons** | @expo/vector-icons (Ionicons) |
| **Haptics** | expo-haptics |
| **Blur** | expo-blur |
| **Linear Gradient** | expo-linear-gradient |
| **SVG** | react-native-svg |
| **Contacts** | expo-contacts |

---

## 📱 Screens & Features

### 🔑 Authentication Flow

A multi-step onboarding experience:

| Screen | File | Description |
|---|---|---|
| Login | `(auth)/login.tsx` | Email/phone + password login |
| Sign Up | `(auth)/signup.tsx` | Name, email/phone input |
| OTP Verification | `(auth)/otp.tsx` | 6-digit OTP with countdown timer and resend |
| Birthday | `(auth)/birthday.tsx` | Age-gated birthday picker |
| Password | `(auth)/password.tsx` | Password creation with strength indicator |
| Username | `(auth)/username.tsx` | Real-time availability check with suggestions |
| Profile Picture | `(auth)/profile-picture.tsx` | Avatar upload (camera or library) |
| Permissions | `(auth)/permissions.tsx` | Notifications and contacts permissions |
| Notification Prefs | `(auth)/notification-preferences.tsx` | Granular push notification settings |
| Hashtag Interests | `(auth)/hashtag.tsx` | Interest selection for feed personalization |
| Follow Suggestions | `(auth)/follow-suggestions.tsx` | Suggested accounts to follow |
| Terms | `(auth)/terms.tsx` | Terms of service acceptance |
| Add Contact | `(auth)/add-contact.tsx` | Find friends from phone contacts |

### 🏠 Home Tab (`index.tsx`)

- **Stories Row** — Horizontal scrollable story circles with gradient ring for unviewed stories
- **Your Story** button — opens camera to create a new story
- **Post Feed** — Infinite scroll feed with cursor-based pagination
- **Suggested Accounts Carousel** — Dynamically interleaved card after post #2 with spring animations and follow/unfollow toggle actions
- **Trending Reels Carousel** — Interleaved after post #6 showing top 10 trending reels with portrait thumbnails and views count badges
- **Offline Cache Hydration** — Home feed hydrates instantly from disk cache (`expo-secure-store`) on cold launch
- **Optimistic Actions & Rollbacks** — Likes and comments update immediately in the UI and automatically roll back with an animated retry banner on network failure
- **Post Cards** — Like, comment, save, share actions with animated counters
- **Gradient Pull-to-Refresh** — Instagram-style gradient indicator
- **Notification bell** — tappable with TouchableOpacity haptic feedback
- **Create (+) button** — opens post creation bottom sheet

### 🎬 Reels Tab (`reels.tsx`)

- **Full-screen vertical swipe feed** — snap-to-item with `FlatList` paging
- **HLS video streaming** — adaptive quality via `expo-video`
- **Auto-play / pause** — plays when in view, pauses on tab switch
- **Like / Comment / Share** — animated interaction buttons
- **View tracking** — records view duration and completion
- **Caption + hashtag display** — expandable text overlay
- **Audio name display** — with music note icon

### 💬 Chat Tab (`chat.tsx`)

- **Conversation inbox** — sorted by last message time
- **Unread badge count** — persisted in `BadgeContext`
- **Online presence indicators** — green dot for online users
- **New message button** — opens user search bottom sheet
- **Real-time inbox updates** — `inboxUpdated` socket events

#### Chat Conversation (`(chat)/[id].tsx`)

- **Real-time messaging** — Socket.IO `sendMessage` / `messageReceived`
- **Message bubbles** — sender vs receiver with timestamps
- **Typing indicators** — animated `...` bubble when partner types
- **Read receipts** — blue checkmarks with `markAsRead` events
- **Media messages** — image sharing in conversations
- **Post/Reel/Story sharing** — embedded reference cards in messages
- **Online/offline status** — shown in header
- **Gradient Pull-to-Refresh** for loading older messages
- **Image picker** — attach photos directly in chat

### 🔍 Explore Tab (`explore.tsx`)

- **Search bar** — debounced 500ms search across users, posts, hashtags
- **Tabbed results** — People / Posts / Tags tabs
- **User results** — avatar, username, display name + follow button
- **Post results** — thumbnail grid with like/comment counts
- **Hashtag results** — tag name + post count
- **Search history** — persisted recent searches
- **Discovery grid** — posts and reels grid when not searching
- **Haptic feedback** on search focus

### 👤 Profile Tab (`profile.tsx`)

- **Profile header** — avatar, stats (posts, followers, following), bio, links
- **Edit Profile** — full edit modal with display name, bio, gender, pronouns, links
- **Follow / Following / Follow Request states** — smart `FollowButton` component
- **Private account** — locked view for non-followers
- **Posts grid** — 3-column photo/video grid
- **Reels grid** — user's uploaded reels
- **Story Highlights row** — horizontally scrollable highlight circles
- **Story Highlights viewer** — full highlight story playback
- **Follow requests panel** — accept/decline incoming requests (private accounts)
- **Account Switcher** — long-press profile avatar to switch accounts
- **Share Profile** — QR code + link share modal
- **Settings navigation** — gear icon access
- **Gradient Pull-to-Refresh**

### 🔔 Notifications Screen (`notifications.tsx`)

- **Grouped notifications** — Follow, Like, Comment, Follow Request types
- **Real-time delivery** — `notificationReceived` WebSocket events
- **In-app banner** — toast-style notification banners slide in from the top
- **Mark all as read** — batch mark action
- **Notification badges** — unread count in tab bar
- **Gradient Pull-to-Refresh**

### 📝 Create Post (`create.tsx`)

- **Media picker** — camera or library selection
- **Multi-image carousel** — select multiple photos for a post
- **Caption input** — with hashtag auto-detection
- **Location tagging**
- **Direct-to-Cloudinary upload** — signed upload, never through the backend
- **Progress indicator** during upload

### 🖊️ Edit Post (`edit-post/[id].tsx`)

- Edit caption and location for existing posts

### 🔍 Post Detail (`post/[id].tsx`)

- Full post view with all comments
- Nested comment replies
- Comment likes
- Share options

### #️⃣ Hashtag Feed (`hashtag/[tag].tsx`)

- Posts tagged with a specific hashtag
- Post count display
- Grid layout with infinite scroll

### ✏️ Edit Profile (`edit-profile.tsx`)

Full profile editing:
- Display name
- Username (with availability check)
- Bio
- Gender (with select modal)
- Pronouns (with dedicated modal, privacy control)
- Personal details (birthday, phone, email)
- External links (up to 5 custom links)
- Avatar update

### ⚙️ Settings (`settings.tsx`)

- Account settings
- Privacy controls (private account toggle)
- Notification preferences
- Logout

### 👥 Connections (`connections.tsx`)

- Followers / Following lists
- Mutual friends indicator
- Follow/unfollow from list

---

## 🗺 Navigation Architecture

Uses **Expo Router 56** (file-based routing) with a custom horizontal pager for the main tabs.

```
app/
├── index.tsx              → Root redirect
├── _layout.tsx            → Root layout (auth gate, fonts, providers)
├── (auth)/                → Authentication stack
│   ├── login.tsx
│   ├── signup.tsx
│   ├── otp.tsx
│   ├── birthday.tsx
│   ├── password.tsx
│   ├── username.tsx
│   ├── profile-picture.tsx
│   ├── permissions.tsx
│   ├── notification-preferences.tsx
│   ├── hashtag.tsx
│   ├── follow-suggestions.tsx
│   ├── terms.tsx
│   └── add-contact.tsx
├── (tabs)/                → Main tab navigation (horizontal pager)
│   ├── _layout.tsx        → Custom swipeable tab bar + pager
│   ├── index.tsx          → Home feed
│   ├── reels.tsx          → Reels feed
│   ├── chat.tsx           → Chat inbox
│   ├── explore.tsx        → Search + discovery
│   └── profile.tsx        → User profile
├── (chat)/
│   └── [id].tsx           → Individual conversation
├── post/
│   └── [id].tsx           → Post detail view
├── edit-post/
│   └── [id].tsx           → Edit post
├── hashtag/
│   └── [tag].tsx          → Hashtag feed
├── create.tsx             → Create new post
├── edit-profile.tsx       → Edit profile screen
├── notifications.tsx      → Notifications screen
├── connections.tsx        → Followers/Following
└── settings.tsx           → App settings
```

### Tab Navigation — Custom Horizontal Pager

The 5 main tabs (Home, Reels, Chat, Explore, Profile) are implemented as a **swipeable horizontal pager** using `Animated.ScrollView` with `pagingEnabled`:

- **Spring micro-animation** on tab button presses
- **Lazy rendering** — screens mount only when visited
- **Reels audio auto-pause** when swiping away from Reels tab
- **Spring tab indicator** that slides between tab icons
- **Back handler** — pressing back while on a non-home tab returns to Home

---

## 🧩 Component Library

All reusable UI components live in `src/components/`:

| Component | Description |
|---|---|
| `PostCard` | Full post card with media carousel, like/comment/save/share |
| `ReelItem` | Full-screen reel card with video player and controls |
| `StoryCircle` | Story avatar ring with gradient for unviewed stories + haptics |
| `StoryPlayerModal` | Full-screen story player with animated progress bar |
| `CommentsSheet` | Bottom sheet for comments with nested replies |
| `FeedHeader` | Home screen header (Instagram logo, create, notifications) with haptics |
| `GradientPullRefresh` | Instagram gradient pull-to-refresh wrapper component |
| `FollowButton` | Smart follow/unfollow/request button with state management |
| `NotificationBanner` | Slide-in toast notification overlay |
| `NotificationItem` | Individual notification row |
| `AccountSwitcherSheet` | Account switching bottom sheet |
| `CreateBottomSheet` | Post/Story/Reel creation options sheet |
| `AddPhotoBottomSheet` | Photo picker (camera or library) |
| `LibrarySelectModal` | Full media library picker with multi-select |
| `AvatarBottomSheet` | Avatar update options |
| `ShareSheetModal` | Post/reel share options |
| `ShareProfileModal` | Profile share + QR code |
| `PostOptionsSheet` | Post action sheet (edit, delete, share, report) |
| `PersonalDetailsBottomSheet` | Full personal info editor |
| `ProfileFieldModal` | Single field editor modal |
| `UsernameEditModal` | Username change with availability check |
| `GenderSelectModal` | Gender selection modal |
| `PronounsModal` | Pronouns picker with privacy toggle |
| `LinksModal` | Bio links manager (up to 5) |
| `BannersModal` | Notifications banners manager |
| `HighlightsRow` | Horizontal story highlights scroller |
| `DiscardChangesModal` | Unsaved changes confirmation |
| `InstagramInput` | Styled input field matching Instagram's design |
| `Skeleton` | Shimmer loading skeleton for content |
| `ReelShimmer` | Shimmer loading placeholder for reels |
| `SplashScreen` | Custom animated splash screen |
| `LoadingOverlay` | Full-screen loading indicator |
| `ErrorState` | Empty / error state display |
| `ErrorBoundary` | React error boundary component |
| `TappableText` | Pressable text with highlight support |
| `ThemedText` | Text component with theme-aware color |

---

## 🧠 State Management

State is managed via **React Context** (no Redux). Contexts are composed at the root layout level:

| Context | File | Purpose |
|---|---|---|
| `AuthContext` | `AuthContext.tsx` | User session, JWT tokens, login/logout, onboarding step |
| `ThemeContext` | `ThemeContext.tsx` | Dark/light theme, color tokens |
| `SocketContext` | `SocketContext.tsx` | Socket.IO connection, event listeners |
| `PostsContext` | `PostsContext.tsx` | Home feed posts, pagination, optimistic updates |
| `ReelsContext` | `ReelsContext.tsx` | Reels feed, active reel tracking, pagination |
| `StoriesContext` | `StoriesContext.tsx` | Active stories grouped by user |
| `SavedContext` | `SavedContext.tsx` | Saved/bookmarked post IDs |
| `BadgeContext` | `BadgeContext.tsx` | Unread notification + chat badge counts |
| `NotificationBannerContext` | `NotificationBannerContext.tsx` | In-app banner queue |
| `ToastContext` | `ToastContext.tsx` | Toast message queue |
| `NetworkContext` | `NetworkContext.tsx` | Network connectivity status |
| `LoadingContext` | `LoadingContext.tsx` | Global loading overlay |
| `TabPagerContext` | `TabPagerContext.tsx` | Swipeable tab pager state |

---

## 🔌 Services & API

### API Service (`services/api.ts`)

Axios instance with automatic JWT management:

- **Base URL** — configurable via `EXPO_PUBLIC_API_URL` env var
- **Request interceptor** — attaches `Authorization: Bearer <token>` header
- **Preemptive token refresh** — refreshes JWT 60 seconds before expiry
- **401 auto-refresh** — on 401 response, automatically refreshes token and retries
- **Refresh queue** — concurrent 401 errors are queued; only one refresh happens at a time
- **Unauthorized handler** — triggers logout via registered callback to avoid circular imports
- **Token storage** — `expo-secure-store` for encrypted local storage

### Follow Service (`services/follow.ts`)

Helper functions for follow/unfollow/request with optimistic state updates.

### Notifications Service (`services/notifications.ts`)

Expo push token registration and permission request helpers.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)
- A running instance of the [Instagram Clone Backend](../insta-backend/README.md)

### Installation

```bash
# Navigate to the frontend directory
cd instagram-clone/insta-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend URL

# Start the Expo dev server
npx expo start
```

### Running on Device/Emulator

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios

# Web (limited support)
npx expo start --web
```

### Development Tips

- Press `a` in the terminal to open Android emulator
- Press `i` to open iOS simulator
- Shake device to open Expo dev menu
- Press `r` to reload

---

## 🌍 Environment Variables

Create a `.env` file in the `insta-frontend` root:

```env
# Backend API base URL
EXPO_PUBLIC_API_URL=https://instagram-clone-backend-web.vercel.app/api

# For local development (use your machine's local IP)
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```

> **Note:** For local development, use your machine's LAN IP address (not `localhost`) so the physical device or emulator can reach the backend.

---

## 📁 Project Structure

```
insta-frontend/
├── src/
│   ├── app/                    # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx         # Root layout: fonts, auth gate, providers
│   │   ├── index.tsx           # Root redirect
│   │   ├── (auth)/             # Onboarding & auth screens (13 screens)
│   │   ├── (tabs)/             # Main tab screens + swipeable pager layout
│   │   │   ├── _layout.tsx     # Custom tab bar + horizontal pager
│   │   │   ├── index.tsx       # Home feed
│   │   │   ├── reels.tsx       # Reels
│   │   │   ├── chat.tsx        # Chat inbox
│   │   │   ├── explore.tsx     # Search & discover
│   │   │   └── profile.tsx     # User profile
│   │   ├── (chat)/[id].tsx     # Chat conversation
│   │   ├── post/[id].tsx       # Post detail
│   │   ├── edit-post/[id].tsx  # Edit post
│   │   ├── hashtag/[tag].tsx   # Hashtag feed
│   │   ├── create.tsx          # Create post
│   │   ├── edit-profile.tsx    # Edit profile
│   │   ├── notifications.tsx   # Notifications
│   │   ├── connections.tsx     # Followers/Following
│   │   └── settings.tsx        # App settings
│   ├── components/             # 48 reusable UI components
│   ├── contexts/               # 13 React Context providers
│   ├── services/               # API client, follow, notifications
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Haptics, formatters, helpers
│   ├── types/                  # TypeScript type definitions
│   ├── constants/              # Colors, theme tokens, config
│   └── global.css              # Global styles
├── assets/                     # Fonts, images, icons
├── app.json                    # Expo app config
└── package.json
```

---

## 🎨 Design System

- **Typography** — Outfit font family (Thin, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black)
- **Dark Mode** — Default dark theme matching Instagram's aesthetic
- **Gradients** — Instagram's signature purple-to-orange story ring gradients
- **Glassmorphism** — Frosted blur effects on overlays and modals
- **Animations** — Reanimated 4 spring physics for all interactions
- **Haptics** — 3 haptic levels: light (selections), medium (actions), heavy (confirmations)

---

## 🔧 Key Engineering Details

### JWT Auto-Refresh
The Axios interceptor handles token refresh transparently:
1. Before every request, checks if the token expires within 60 seconds
2. If so, proactively refreshes before sending the request
3. On 401 responses, attempts refresh and queues all concurrent requests
4. If refresh fails, clears tokens and triggers the logout callback

### Swipeable Tab Pager
The main 5-tab layout uses a custom `Animated.ScrollView` pager:
- `pagingEnabled` for snapping to each tab
- `scrollEventThrottle={16}` for 60fps tracking
- Spring animation drives the tab bar indicator position
- Programmatic scrollTo for tab button taps
- Reels context receives tab change events to pause playback

### Pull-to-Refresh
The `GradientPullRefresh` component wraps scrollable content and provides:
- Instagram-style gradient spinner
- Reanimated shared value for scroll position tracking
- Compatible with `FlatList` and `ScrollView`

### Story Player
`StoryPlayerModal` implements:
- Animated progress bars per story in the group
- Auto-advance with configurable duration
- Tap left/right to navigate stories
- Long-press to pause
- Reset on re-open (fixed: was getting stuck on re-view)

---

<p align="center">Made with ❤️ — Instagram Clone Mobile App</p>
