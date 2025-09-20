#### Modern Fitness UI Components (`lib/shared/widgets/`)

**fitness_button.dart**:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_theme.dart';

enum FitnessButtonVariant { primary, secondary, outlined }
enum FitnessButtonSize { sm, md, lg }

class FitnessButton extends StatefulWidget {
  final String title;
  final VoidCallback? onPressed;
  final FitnessButtonVariant variant;
  final FitnessButtonSize size;
  final IconData? icon;
  final bool loading;

  const FitnessButton({
    super.key,
    required this.title,
    this.onPressed,
    this.variant = FitnessButtonVariant.primary,
    this.size = FitnessButtonSize.md,
    this.icon,
    this.loading = false,
  });

  @override
  State<FitnessButton> createState() => _FitnessButtonState();
}

class _FitnessButtonState extends State<FitnessButton>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: AppTheme.quickAnimation,
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _scaleController, curve: AppTheme.standardCurve),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (widget.onPressed != null && !widget.loading) {
      _scaleController.forward();
    }
  }

  void _handleTapUp(TapUpDetails details) {
    if (widget.onPressed != null && !widget.loading) {
      _scaleController.reverse();
    }
  }

  void _handleTapCancel() {
    if (widget.onPressed != null && !widget.loading) {
      _scaleController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.loading ? null : widget.onPressed,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              padding: _getPadding(),
              decoration: _getDecoration(context),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (widget.loading)
                    SizedBox(
                      width: _getIconSize(),
                      height: _getIconSize(),
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _getTextColor(context),
                        ),
                      ),
                    )
                  else if (widget.icon != null) ...[
                    Icon(
                      widget.icon,
                      size: _getIconSize(),
                      color: _getTextColor(context),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    widget.title.toUpperCase(),
                    style: _getTextStyle(context),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  EdgeInsets _getPadding() {
    switch (widget.size) {
      case FitnessButtonSize.sm:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 8);
      case FitnessButtonSize.md:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 12);
      case FitnessButtonSize.lg:
        return const EdgeInsets.symmetric(horizontal: 32, vertical: 16);
    }
  }

  double _getIconSize() {
    switch (widget.size) {
      case FitnessButtonSize.sm:
        return 16;
      case FitnessButtonSize.md:
        return 20;
      case FitnessButtonSize.lg:
        return 24;
    }
  }

  BoxDecoration _getDecoration(BuildContext context) {
    final theme = Theme.of(context);
    
    switch (widget.variant) {
      case FitnessButtonVariant.primary:
        return BoxDecoration(
          gradient: AppGradients.primaryGradient,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.primary.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        );
      case FitnessButtonVariant.secondary:
        return BoxDecoration(
          color: theme.colorScheme.secondary,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.secondary.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        );
      case FitnessButtonVariant.outlined:
        return BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: theme.colorScheme.primary,
            width: 2,
          ),
        );
    }
  }

  Color _getTextColor(BuildContext context) {
    final theme = Theme.of(context);
    
    switch (widget.variant) {
      case FitnessButtonVariant.primary:
      case FitnessButtonVariant.secondary:
        return Colors.white;
      case FitnessButtonVariant.outlined:
        return theme.colorScheme.primary;
    }
  }

  TextStyle _getTextStyle(BuildContext context) {
    final baseStyle = Theme.of(context).textTheme.labelLarge!.copyWith(
      color: _getTextColor(context),
      fontWeight: FontWeight.w600,
    );

    switch (widget.size) {
      case FitnessButtonSize.sm:
        return baseStyle.copyWith(fontSize: 12);
      case FitnessButtonSize.md:
        return baseStyle.copyWith(fontSize: 14);
      case FitnessButtonSize.lg:
        return baseStyle.copyWith(fontSize: 16);
    }
  }
}
```

**activity_type_selector.dart**:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../features/workout/data/models/workout_model.dart';
import '../theme/app_theme.dart';

class ActivityTypeSelector extends StatelessWidget {
  final ActivityType selectedType;
  final ValueChanged<ActivityType> onTypeSelect;

  const ActivityTypeSelector({
    super.key,
    required this.selectedType,
    required this.onTypeSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: ActivityType.values.map((activity) {
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: ActivityButton(
              activity: activity,
              isSelected: selectedType == activity,
              onTap: () => onTypeSelect(activity),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class ActivityButton extends StatefulWidget {
  final ActivityType activity;
  final bool isSelected;
  final VoidCallback onTap;

  const ActivityButton({
    super.key,
    required this.activity,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<ActivityButton> createState() => _ActivityButtonState();
}

class _ActivityButtonState extends State<ActivityButton>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: AppTheme.quickAnimation,
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _scaleController, curve: AppTheme.standardCurve),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  IconData _getActivityIcon(ActivityType activity) {
    switch (activity) {
      case ActivityType.walk:
        return Icons.directions_walk;
      case ActivityType.run:
        return Icons.directions_run;
      case ActivityType.bike:
        return Icons.directions_bike;
    }
  }

  String _getActivityLabel(ActivityType activity) {
    switch (activity) {
      case ActivityType.walk:
        return 'Walk';
      case ActivityType.run:
        return 'Run';
      case ActivityType.bike:
        return 'Bike';
    }
  }

  Color _getActivityColor(ActivityType activity) {
    switch (activity) {
      case ActivityType.walk:
        return AppTheme.accentGreen;
      case ActivityType.run:
        return AppTheme.accentOrange;
      case ActivityType.bike:
        return AppTheme.primaryBlue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activityColor = _getActivityColor(widget.activity);
    
    return GestureDetector(
      onTapDown: (_) => _scaleController.forward(),
      onTapUp: (_) => _scaleController.reverse(),
      onTapCancel: () => _scaleController.reverse(),
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: AnimatedContainer(
              duration: AppTheme.mediumAnimation,
              curve: AppTheme.bouncyCurve,
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
              decoration: BoxDecoration(
                color: widget.isSelected 
                    ? activityColor 
                    : theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: widget.isSelected 
                      ? activityColor 
                      : theme.colorScheme.outline.withOpacity(0.3),
                  width: 2,
                ),
                boxShadow: widget.isSelected ? [
                  BoxShadow(
                    color: activityColor.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ] : null,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _getActivityIcon(widget.activity),
                    size: 32,
                    color: widget.isSelected 
                        ? Colors.white 
                        : theme.colorScheme.onSurface,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _getActivityLabel(widget.activity),
                    style: theme.textTheme.labelMedium!.copyWith(
                      color: widget.isSelected 
                          ? Colors.white 
                          : theme.colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ).animate(target: widget.isSelected ? 1 : 0)
              .scale(
                begin: const Offset(1, 1),
                end: const Offset(1.05, 1.05),
                duration: AppTheme.mediumAnimation,
                curve: AppTheme.bouncyCurve,
              ),
          );
        },
      ),
    );
  }
}# FitTracker Implementation Plan - Flutter Developer Guide

## Project Setup & Architecture

### **Phase 1: Foundation Setup (Day 1)**

#### Initial Project Scaffold
```bash
# Create Flutter project
flutter create fittracker
cd fittracker

