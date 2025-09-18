# FitTracker Design Document

## Overview

FitTracker is a React Native mobile application that combines accurate GPS-based fitness tracking with an engaging, game-like interface inspired by WarioWare aesthetics. The app features a 3D animated character that responds to user activity, real-time workout tracking, and a split-screen interface showing both map visualization and character animations.

The core design philosophy centers on making fitness tracking feel like play through energetic animations, vibrant colors, and interactive elements while maintaining reliable performance and offline functionality.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Workout       │  │    History      │  │   Settings   │ │
│  │   Screen        │  │    Screen       │  │   Screen     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Workout       │  │   Animation     │  │   Location   │ │
│  │   Manager       │  │   Controller    │  │   Service    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     MMKV        │  │   GPS/Location  │  │   Device     │ │
│  │    Storage      │  │    Services     │  │   Sensors    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: React Native with TypeScript
- **Animation**: React Native Reanimated 3 for 60fps native animations
- **3D Graphics**: React Native Skia for 3D character rendering
- **Maps**: React Native Maps for route visualization
- **Storage**: MMKV for high-performance local data storage
- **Location**: @react-native-community/geolocation with background tracking
- **Lists**: FlashList for efficient workout history rendering
- **State Management**: Zustand for lightweight state management

## Components and Interfaces

### Core Components

#### 1. WorkoutScreen Component
**Purpose**: Main tracking interface with split-screen layout
**Key Features**:
- Real-time GPS tracking display
- 3D character animation area
- Live statistics overlay
- Control buttons (start/pause/stop)

**Design Rationale**: Split-screen maximizes information density while keeping the character prominent for engagement.

#### 2. Character3D Component
**Purpose**: Animated 3D character that responds to workout data
**Key Features**:
- Speed-responsive animations (walking/running/cycling)
- Milestone celebration animations
- Interactive tap responses
- Activity-specific appearance changes

**Design Rationale**: Using Skia for 3D rendering provides smooth 60fps animations while maintaining cross-platform consistency.

#### 3. MapView Component
**Purpose**: Real-time route visualization
**Key Features**:
- Animated polyline drawing
- User location marker
- Route path highlighting
- Zoom controls

#### 4. WorkoutHistoryScreen Component
**Purpose**: Historical workout data display
**Key Features**:
- FlashList for performance with large datasets
- Animated workout cards
- Detailed workout view with slide-in animations
- Delete functionality with confirmation

### Data Models

#### Workout Model
```typescript
interface Workout {
  id: string;
  type: 'walk' | 'run' | 'bike';
  startTime: Date;
  endTime: Date;
  distance: number; // in meters
  duration: number; // in seconds
  averagePace: number; // minutes per km
  route: LocationPoint[];
  calories?: number;
}

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
}
```

#### User Preferences Model
```typescript
interface UserPreferences {
  units: 'metric' | 'imperial';
  defaultActivity: 'walk' | 'run' | 'bike';
  characterTheme: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}
```

### Service Interfaces

#### LocationService
```typescript
interface LocationService {
  startTracking(activityType: ActivityType): Promise<void>;
  stopTracking(): Promise<void>;
  pauseTracking(): void;
  resumeTracking(): void;
  getCurrentLocation(): Promise<LocationPoint>;
  onLocationUpdate(callback: (location: LocationPoint) => void): void;
}
```

#### StorageService
```typescript
interface StorageService {
  saveWorkout(workout: Workout): Promise<void>;
  getWorkouts(): Promise<Workout[]>;
  deleteWorkout(id: string): Promise<void>;
  savePreferences(prefs: UserPreferences): Promise<void>;
  getPreferences(): Promise<UserPreferences>;
}
```

## Data Models

### Storage Architecture

**Primary Storage**: MMKV for all local data
- **Workouts**: Stored as JSON with workout ID as key
- **Preferences**: Single JSON object with user settings
- **Cache**: Temporary data for active workouts

