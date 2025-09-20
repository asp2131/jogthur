# FitTracker Flutter Design Document

## Overview

FitTracker is a Flutter mobile application that combines accurate GPS-based fitness tracking with an engaging, game-like interface inspired by WarioWare aesthetics. The app features a 3D animated character that responds to user activity, real-time workout tracking, and a split-screen interface showing both map visualization and character animations.

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
│  │   Bloc/Cubit    │  │   Controller    │  │   Service    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     Hive        │  │   GPS/Location  │  │   Device     │ │
│  │   Database      │  │    Services     │  │   Sensors    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Flutter with Dart
- **State Management**: Bloc/Cubit for robust state management
- **Animation**: Flutter's built-in Animation API with CustomAnimationController
- **3D Graphics**: Flutter's Canvas and CustomPainter for 3D character rendering
- **Maps**: Google Maps Flutter plugin for route visualization
- **Storage**: Hive for high-performance local NoSQL database
- **Location**: Geolocator package with background tracking
- **Lists**: ListView.builder with performance optimizations
- **Dependency Injection**: Get_it for service locator pattern

## Components and Interfaces

### Core Components

#### 1. WorkoutScreen Widget
**Purpose**: Main tracking interface with split-screen layout
**Key Features**:
- Real-time GPS tracking display
- 3D character animation area
- Live statistics overlay
- Control buttons (start/pause/stop)

**Design Rationale**: Split-screen maximizes information density while keeping the character prominent for engagement.

#### 2. Character3DWidget
**Purpose**: Animated 3D character that responds to workout data
**Key Features**:
- Speed-responsive animations (walking/running/cycling)
- Milestone celebration animations
- Interactive tap responses
- Activity-specific appearance changes

**Design Rationale**: Using CustomPainter for 3D rendering provides smooth 60fps animations while maintaining cross-platform consistency.

#### 3. GoogleMapWidget
**Purpose**: Real-time route visualization
**Key Features**:
- Animated polyline drawing
- User location marker
- Route path highlighting
- Zoom controls

#### 4. WorkoutHistoryScreen Widget
**Purpose**: Historical workout data display
**Key Features**:
- Optimized ListView for performance with large datasets
- Animated workout cards
- Detailed workout view with page transitions
- Delete functionality with confirmation

### Data Models

#### Workout Model
```dart
@HiveType(typeId: 0)
class Workout extends HiveObject {
  @HiveField(0)
  String id;
  
  @HiveField(1)
  ActivityType type;
  
  @HiveField(2)
  DateTime startTime;
  
  @HiveField(3)
  DateTime? endTime;
  
  @HiveField(4)
  double distance; // in meters
  
  @HiveField(5)
  int duration; // in seconds
  
  @HiveField(6)
  double averagePace; // minutes per km
  
  @HiveField(7)
  List<LocationPoint> route;
  
  @HiveField(8)
  double? calories;
}

@HiveType(typeId: 1)
class LocationPoint {
  @HiveField(0)
  double latitude;
  
  @HiveField(1)
  double longitude;
  
  @HiveField(2)
  DateTime timestamp;
  
  @HiveField(3)
  double accuracy;
}

@HiveType(typeId: 2)
enum ActivityType {
  @HiveField(0)
  walk,
  
  @HiveField(1)
  run,
  
  @HiveField(2)
  bike,
}
```

#### User Preferences Model
```dart
@HiveType(typeId: 3)
class UserPreferences {
  @HiveField(0)
  Units units;
  
  @HiveField(1)
  ActivityType defaultActivity;
  
  @HiveField(2)
  String characterTheme;
  
  @HiveField(3)
  bool soundEnabled;
  
  @HiveField(4)
  bool hapticEnabled;
}
```

### Service Interfaces

#### LocationService
```dart
abstract class LocationService {
  Future<void> startTracking(ActivityType activityType);
  Future<void> stopTracking();
  void pauseTracking();
  void resumeTracking();
  Future<LocationPoint> getCurrentLocation();
  Stream<LocationPoint> get locationStream;
}
```

#### StorageService
```dart
abstract class StorageService {
  Future<void> saveWorkout(Workout workout);
  Future<List<Workout>> getWorkouts();
  Future<void> deleteWorkout(String id);
  Future<void> savePreferences(UserPreferences prefs);
  Future<UserPreferences> getPreferences();
}
```

## Data Models

### Storage Architecture

**Primary Storage**: Hive for all local data
- **Workouts**: Stored as Hive objects with automatic indexing
- **Preferences**: Single Hive object with user settings
- **Cache**: In-memory caching for active workouts

**Data Structure**:
```
hive_boxes/
├── workouts.hive → List<Workout>
├── preferences.hive → UserPreferences
└── cache/ → In-memory workout state
```

### Distance Calculation

**Algorithm**: Haversine formula for GPS point distance calculation
**Accuracy Target**: 5% margin of error
**Implementation**: 
- Filter GPS points with accuracy > 20m
- Apply smoothing algorithms for noise reduction
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
- **Storage Operations**: Test Hive read/write operations
- **Animation Logic**: Test character state transitions
- **Data Models**: Validate workout data integrity
- **BLoC Testing**: Test state management and business logic

### Widget Testing
- **UI Components**: Test widget rendering and interactions
- **Animation Widgets**: Test animation controllers and transitions
- **Form Validation**: Test input handling and validation
- **State Changes**: Test UI updates based on state changes

### Integration Testing
- **GPS Tracking Flow**: End-to-end workout recording
- **Background Processing**: App backgrounding during workouts
- **Platform Permissions**: iOS/Android permission handling
- **Performance**: Memory usage and battery consumption

### Performance Testing
- **Animation Frame Rate**: Maintain 60fps during all interactions
- **Battery Usage**: Target <10% drain per hour during tracking
- **Memory Management**: Prevent memory leaks during long workouts
- **Storage Performance**: Hive read/write benchmarks

### Testing Tools
- **flutter_test**: Unit and widget testing
- **integration_test**: E2E testing for Flutter
- **Flutter Inspector**: Performance monitoring and debugging
- **golden_toolkit**: Visual regression testing

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
- **UI Components**: Use Material Design with platform adaptations
- **Performance**: Optimize for both iOS and Android hardware ranges
- **Permissions**: Abstract permission handling through unified interface

## Security and Privacy

### Data Privacy
- **Local-Only Storage**: No cloud synchronization by default
- **Anonymous Usage**: No user accounts required
- **Location Data**: Never transmitted outside device
- **Export Control**: User controls all data export

### Security Measures
- **Data Encryption**: Hive encryption for sensitive data
- **Permission Minimization**: Request only necessary permissions
- **Background Limits**: Respect platform background execution limits
- **Secure Storage**: Use platform keychain for sensitive preferences