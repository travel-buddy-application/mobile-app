# 🧳 Travel Buddy - Safety Travel App

A lightweight Android-first safety app that provides protected trips, location sharing, risk detection, and emergency SOS capabilities with privacy in mind.

Built with React Native, TypeScript, and Expo.

## ✨ Features

- **🛡️ Safe Travel**: Start protected trips with safety monitoring
- **📍 Location Sharing**: Real-time location sharing with emergency contacts
- **⚠️ Risk Detection**: Smart monitoring for inactivity
- **🆘 Emergency SOS**: Instant alert system with push notifications
- **🔒 Privacy First**: Encrypted storage, data stays on device
- **📱 Clean UI**: Modern, intuitive interface focused on safety

## 🚀 Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npx expo start
   ```

3. **Open on your device**
   - Scan QR code with Expo Go app
   - Or press `a` for Android emulator

## 🏗️ Build

Build the Android release locally or via EAS (Expo Application Services).

Local Android (Gradle)

- From Windows PowerShell (project root):

```bash
cd android
.\gradlew.bat assembleRelease
```

- From macOS/Linux (project root):

```bash
cd android
./gradlew assembleRelease
```

- The generated APK will be at:

```text
android/app/build/outputs/apk/release/app-release.apk
```

- Notes:
   - Ensure signing config / keystore is set in `android/app/build.gradle` or provided via Gradle properties.
   - If you need an AAB instead, run `assembleRelease` for the `bundle` task (e.g., `./gradlew bundleRelease`).

Build with EAS

- Install and login to EAS CLI if you haven't:

```bash
npm install -g eas-cli
eas login
```

- Create or confirm `eas.json` configuration, then build:

```bash
eas build --platform android
# or use a named profile (example: production)
eas build --platform android --profile production
```

- For iOS builds use `eas build --platform ios` (Apple developer credentials required).

See Expo/EAS docs for configuring credentials, signing, and build profiles.



## 📖 User Guide

See the step-by-step user instructions in the [User Guide](USER_GUIDE.md).