# Add core dependencies to pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  
  # Database & Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  path_provider: ^2.1.1
  
  # Location & Maps
  geolocator: ^10.1.0
  google_maps_flutter: ^2.5.0
  permission_handler: ^11.0.1
  
  # UI & Animations
  flutter_animate: ^4.2.0
  lottie: ^2.7.0
  google_fonts: ^6.1.0
  
  # Utilities
  get_it: ^7.6.4
  injectable: ^2.3.2
  uuid: ^4.1.0
  
  # Background Processing
  workmanager: ^0.5.1
  flutter_local_notifications: ^16.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.7
  hive_generator: ^2.0.1
  injectable_generator: ^2.4.1
  json_serializable: ^6.7.1
  mockito: ^5.4.2
  bloc_test: ^9.1.4
```

#### Folder Structure
```
lib/
├── core/                    # Core utilities and base classes
│   ├── constants/          # App constants and config
│   ├── errors/             # Error handling and exceptions
│   ├── network/            # Network utilities (future)
│   ├── usecases/           # Base usecase classes
│   └── utils/              # Utility functions
├── features/               # Feature-based architecture
│   ├── workout/            # Workout tracking feature
│   │   ├── data/           # Data layer (repositories, models)
│   │   ├── domain/         # Domain layer (entities, usecases)
│   │   └── presentation/   # UI layer (widgets, bloc)
│   ├── history/            # Workout history feature
│   └── settings/           # Settings and preferences
├── shared/                 # Shared components and widgets
│   ├── widgets/            # Reusable UI components
│   ├── services/           # App-wide services
│   └── theme/              # App theme and styling
└── main.dart               # App entry point
```

#### Core Configuration Files

**pubspec.yaml** (WarioWare theme assets):
```yaml
flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/animations/
    - assets/sounds/
  
  fonts:
    - family: WarioWare
      fonts:
        - asset: assets/fonts/WarioWare-Bold.ttf
          weight: 700
    - family: Energetic
      fonts:
        - asset: assets/fonts/Energetic-Regular.ttf
