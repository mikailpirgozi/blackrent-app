# 📱 BlackRent Mobile App

Production-ready React Native mobile app pre prenájom vozidiel.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start Expo dev server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Update API URL ak používaš iný backend
3. Pre Stripe platby pridaj `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## 📦 Build & Deploy

### EAS Build Setup

```bash
# Login to Expo
npx eas login

# Configure build
npx eas build:configure

# Development build (internal testing)
npx eas build --profile development --platform ios
npx eas build --profile development --platform android

# Preview build (TestFlight/Internal Testing)
npx eas build --profile preview --platform all

# Production build (App Store/Google Play)
npx eas build --profile production --platform all
```

### Submit to Stores

```bash
# iOS (TestFlight)
npx eas submit --platform ios --latest

# Android (Google Play Internal Testing)
npx eas submit --platform android --latest
```

## 🎨 Features

### ✅ Implemented (95%)

- **Authentication**: Register, Login, OAuth (Google/Apple)
- **Vehicle Catalog**: Infinite scroll, search, filters
- **Booking System**: Date picker, insurance selector, pricing
- **Multi-language**: SK, CZ, DE, EN, PL, HU
- **Theme System**: Light/Dark/Auto
- **Image Service**: Picsum fallbacks (no API key needed)

### ⏳ TODO (5%)

- **Stripe Integration**: Add publishable key when ready
- **Push Notifications**: Enable when backend ready
- **Protocol Screens**: Handover/Return with camera & signature

## 🔧 Configuration Files

- **app.json**: Expo app config (bundle IDs, permissions)
- **eas.json**: Build profiles (dev, preview, production)
- **.env**: Environment variables (gitignored)
- **.env.example**: Template for environment setup

## 📱 App Store Info

- **iOS Bundle ID**: `sk.blackrent.mobile`
- **Android Package**: `sk.blackrent.mobile`
- **Version**: 1.0.0

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires build)
pnpm test:e2e
```

## 📚 Tech Stack

- **React Native**: 0.81.4
- **Expo**: ~54.0.13
- **React Query**: ^5.90.3
- **Axios**: ^1.12.2
- **Stripe**: 0.50.3 (disabled in dev)
- **i18next**: Multi-language support

## 🔐 Environment Variables

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://blackrent-app-production-4d6f.up.railway.app

# Feature Flags (enable when ready)
EXPO_PUBLIC_ENABLE_PAYMENTS=false
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
EXPO_PUBLIC_ENABLE_ANALYTICS=false

# Image Service
EXPO_PUBLIC_IMAGE_SERVICE=picsum
EXPO_PUBLIC_ENABLE_IMAGE_FALLBACK=true
```

## 📖 Documentation

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

## 🤝 Support

Pre otázky kontaktujte: admin@blackrent.sk
