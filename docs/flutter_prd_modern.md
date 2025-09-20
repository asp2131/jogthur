# Exercise Tracking App - Product Requirements Document (PRD) v2.0

## Product Overview

**Product Name:** FitTracker  
**Product Type:** Mobile fitness tracking application  
**Platform:** iOS and Android (Flutter)  
**Target Users:** Casual to serious fitness enthusiasts who walk, run, or bike  
**Core Value Proposition:** Clean, modern exercise tracking with 3D character animations and reliable distance tracking that encourages consistent fitness habits through engaging visual feedback

## MVP Objectives

**Primary Goal:** Create a lightweight, performant exercise tracking app that reliably tracks distance for walking, running, and biking activities without requiring user accounts or internet connectivity.

**Success Metrics:**
- Accurate GPS tracking within 5% margin of error
- App startup time under 2 seconds
- Battery usage under 10% per hour during active tracking
- 60fps performance during all interactions
- Smooth, responsive animations that enhance user experience

## Core Features (MVP)

### 1. Activity Tracking
**User Story:** "As a user, I want to track my walking, running, or biking distance so I can monitor my fitness progress."

**Features:**
- Start/pause/stop workout tracking with intuitive controls
- Real-time distance calculation
- Activity type selection (Walk, Run, Bike) with smooth transitions
- Current pace/speed display with live updates
- Elapsed time tracking
- Background tracking continuation

**Technical Requirements:**
- GPS-based distance calculation using Haversine formula
- Location updates every 5-10 seconds (optimized for battery)
- Background task management for uninterrupted tracking
- Route simplification for storage efficiency

### 2. Workout History
**User Story:** "As a user, I want to view my past workouts so I can track my progress over time."

**Features:**
- Clean list of completed workouts with card-based design
- Workout details (distance, time, pace, date) with smooth transitions
- Basic statistics (total distance, workout count) with progress indicators
- Delete individual workouts with confirmation

**Technical Requirements:**
- Local data persistence using Hive database
- Optimized list rendering for large datasets
- Material Design 3 card components
- Data export capability (future consideration)

### 3. Real-time Workout Display
**User Story:** "As a user, I want to see my progress during a workout so I can stay motivated."

**Features:**
- Live distance counter with smooth number transitions
- Current pace/speed with real-time updates
- Elapsed time with clean typography
- Progress toward goals with circular progress indicators
- Large, readable display optimized for outdoor use
- Subtle motivational feedback

## Technical Stack & Architecture

### Core Framework
- **Flutter** - Cross-platform development with single codebase
- **Dart** - Type-safe programming language with null safety

### State Management
- **BLoC/Cubit** - Predictable state management with clear separation of concerns
- **Equatable** - Value equality for state objects

### UI/UX & Styling Stack
- **Material Design 3** - Modern, accessible design system
- **Google Fonts** - Professional typography (Inter font family)
- **Flutter Animate** - Smooth, performant animations
- **Custom Theme System** - Consistent color scheme and styling

### Animation & Interactions
- **Flutter's Animation API** - Built-in 60fps animations on main thread
- **CustomPainter** - Custom 3D character rendering
- **Hero Animations** - Smooth page transitions
- **Implicit Animations** - Smooth property changes

### Performance & Lists
- **ListView.builder** - Optimized list rendering with lazy loading
- **Performance monitoring** - Frame timing and memory usage tracking

### Location & Background Processing
- **Geolocator** - Cross-platform GPS tracking
- **WorkManager** - Background task scheduling
- **Permission Handler** - Runtime permission management
- **Google Maps Flutter** - Live map rendering

### Data Storage & Performance
- **Hive** - Fast, lightweight NoSQL database
- **Path Provider** - Cross-platform file system access
- **Efficient data structures** - Optimized for quick reads/writes

### Navigation
- **Flutter Navigation 2.0** - Declarative routing with smooth transitions

## Design System & Theme

