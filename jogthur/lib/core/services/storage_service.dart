import 'package:hive_flutter/hive_flutter.dart';
import 'package:injectable/injectable.dart';

import '../models/workout.dart';
import '../models/user_preferences.dart';
import '../models/location_point.dart';

abstract class StorageService {
  Future<void> initialize();
  Future<void> saveWorkout(Workout workout);
  Future<List<Workout>> getWorkouts();
  Future<Workout?> getWorkout(String id);
  Future<void> deleteWorkout(String id);
  Future<void> savePreferences(UserPreferences preferences);
  Future<UserPreferences> getPreferences();
  Future<void> clearAllData();
}

@Injectable(as: StorageService)
class StorageServiceImpl implements StorageService {
  static const String _workoutsBoxName = 'workouts';
  static const String _preferencesBoxName = 'preferences';
  static const String _preferencesKey = 'user_preferences';
  
  Box<Workout>? _workoutsBox;
  Box<UserPreferences>? _preferencesBox;
  
  @override
  Future<void> initialize() async {
    await Hive.initFlutter();
    
    // Register Hive adapters
    if (!Hive.isAdapterRegistered(0)) {
      Hive.registerAdapter(ActivityTypeAdapter());
    }
    if (!Hive.isAdapterRegistered(1)) {
      Hive.registerAdapter(WorkoutAdapter());
    }
    if (!Hive.isAdapterRegistered(2)) {
      Hive.registerAdapter(LocationPointAdapter());
    }
    if (!Hive.isAdapterRegistered(3)) {
      Hive.registerAdapter(UnitsAdapter());
    }
    if (!Hive.isAdapterRegistered(4)) {
      Hive.registerAdapter(UserPreferencesAdapter());
    }
    
    // Open boxes
    _workoutsBox = await Hive.openBox<Workout>(_workoutsBoxName);
    _preferencesBox = await Hive.openBox<UserPreferences>(_preferencesBoxName);
  }
  
  @override
  Future<void> saveWorkout(Workout workout) async {
    if (_workoutsBox == null) {
      throw Exception('Storage not initialized');
    }
    
    await _workoutsBox!.put(workout.id, workout);
  }
  
  @override
  Future<List<Workout>> getWorkouts() async {
    if (_workoutsBox == null) {
      throw Exception('Storage not initialized');
    }
    
    final workouts = _workoutsBox!.values.toList();
    
    // Sort by start time (most recent first)
    workouts.sort((a, b) => b.startTime.compareTo(a.startTime));
    
    return workouts;
  }
  
  @override
  Future<Workout?> getWorkout(String id) async {
    if (_workoutsBox == null) {
      throw Exception('Storage not initialized');
    }
    
    return _workoutsBox!.get(id);
  }
  
  @override
  Future<void> deleteWorkout(String id) async {
    if (_workoutsBox == null) {
      throw Exception('Storage not initialized');
    }
    
    await _workoutsBox!.delete(id);
  }
  
  @override
  Future<void> savePreferences(UserPreferences preferences) async {
    if (_preferencesBox == null) {
      throw Exception('Storage not initialized');
    }
    
    await _preferencesBox!.put(_preferencesKey, preferences);
  }
  
  @override
  Future<UserPreferences> getPreferences() async {
    if (_preferencesBox == null) {
      throw Exception('Storage not initialized');
    }
    
    final preferences = _preferencesBox!.get(_preferencesKey);
    return preferences ?? UserPreferences();
  }
  
  @override
  Future<void> clearAllData() async {
    if (_workoutsBox == null || _preferencesBox == null) {
      throw Exception('Storage not initialized');
    }
    
    await _workoutsBox!.clear();
    await _preferencesBox!.clear();
  }
  
  // Statistics helpers
  Future<Map<String, dynamic>> getWorkoutStatistics() async {
    final workouts = await getWorkouts();
    
    if (workouts.isEmpty) {
      return {
        'totalWorkouts': 0,
        'totalDistance': 0.0,
        'totalDuration': 0,
        'averagePace': 0.0,
        'activityBreakdown': <String, int>{},
      };
    }
    
    final totalDistance = workouts.fold<double>(0.0, (sum, w) => sum + w.distance);
    final totalDuration = workouts.fold<int>(0, (sum, w) => sum + w.duration);
    final averagePace = workouts.fold<double>(0.0, (sum, w) => sum + w.averagePace) / workouts.length;
    
    final activityBreakdown = <String, int>{};
    for (final workout in workouts) {
      final activityName = workout.type.name;
      activityBreakdown[activityName] = (activityBreakdown[activityName] ?? 0) + 1;
    }
    
    return {
      'totalWorkouts': workouts.length,
      'totalDistance': totalDistance,
      'totalDuration': totalDuration,
      'averagePace': averagePace,
      'activityBreakdown': activityBreakdown,
    };
  }
  
  Future<List<Workout>> getWorkoutsByDateRange(DateTime start, DateTime end) async {
    final allWorkouts = await getWorkouts();
    
    return allWorkouts.where((workout) {
      return workout.startTime.isAfter(start) && workout.startTime.isBefore(end);
    }).toList();
  }
  
  Future<List<Workout>> getWorkoutsByActivity(ActivityType activityType) async {
    final allWorkouts = await getWorkouts();
    
    return allWorkouts.where((workout) => workout.type == activityType).toList();
  }
  
  void dispose() {
    _workoutsBox?.close();
    _preferencesBox?.close();
  }
}