```

**analysis_options.yaml**:
```yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
  
linter:
  rules:
    prefer_const_constructors: true
    prefer_const_literals_to_create_immutables: true
    avoid_unnecessary_containers: true
```

### **Phase 2: Dependency Injection & Core Setup (Day 1-2)**

#### Service Locator Setup (`lib/core/injection/injection.dart`)
```dart
import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'injection.config.dart';

final getIt = GetIt.instance;

@InjectableInit()
Future<void> configureDependencies() async {
  await Hive.initFlutter();
  
  // Register Hive adapters
  Hive.registerAdapter(WorkoutAdapter());
  Hive.registerAdapter(LocationPointAdapter());
  Hive.registerAdapter(ActivityTypeAdapter());
  Hive.registerAdapter(UserPreferencesAdapter());
  
  // Open Hive boxes
  await Hive.openBox<Workout>('workouts');
  await Hive.openBox<UserPreferences>('preferences');
  
  getIt.init();
}
```

#### Core Data Models (`lib/features/workout/data/models/`)

**workout_model.dart**:
```dart
import 'package:hive/hive.dart';
import 'package:equatable/equatable.dart';

part 'workout_model.g.dart';

@HiveType(typeId: 0)
class Workout extends HiveObject with EquatableMixin {
  @HiveField(0)
  final String id;
  
  @HiveField(1)
  final ActivityType type;
  
  @HiveField(2)
  final DateTime startTime;
  
  @HiveField(3)
  final DateTime? endTime;
  
  @HiveField(4)
  final double distance; // meters
  
  @HiveField(5)
  final int duration; // seconds
  
  @HiveField(6)
  final double avgPace; // seconds per km
  
  @HiveField(7)
  final double maxSpeed; // m/s
  
  @HiveField(8)
  final List<LocationPoint> gpsPoints;
  
  @HiveField(9)
  final bool isActive;
  
  const Workout({
    required this.id,
    required this.type,
    required this.startTime,
    this.endTime,
    required this.distance,
    required this.duration,
    required this.avgPace,
    required this.maxSpeed,
    required this.gpsPoints,
    required this.isActive,
  });

  @override
  List<Object?> get props => [
    id, type, startTime, endTime, distance, 
    duration, avgPace, maxSpeed, gpsPoints, isActive
  ];

  Workout copyWith({
    String? id,
    ActivityType? type,
    DateTime? startTime,
    DateTime? endTime,
    double? distance,
    int? duration,
    double? avgPace,
    double? maxSpeed,
    List<LocationPoint>? gpsPoints,
    bool? isActive,
  }) {
    return Workout(
      id: id ?? this.id,
      type: type ?? this.type,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      distance: distance ?? this.distance,
      duration: duration ?? this.duration,
      avgPace: avgPace ?? this.avgPace,
      maxSpeed: maxSpeed ?? this.maxSpeed,
      gpsPoints: gpsPoints ?? this.gpsPoints,
      isActive: isActive ?? this.isActive,
    );
  }
}

@HiveType(typeId: 1)
class LocationPoint with EquatableMixin {
  @HiveField(0)
  final double latitude;
  
  @HiveField(1)
  final double longitude;
  
  @HiveField(2)
  final DateTime timestamp;
  
  @HiveField(3)
  final double accuracy;

  const LocationPoint({
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    required this.accuracy,
  });

