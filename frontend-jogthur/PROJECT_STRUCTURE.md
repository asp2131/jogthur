# FitTracker Project Structure

## Overview
This React Native Expo app is built with TypeScript and follows a modular architecture for scalability and maintainability.

## Directory Structure

```
frontend-jogthur/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab-based navigation
│   ├── _layout.tsx        # Root layout
│   └── ...
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   ├── services/          # API and external service integrations
│   ├── models/            # TypeScript interfaces and types
│   ├── utils/             # Utility functions and helpers
│   ├── stores/            # Zustand state management
│   ├── hooks/             # Custom React hooks
│   └── config/            # App configuration and constants
├── assets/                # Static assets (images, fonts, etc.)
├── constants/             # App constants
└── components/            # Legacy components (to be moved to src/)
```

## Core Dependencies

### State Management
- **Zustand**: Lightweight state management with persistence via MMKV

### Storage
- **MMKV**: Fast, secure key-value storage for React Native

### Location & Maps
- **@react-native-community/geolocation**: GPS location tracking
- **react-native-maps**: Map integration with Google Maps

### UI & Performance
- **@shopify/react-native-skia**: High-performance graphics and animations
- **@shopify/flash-list**: Optimized list component for large datasets
- **react-native-reanimated**: Smooth animations and gestures

## TypeScript Path Aliases

The following path aliases are configured for cleaner imports:

- `@/components/*` → `./src/components/*`
- `@/services/*` → `./src/services/*`
- `@/models/*` → `./src/models/*`
- `@/utils/*` → `./src/utils/*`
- `@/stores/*` → `./src/stores/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/config/*` → `./src/config/*`

## Platform Configuration

### iOS
- Location permissions configured in Info.plist
- Camera and photo library permissions included
- Tablet support enabled

### Android
- Location, camera, and storage permissions configured
- Edge-to-edge display enabled
- Adaptive icon configured

## Getting Started

1. Install dependencies: `npm install`
2. Start the development server: `npm start`
3. Run on iOS: `npm run ios`
4. Run on Android: `npm run android`

## Environment Variables

Create a `.env` file with the following variables:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```