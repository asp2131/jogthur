import 'dart:math' as math;

import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'location_point.g.dart';

@HiveType(typeId: 2)
class LocationPoint extends HiveObject with EquatableMixin {
  @HiveField(0)
  final double latitude;
  
  @HiveField(1)
  final double longitude;
  
  @HiveField(2)
  final DateTime timestamp;
  
  @HiveField(3)
  final double accuracy; // in meters
  
  @HiveField(4)
  final double? altitude; // in meters
  
  @HiveField(5)
  final double? speed; // in m/s
  
  @HiveField(6)
  final double? heading; // in degrees
  
  LocationPoint({
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    required this.accuracy,
    this.altitude,
    this.speed,
    this.heading,
  });
  
  LocationPoint copyWith({
    double? latitude,
    double? longitude,
    DateTime? timestamp,
    double? accuracy,
    double? altitude,
    double? speed,
    double? heading,
  }) {
    return LocationPoint(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      timestamp: timestamp ?? this.timestamp,
      accuracy: accuracy ?? this.accuracy,
      altitude: altitude ?? this.altitude,
      speed: speed ?? this.speed,
      heading: heading ?? this.heading,
    );
  }
  
  // Calculate distance to another point using Haversine formula
  double distanceTo(LocationPoint other) {
    const double earthRadius = 6371000; // Earth's radius in meters
    
    final double lat1Rad = latitude * (3.14159265359 / 180);
    final double lat2Rad = other.latitude * (3.14159265359 / 180);
    final double deltaLatRad = (other.latitude - latitude) * (3.14159265359 / 180);
    final double deltaLonRad = (other.longitude - longitude) * (3.14159265359 / 180);
    
    final double a = (sin(deltaLatRad / 2) * sin(deltaLatRad / 2)) +
        (cos(lat1Rad) * cos(lat2Rad) * sin(deltaLonRad / 2) * sin(deltaLonRad / 2));
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    
    return earthRadius * c;
  }
  
  // Calculate bearing to another point
  double bearingTo(LocationPoint other) {
    final double lat1Rad = latitude * (3.14159265359 / 180);
    final double lat2Rad = other.latitude * (3.14159265359 / 180);
    final double deltaLonRad = (other.longitude - longitude) * (3.14159265359 / 180);
    
    final double y = sin(deltaLonRad) * cos(lat2Rad);
    final double x = cos(lat1Rad) * sin(lat2Rad) - sin(lat1Rad) * cos(lat2Rad) * cos(deltaLonRad);
    
    final double bearingRad = atan2(y, x);
    return (bearingRad * (180 / 3.14159265359) + 360) % 360;
  }
  
  // Check if this point is valid for tracking
  bool get isValidForTracking {
    return accuracy <= 20.0 && // Good GPS accuracy
           latitude.abs() <= 90 && // Valid latitude
           longitude.abs() <= 180; // Valid longitude
  }
  
  @override
  List<Object?> get props => [
    latitude,
    longitude,
    timestamp,
    accuracy,
    altitude,
    speed,
    heading,
  ];
  
  @override
  String toString() {
    return 'LocationPoint(lat: ${latitude.toStringAsFixed(6)}, '
           'lng: ${longitude.toStringAsFixed(6)}, '
           'accuracy: ${accuracy.toStringAsFixed(1)}m, '
           'timestamp: $timestamp)';
  }
}

// Helper functions for math operations
double sin(double radians) => math.sin(radians);
double cos(double radians) => math.cos(radians);
double atan2(double y, double x) => math.atan2(y, x);
double sqrt(double x) => math.sqrt(x);