### Color Palette & Theme (Modern Fitness)
```dart
export const theme = {
  colors: {
    // Clean, professional colors for fitness tracking
    primary: '#2196F3',        // Bright blue for energy and trust
    primaryDark: '#1976D2',    // Darker blue for depth
    secondary: '#4CAF50',      // Green for success and health
    accent: '#FF9800',         // Orange for activity and motivation
    background: '#F5F5F5',     // Light gray for readability
    surface: '#FFFFFF',        // Pure white for cards and surfaces
    onPrimary: '#FFFFFF',      // White text on primary
    onSurface: '#212121',      // Dark text on light surfaces
    textSecondary: '#757575',  // Gray for secondary text
    error: '#D32F2F',          // Red for errors
    warning: '#FFA000',        // Amber for warnings
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },
  shadows: {
    sm: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0px 4px 8px rgba(0, 0, 0, 0.12)',
    lg: '0px 8px 16px rgba(0, 0, 0, 0.15)',
  },
};
```

### Animation Configurations (Modern & Smooth)
```dart
export const animations = {
  // Clean, professional animations
  standardConfig: {
    duration: 300,
    curve: Curves.easeOutCubic,
  },
  quickConfig: {
    duration: 200,
    curve: Curves.easeOut,
  },
  slowConfig: {
    duration: 500,
    curve: Curves.easeInOutCubic,
  },
  // Smooth animation patterns
  fadeIn: (controller) => FadeTransition(opacity: controller),
  slideUp: (controller) => SlideTransition(
    position: Tween(begin: Offset(0, 0.1), end: Offset.zero).animate(controller)
  ),
  scaleIn: (controller) => ScaleTransition(scale: controller),
};
```

## User Flow & Screen Architecture

### 1. Home Screen
**Purpose:** Quick access to start workouts and view recent activity

**Components:**
- Clean activity type selector (Walk/Run/Bike) with Material Design cards
- Large "Start Workout" button with gradient background
- Recent workout summary cards with elevation and shadows
- Quick stats (this week's distance, workout count) with progress circles

**UI/UX Implementation:**
```dart
// Modern activity selector
class ActivitySelector extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: ActivityType.values.map((activity) => 
        Expanded(
          child: Card(
            elevation: selectedActivity == activity ? 8 : 2,
            child: InkWell(
              onTap: () => onActivitySelected(activity),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: EdgeInsets.all(20),
                child: Column(
                  children: [
                    Icon(getActivityIcon(activity), size: 32),
                    SizedBox(height: 8),
                    Text(activity.name.capitalize()),
                  ],
                ),
              ),
            ),
          ),
        ),
      ).toList(),
    );
  }
}
```

### 2. Active Workout Screen (Split Screen Layout)
**Purpose:** Real-time workout tracking with live map and 3D character

**Layout:**
- **Top Half:** Live map showing current route and location
- **Bottom Half:** 3D character that reacts to workout data

**Top Section Components:**
- Google Maps widget with real-time route polyline
- Current location marker with subtle pulsing animation
- Stats overlay with clean typography and proper contrast
- Speed/pace indicators with smooth number transitions

**Bottom Section Components:**
- Custom 3D running character using CustomPainter:
  - Animation speed synced to user's actual pace
  - Celebrates milestones with smooth scale/rotation animations
  - Responds to taps with subtle feedback
  - Color changes based on workout type
- Floating action buttons for workout controls
- Clean stat cards with Material Design elevation

**Technical Implementation:**
```dart
class ActiveWorkoutScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Top Half - Live Map
          Expanded(
            child: Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: currentLocation,
                    zoom: 16,
                  ),
                  polylines: {
                    Polyline(
                      polylineId: PolylineId('route'),
                      points: routePoints,
                      color: Theme.of(context).colorScheme.primary,
                      width: 6,
                    ),
                  },
                ),
                // Stats overlay
                Positioned(
                  top: 50,
                  left: 16,
                  right: 16,
                  child: WorkoutStatsCard(
                    distance: currentDistance,
                    pace: currentPace,
                    time: elapsedTime,
                  ),
                ),
              ],
            ),
          ),
          
          // Bottom Half - 3D Character
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Theme.of(context).colorScheme.surface,
                    Theme.of(context).colorScheme.background,
                  ],
                ),
              ),
              child: Stack(
                children: [
                  // 3D Character
                  Center(
                    child: Character3DWidget(
                      activityType: workoutType,
                      currentSpeed: currentSpeed,
                      onTap: handleCharacterTap,
                    ),
                  ),
                  
                  // Control buttons
                  Positioned(
                    bottom: 32,
                    left: 16,
                    right: 16,
                    child: WorkoutControls(
                      onPause: handlePause,
                      onStop: handleStop,
                      isActive: isTrackingActive,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

### 3. Workout History Screen
**Purpose:** View and manage past workouts

**Components:**
- ListView.builder with optimized performance for large datasets
- Material Design cards for workout entries
- Smooth page transitions to detail view
- Swipe-to-delete with confirmation snackbar

**Performance Optimization:**
```dart
class WorkoutHistoryScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Workout History')),
      body: BlocBuilder<WorkoutHistoryBloc, WorkoutHistoryState>(
        builder: (context, state) {
          if (state is WorkoutHistoryLoaded) {
            return ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: state.workouts.length,
              itemBuilder: (context, index) {
                return WorkoutCard(
                  workout: state.workouts[index],
                  onTap: () => _navigateToDetail(state.workouts[index]),
                  onDelete: () => _deleteWorkout(state.workouts[index]),
                );
              },
            );
          }
          return Center(child: CircularProgressIndicator());
        },
      ),
    );
  }
}
```

## Data Models

### Workout Model
```dart
@HiveType(typeId: 0)
class Workout extends HiveObject {
  @HiveField(0)
  final String id;
  