  @override
  List<Object> get props => [latitude, longitude, timestamp, accuracy];
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

#### BLoC State Management (`lib/features/workout/presentation/bloc/`)

**workout_bloc.dart**:
```dart
import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../domain/entities/workout.dart';
import '../../domain/usecases/start_workout.dart';
import '../../domain/usecases/stop_workout.dart';
import '../../domain/usecases/update_workout.dart';

part 'workout_event.dart';
part 'workout_state.dart';

@injectable
class WorkoutBloc extends Bloc<WorkoutEvent, WorkoutState> {
  final StartWorkout _startWorkout;
  final StopWorkout _stopWorkout;
  final UpdateWorkout _updateWorkout;
  
  StreamSubscription? _locationSubscription;

  WorkoutBloc(
    this._startWorkout,
    this._stopWorkout,
    this._updateWorkout,
  ) : super(const WorkoutInitial()) {
    on<StartWorkoutEvent>(_onStartWorkout);
    on<StopWorkoutEvent>(_onStopWorkout);
    on<PauseWorkoutEvent>(_onPauseWorkout);
    on<ResumeWorkoutEvent>(_onResumeWorkout);
    on<UpdateWorkoutDataEvent>(_onUpdateWorkoutData);
  }

  Future<void> _onStartWorkout(
    StartWorkoutEvent event,
    Emitter<WorkoutState> emit,
  ) async {
    try {
      emit(const WorkoutLoading());
      
      final result = await _startWorkout(StartWorkoutParams(
        activityType: event.activityType,
      ));
      
      result.fold(
        (failure) => emit(WorkoutError(failure.message)),
        (workout) {
          emit(WorkoutActive(workout));
          _startLocationTracking();
        },
      );
    } catch (e) {
      emit(WorkoutError(e.toString()));
    }
  }

  Future<void> _onStopWorkout(
    StopWorkoutEvent event,
    Emitter<WorkoutState> emit,
  ) async {
    try {
      if (state is WorkoutActive) {
        final currentWorkout = (state as WorkoutActive).workout;
        
        final result = await _stopWorkout(StopWorkoutParams(
          workout: currentWorkout,
        ));
        
        result.fold(
          (failure) => emit(WorkoutError(failure.message)),
          (completedWorkout) {
            emit(WorkoutCompleted(completedWorkout));
            _stopLocationTracking();
          },
        );
      }
    } catch (e) {
      emit(WorkoutError(e.toString()));
    }
  }

  void _startLocationTracking() {
    // Implementation will be added in location service
  }

  void _stopLocationTracking() {
    _locationSubscription?.cancel();
    _locationSubscription = null;
  }

  @override
  Future<void> close() {
    _stopLocationTracking();
    return super.close();
  }
}
```

### **Phase 3: Core Services (Day 2-3)**

#### Location Service (`lib/shared/services/location_service.dart`)
```dart
import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:injectable/injectable.dart';

import '../../features/workout/data/models/workout_model.dart';

@injectable
class LocationService {
  StreamSubscription<Position>? _positionSubscription;
  final StreamController<LocationPoint> _locationController = 
      StreamController<LocationPoint>.broadcast();

  Stream<LocationPoint> get locationStream => _locationController.stream;

  Future<bool> requestPermissions() async {
    try {
      final permission = await Permission.location.request();
      if (permission == PermissionStatus.granted) {
        // Request background location for sustained tracking
        final backgroundPermission = await Permission.locationAlways.request();
        return backgroundPermission == PermissionStatus.granted || 
               permission == PermissionStatus.granted;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> checkPermissions() async {
    final permission = await Permission.location.status;
    return permission == PermissionStatus.granted;
  }

  Future<void> startTracking({
    required ActivityType activityType,
  }) async {
    final hasPermission = await checkPermissions();
    if (!hasPermission) {
      throw Exception('Location permission denied');
    }

    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5, // Only update if moved 5 meters
    );

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        final locationPoint = LocationPoint(
          latitude: position.latitude,
          longitude: position.longitude,
          timestamp: DateTime.now(),
          accuracy: position.accuracy,
        );
        
        // Filter out inaccurate readings
        if (position.accuracy <= 20) {
          _locationController.add(locationPoint);
        }
      },
      onError: (error) {
        print('Location tracking error: $error');
      },
    );
  }

  Future<void> stopTracking() async {
    await _positionSubscription?.cancel();
    _positionSubscription = null;
  }

  Future<LocationPoint?> getCurrentLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      return LocationPoint(
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: DateTime.now(),
        accuracy: position.accuracy,
      );
    } catch (e) {
      return null;
    }
  }

  void dispose() {
    _locationController.close();
    _positionSubscription?.cancel();
  }
}
```

#### Distance Calculator (`lib/core/utils/distance_calculator.dart`)
```dart
import 'dart:math';
import '../../features/workout/data/models/workout_model.dart';

class DistanceCalculator {
  // Haversine formula implementation
  static double calculateDistance(LocationPoint point1, LocationPoint point2) {
    const double earthRadius = 6371000; // Earth's radius in meters
    
    final double lat1Rad = point1.latitude * (pi / 180);
    final double lat2Rad = point2.latitude * (pi / 180);
    final double deltaLatRad = (point2.latitude - point1.latitude) * (pi / 180);
    final double deltaLngRad = (point2.longitude - point1.longitude) * (pi / 180);

    final double a = sin(deltaLatRad / 2) * sin(deltaLatRad / 2) +
        cos(lat1Rad) * cos(lat2Rad) *
        sin(deltaLngRad / 2) * sin(deltaLngRad / 2);
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return earthRadius * c;
  }

  static double calculateTotalDistance(List<LocationPoint> points) {
    if (points.length < 2) return 0.0;
    
    double totalDistance = 0.0;
    for (int i = 1; i < points.length; i++) {
      totalDistance += calculateDistance(points[i - 1], points[i]);
    }
    return totalDistance;
  }

  static double calculatePace(double distance, int duration) {
    if (distance == 0) return 0.0;
    // Return seconds per kilometer
    return (duration / (distance / 1000));
  }

  static double calculateSpeed(double distance, int duration) {
    if (duration == 0) return 0.0;
    // Return meters per second
    return distance / duration;
  }

  // Douglas-Peucker algorithm for route simplification
  static List<LocationPoint> simplifyRoute(
    List<LocationPoint> points, 
    double tolerance,
  ) {
    if (points.length <= 2) return points;
    
    // Find the point with maximum distance from line between first and last
    double maxDistance = 0;
    int maxIndex = 0;
    
    for (int i = 1; i < points.length - 1; i++) {
      final double distance = _perpendicularDistance(
        points[i], 
        points.first, 
        points.last,
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      final List<LocationPoint> leftSegment = simplifyRoute(
        points.sublist(0, maxIndex + 1), 
        tolerance,
      );
      final List<LocationPoint> rightSegment = simplifyRoute(
        points.sublist(maxIndex), 
        tolerance,
      );
      
      return [...leftSegment.sublist(0, leftSegment.length - 1), ...rightSegment];
    }
    
    return [points.first, points.last];
  }

  static double _perpendicularDistance(
    LocationPoint point,
    LocationPoint lineStart,
    LocationPoint lineEnd,
  ) {
    // Calculate perpendicular distance from point to line
    final double area = (
      (lineEnd.longitude - lineStart.longitude) * (lineStart.latitude - point.latitude) -
      (lineStart.longitude - point.longitude) * (lineEnd.latitude - lineStart.latitude)
    ).abs();
    
    final double bottom = sqrt(
      pow(lineEnd.longitude - lineStart.longitude, 2) +
      pow(lineEnd.latitude - lineStart.latitude, 2)
    );
    
    return area / bottom;
  }
}
```

### **Phase 4: UI Component System (Day 3-4)**

#### Modern Fitness Theme System (`lib/shared/theme/app_theme.dart`)
```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Modern fitness app color palette
  static const Color primaryBlue = Color(0xFF2196F3);
  static const Color primaryDark = Color(0xFF1976D2);
  static const Color accentGreen = Color(0xFF4CAF50);
  static const Color accentOrange = Color(0xFFFF9800);
  static const Color backgroundLight = Color(0xFFF5F5F5);
  static const Color backgroundDark = Color(0xFF121212);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1E1E1E);
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textOnDark = Color(0xFFFFFFFF);
  static const Color errorRed = Color(0xFFD32F2F);
  static const Color warningAmber = Color(0xFFFFA000);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: primaryBlue,
        primaryContainer: primaryDark,
        secondary: accentGreen,
        tertiary: accentOrange,
        surface: surfaceLight,
        background: backgroundLight,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textPrimary,
        onBackground: textPrimary,
        error: errorRed,
      ),
      textTheme: GoogleFonts.interTextTheme().apply(
        bodyColor: textPrimary,
        displayColor: textPrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceLight,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: primaryBlue,
        primaryContainer: primaryDark,
        secondary: accentGreen,
        tertiary: accentOrange,
        surface: surfaceDark,
        background: backgroundDark,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textOnDark,
        onBackground: textOnDark,
        error: errorRed,
      ),
      textTheme: GoogleFonts.interTextTheme().apply(
        bodyColor: textOnDark,
        displayColor: textOnDark,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceDark,
        foregroundColor: textOnDark,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardTheme(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        ),
      ),
    );
  }

  // Animation configurations
  static const Duration quickAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 400);
  static const Duration slowAnimation = Duration(milliseconds: 600);
  
  static const Curve standardCurve = Curves.easeOutCubic;
  static const Curve bouncyCurve = Curves.elasticOut;
  static const Curve smoothCurve = Curves.easeInOutCubic;
}

// Modern gradients for fitness feel
class AppGradients {
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [AppTheme.primaryBlue, AppTheme.primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient successGradient = LinearGradient(
    colors: [AppTheme.accentGreen, Color(0xFF388E3C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient energyGradient = LinearGradient(
    colors: [AppTheme.accentOrange, Color(0xFFE65100)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFFE3F2FD), Color(0xFFBBDEFB)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}