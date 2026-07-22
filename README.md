# Focus Buddy - Production Deployment & Developer Guide

Focus Buddy is an AI-powered productivity ecosystem featuring a PWA Web Client, an Android/iOS Expo Native Client, and an Express Backend Server with integrated AI Doubt Solver and Focus Monitor features.

---

## 🚀 Key Commands

From the workspace root directory, you can run the following standard commands:

| Command | Action |
|:---|:---|
| `npm install` | Install dependencies for all components (Web, Native, Backend) |
| `npm run web` | Start the Vite Web application development server (port 3000) |
| `npm run android` | Launch the React Native / Expo development client for Android |
| `npm run build` | Build the production React Web app and export the Mobile bundles |

---

## 🛠️ Components Setup

### 1. Root / Web Application
* **Framework**: React, Vite, TSX, TailwindCSS.
* **Launch**: `npm run web`
* **Production Build**: Built output is compiled into the `/dist` directory.

### 2. Mobile Client (focus-buddy-native)
* **Framework**: React Native, Expo, Expo Router, TypeScript.
* **Launch**: `npm run android`
* **Build Configuration**: Configured in [app.json](file:///c:/Users/Ashraf/Downloads/focus-buddy%20new/focus-buddy-native/app.json) and [eas.json](file:///c:/Users/Ashraf/Downloads/focus-buddy%20new/focus-buddy-native/eas.json).
* **Bundle Export**: `npm run build` triggers `expo export` to bundle static assets.

### 3. Backend API Server (server)
* **Framework**: Node.js, Express, tsx.
* **Launch**: `npm run dev:server`
* **Simultaneous Web + Server Startup**: `npm run dev:full`

---

## 📝 Environment Configuration

Copy `.env.example` to `.env` in the root and configure:
```env
# Backend API Port & Supabase Secrets
PORT=4000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment & Push Notification keys
RAZORPAY_KEY_ID=your_razorpay_key
VITE_VAPID_PUBLIC_KEY=your_push_vapid_key
EXPO_PUBLIC_VAPID_PUBLIC_KEY=your_push_vapid_key
```

---

## 📱 Release & Build Operations for Android

### Method A: Cloud Build using EAS (Recommended)
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to Expo:
   ```bash
   eas login
   ```
3. Run preview build (creates Android APK):
   ```bash
   cd focus-buddy-native
   eas build --platform android --profile preview
   ```
4. Run production build (creates Android AAB for Google Play):
   ```bash
   cd focus-buddy-native
   eas build --platform android --profile production
   ```

### Method B: Local Build
1. Prebuild the native Android project:
   ```bash
   cd focus-buddy-native
   npx expo prebuild
   ```
2. Build Android App using Gradle:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   *The built APK will be located under `focus-buddy-native/android/app/build/outputs/apk/debug/app-debug.apk`.*

---

## 🔒 Production Checklist
- [x] Unify all entry commands inside root `package.json`.
- [x] Configure production profile in `eas.json` with optimized build options.
- [x] Transform and patch all `node_modules` ES6 classes to ensure full compatibility with JSC and Hermes engines.
- [x] Validate TypeScript compilation with `npx tsc --noEmit`.
- [x] Update `index.html` with production-ready SEO headers, OpenGraph tags, and theme viewport styles.