**Data Structure**:
```
mmkv://
├── workouts/
│   ├── workout_[uuid] → Workout JSON
│   └── workout_index → Array of workout IDs
├── preferences → UserPreferences JSON
└── cache/
    └── active_workout → Current workout state
```

### Distance Calculation

**Algorithm**: Haversine formula for GPS point distance calculation
**Accuracy Target**: 5% margin of error
**Implementation**: 
- Filter GPS points with accuracy > 20m
- Apply Kalman filtering for noise reduction
- Debounce updates to prevent battery drain

## Error Handling

### GPS and Location Errors

1. **Permission Denied**
   - Show clear explanation of why location is needed
   - Provide deep link to device settings
   - Offer manual distance entry as fallback

2. **Poor GPS Signal**
   - Display signal strength indicator
   - Pause tracking automatically when accuracy drops
   - Resume when signal improves

3. **Background Tracking Issues**
   - Implement foreground service (Android) / background app refresh (iOS)
   - Show notification during active tracking
   - Handle app termination gracefully

### Storage and Performance Errors

1. **Storage Full**
   - Implement automatic cleanup of old workouts
   - Show storage usage warnings
   - Provide export functionality before cleanup

2. **Animation Performance**
   - Degrade animations gracefully on low-end devices
   - Monitor frame drops and adjust complexity
   - Provide performance mode toggle

### Network and Connectivity

1. **Offline Operation**
   - All core features work without internet
   - Cache map tiles for offline use
   - Queue data exports for when connectivity returns

## Testing Strategy

### Unit Testing
- **Location Services**: Mock GPS data for distance calculation accuracy
- **Storage Operations**: Test MMKV read/write operations
- **Animation Logic**: Test character state transitions
- **Data Models**: Validate workout data integrity

### Integration Testing
- **GPS Tracking Flow**: End-to-end workout recording
- **Background Processing**: App backgrounding during workouts
- **Platform Permissions**: iOS/Android permission handling
- **Performance**: Memory usage and battery consumption

### Performance Testing
- **Animation Frame Rate**: Maintain 60fps during all interactions
- **Battery Usage**: Target <10% drain per hour during tracking
- **Memory Management**: Prevent memory leaks during long workouts
- **Storage Performance**: MMKV read/write benchmarks

### User Experience Testing
- **Accessibility**: Screen reader compatibility
- **Gesture Recognition**: Touch interactions and character tapping
- **Visual Feedback**: Animation timing and visual polish
- **Cross-Platform**: Consistent behavior on iOS/Android

### Testing Tools
- **Jest**: Unit and integration testing
- **Detox**: E2E testing for React Native
- **Flipper**: Performance monitoring and debugging
- **Maestro**: UI automation testing

## Platform-Specific Considerations

### iOS Implementation
- **Background Modes**: Configure for location updates
- **Core Location**: Use CLLocationManager for GPS
- **App Store Guidelines**: Comply with location usage descriptions
- **Battery Optimization**: Implement significant location change monitoring

### Android Implementation
- **Foreground Service**: Required for background GPS tracking
- **Location Permissions**: Handle runtime permission requests
- **Battery Optimization**: Work with Doze mode and app standby
- **Google Play**: Comply with location permission policies

### Cross-Platform Consistency
- **Animation Timing**: Ensure identical feel across platforms
- **UI Components**: Use platform-appropriate design patterns
- **Performance**: Optimize for both iOS and Android hardware ranges
- **Permissions**: Abstract permission handling through unified interface

## Security and Privacy

### Data Privacy
- **Local-Only Storage**: No cloud synchronization by default
- **Anonymous Usage**: No user accounts required
- **Location Data**: Never transmitted outside device
- **Export Control**: User controls all data export

### Security Measures
- **Data Encryption**: MMKV encryption for sensitive data
- **Permission Minimization**: Request only necessary permissions
- **Background Limits**: Respect platform background execution limits
- **Secure Storage**: Use platform keychain for sensitive preferences