  @HiveField(1)
  final ActivityType type;
  
  @HiveField(2)
  final DateTime startTime;
  
  @HiveField(3)
  final DateTime? endTime;
  
  @HiveField(4)
  final double distance; // in meters
  
  @HiveField(5)
  final int duration; // in seconds
  
  @HiveField(6)
  final double avgPace; // in seconds per km
  
  @HiveField(7)
  final double maxSpeed; // in m/s
  
  @HiveField(8)
  final List<LocationPoint> gpsPoints;
}
```

## Performance Requirements

### Battery Optimization
- GPS updates every 5-10 seconds during active tracking
- Intelligent location filtering based on accuracy
- Efficient background task management
- Smart GPS precision adjustments

### Storage Efficiency
- Hive database for fast local storage
- Route point compression for large datasets
- Automatic cleanup of excessive GPS points
- Efficient query patterns for workout history

### UI Performance
- Consistent 60fps during all animations
- Optimized ListView rendering for large datasets
- Efficient state management with BLoC pattern
- Proper widget rebuilding optimization

## Platform-Specific Considerations

### iOS Requirements
- Location permission: "When In Use" and "Always"
- Background App Refresh configuration
- Core Location integration
- iOS-specific UI adaptations

### Android Requirements
- Location permissions: ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION
- Foreground service for background tracking
- Android-specific Material Design components
- Battery optimization handling

## Development Phases

### Phase 1: Core Setup & Models (Days 1-2)
- Flutter project initialization with proper folder structure
- Hive database setup with data models
- BLoC architecture implementation
- Basic navigation structure

### Phase 2: Location & Core Services (Days 2-3)
- GPS tracking service with Geolocator
- Permission handling for both platforms
- Distance calculation algorithms
- Background tracking setup

### Phase 3: UI Foundation (Days 3-4)
- Material Design 3 theme implementation
- Core widget library (buttons, cards, selectors)
- Animation system setup
- Basic screen layouts

### Phase 4: Main Features (Days 4-6)
- Active workout screen with split layout
- Google Maps integration
- 3D character with CustomPainter
- Workout history screen

### Phase 5: Polish & Optimization (Days 6-7)
- Performance optimization
- Error handling and edge cases
- Platform-specific adaptations
- Testing and quality assurance

## Success Criteria

1. **Functionality:** Accurate distance tracking within 5% margin
2. **Performance:** 60fps animations, <2s startup time
3. **Battery:** <10% drain per hour during tracking
4. **Reliability:** Handles background transitions smoothly
5. **Usability:** Intuitive interface with clear visual hierarchy
6. **Accessibility:** Proper contrast ratios and screen reader support