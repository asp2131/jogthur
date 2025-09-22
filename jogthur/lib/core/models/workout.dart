import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';

import 'location_point.dart';

part 'workout.g.dart';

@HiveType(typeId: 0)
enum ActivityType {
  @HiveField(0)
  walk,
  
  @HiveField(1)
  run,
  
  @HiveField(2)
  bike,
}

@HiveType(typeId: 1)
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
  final double distance; // in meters
  
  @HiveField(5)
  final int duration; // in seconds
  
  @HiveField(6)
  final double averagePace; // minutes per km
  
  @HiveField(7)
  final double maxSpeed; // in m/s
  
  @HiveField(8)
  final List<LocationPoint> route;
  
  @HiveField(9)
  final double? calories;
  
  Workout({
    String? id,
    required this.type,
    required this.startTime,
    this.endTime,
    required this.distance,
    required this.duration,
    required this.averagePace,
    required this.maxSpeed,
    required this.route,
    this.calories,
  }) : id = id ?? const Uuid().v4();
  
  Workout copyWith({
    String? id,
    ActivityType? type,
    DateTime? startTime,
    DateTime? endTime,
    double? distance,
    int? duration,
    double? averagePace,
    double? maxSpeed,
    List<LocationPoint>? route,
    double? calories,
  }) {
    return Workout(
      id: id ?? this.id,
      type: type ?? this.type,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      distance: distance ?? this.distance,
      duration: duration ?? this.duration,
      averagePace: averagePace ?? this.averagePace,
      maxSpeed: maxSpeed ?? this.maxSpeed,
      route: route ?? this.route,
      calories: calories ?? this.calories,
    );
  }
  
  // Calculated properties
  double get distanceInKm => distance / 1000;
  
  double get distanceInMiles => distance / 1609.34;
  
  String get formattedDuration {
    final hours = duration ~/ 3600;
    final minutes = (duration % 3600) ~/ 60;
    final seconds = duration % 60;
    
    if (hours > 0) {
      return '${hours}h ${minutes}m ${seconds}s';
    } else if (minutes > 0) {
      return '${minutes}m ${seconds}s';
    } else {
      return '${seconds}s';
    }
  }
  
  String get formattedPace {
    final minutes = averagePace.floor();
    final seconds = ((averagePace - minutes) * 60).round();
    return '${minutes}:${seconds.toString().padLeft(2, '0')} /km';
  }
  
  double get averageSpeedKmh => (distance / 1000) / (duration / 3600);
  
  double get averageSpeedMph => averageSpeedKmh * 0.621371;
  
  @override
  List<Object?> get props => [
    id,
    type,
    startTime,
    endTime,
    distance,
    duration,
    averagePace,
    maxSpeed,
    route,
    calories,
  ];
  
  @override
  String toString() {
    return 'Workout(id: $id, type: $type, distance: ${distanceInKm.toStringAsFixed(2)}km, duration: $formattedDuration)';
  }
}
