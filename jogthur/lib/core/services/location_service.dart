import 'dart:async';
import 'dart:math' as math;

import 'package:geolocator/geolocator.dart';
import 'package:injectable/injectable.dart';

import '../models/location_point.dart';
import '../models/workout.dart' as workout_models;

abstract class LocationService {
  Future<bool> requestPermissions();
  Future<void> startTracking(workout_models.ActivityType activityType);
  Future<void> stopTracking();
  void pauseTracking();
  void resumeTracking();
  Future<LocationPoint?> getCurrentLocation();
  Stream<LocationPoint> get locationStream;
  bool get isTracking;
  bool get isPaused;
}

@Injectable(as: LocationService)
class LocationServiceImpl implements LocationService {
  StreamSubscription<Position>? _positionSubscription;
  final StreamController<LocationPoint> _locationController = StreamController<LocationPoint>.broadcast();
  
  bool _isTracking = false;
  bool _isPaused = false;
  LocationPoint? _lastValidLocation;
  workout_models.ActivityType? _currentActivityType;
  
  // GPS settings based on activity type
  static const Map<workout_models.ActivityType, LocationSettings> _locationSettings = {
    workout_models.ActivityType.walk: LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5, // meters
    ),
    workout_models.ActivityType.run: LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 3, // meters
    ),
    workout_models.ActivityType.bike: LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // meters
    ),
  };
  
  @override
  Stream<LocationPoint> get locationStream => _locationController.stream;
  
  @override
  bool get isTracking => _isTracking;
  
  @override
  bool get isPaused => _isPaused;
  
  @override
  Future<bool> requestPermissions() async {
    bool serviceEnabled;
    LocationPermission permission;
    
    // Check if location services are enabled
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }
    
    // Check permissions
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      return false;
    }
    
    // For background tracking, we need "always" permission
    if (permission == LocationPermission.whileInUse) {
      // Try to request "always" permission for background tracking
      permission = await Geolocator.requestPermission();
    }
    
    return permission == LocationPermission.always || 
           permission == LocationPermission.whileInUse;
  }
  
  @override
  Future<void> startTracking(workout_models.ActivityType activityType) async {
    if (_isTracking) {
      await stopTracking();
    }
    
    final hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw Exception('Location permissions not granted');
    }
    
    _currentActivityType = activityType;
    _isTracking = true;
    _isPaused = false;
    
    final settings = _locationSettings[activityType] ?? _locationSettings[workout_models.ActivityType.walk]!;
    
    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: settings,
    ).listen(
      _handleLocationUpdate,
      onError: _handleLocationError,
    );
  }
  
  @override
  Future<void> stopTracking() async {
    _isTracking = false;
    _isPaused = false;
    _currentActivityType = null;
    _lastValidLocation = null;
    
    await _positionSubscription?.cancel();
    _positionSubscription = null;
  }
  
  @override
  void pauseTracking() {
    if (_isTracking) {
      _isPaused = true;
    }
  }
  
  @override
  void resumeTracking() {
    if (_isTracking) {
      _isPaused = false;
    }
  }
  
  @override
  Future<LocationPoint?> getCurrentLocation() async {
    try {
      final hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }
      
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      
      return _positionToLocationPoint(position);
    } catch (e) {
      return null;
    }
  }
  
  void _handleLocationUpdate(Position position) {
    if (_isPaused || !_isTracking) {
      return;
    }
    
    final locationPoint = _positionToLocationPoint(position);
    
    // Filter out inaccurate GPS points
    if (!locationPoint.isValidForTracking) {
      return;
    }
    
    // Filter out points that are too close to the last valid location
    if (_lastValidLocation != null) {
      final distance = _lastValidLocation!.distanceTo(locationPoint);
      final timeDiff = locationPoint.timestamp.difference(_lastValidLocation!.timestamp).inSeconds;
      
      // Skip if the point is too close and too recent (likely GPS noise)
      if (distance < 2.0 && timeDiff < 3) {
        return;
      }
      
      // Skip if the calculated speed is unrealistic (likely GPS jump)
      if (timeDiff > 0) {
        final speed = distance / timeDiff; // m/s
        final maxRealisticSpeed = _getMaxRealisticSpeed(_currentActivityType);
        
        if (speed > maxRealisticSpeed) {
          return;
        }
      }
    }
    
    _lastValidLocation = locationPoint;
    _locationController.add(locationPoint);
  }
  
  void _handleLocationError(dynamic error) {
    // Handle location errors gracefully
    print('Location error: $error');
  }
  
  LocationPoint _positionToLocationPoint(Position position) {
    return LocationPoint(
      latitude: position.latitude,
      longitude: position.longitude,
      timestamp: position.timestamp ?? DateTime.now(),
      accuracy: position.accuracy,
      altitude: position.altitude,
      speed: position.speed,
      heading: position.heading,
    );
  }
  
  double _getMaxRealisticSpeed(workout_models.ActivityType? activityType) {
    switch (activityType) {
      case workout_models.ActivityType.walk:
        return 3.0; // 3 m/s = ~11 km/h
      case workout_models.ActivityType.run:
        return 8.0; // 8 m/s = ~29 km/h
      case workout_models.ActivityType.bike:
        return 20.0; // 20 m/s = ~72 km/h
      default:
        return 10.0; // Default reasonable speed
    }
  }
  
  void dispose() {
    _positionSubscription?.cancel();
    _locationController.close();
  }
}
