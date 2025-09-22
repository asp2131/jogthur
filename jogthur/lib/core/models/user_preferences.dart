import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

import 'workout.dart';

part 'user_preferences.g.dart';

@HiveType(typeId: 3)
enum Units {
  @HiveField(0)
  metric,
  
  @HiveField(1)
  imperial,
}

@HiveType(typeId: 4)
class UserPreferences extends HiveObject with EquatableMixin {
  @HiveField(0)
  final Units units;
  
  @HiveField(1)
  final ActivityType defaultActivity;
  
  @HiveField(2)
  final String characterTheme;
  
  @HiveField(3)
  final bool soundEnabled;
  
  @HiveField(4)
  final bool hapticEnabled;
  
  @HiveField(5)
  final bool animationsEnabled;
  
  @HiveField(6)
  final double gpsUpdateInterval; // in seconds
  
  @HiveField(7)
  final bool backgroundTrackingEnabled;
  
  @HiveField(8)
  final bool autoSaveEnabled;
  
  UserPreferences({
    this.units = Units.metric,
    this.defaultActivity = ActivityType.walk,
    this.characterTheme = '🏃',
    this.soundEnabled = true,
    this.hapticEnabled = true,
    this.animationsEnabled = true,
    this.gpsUpdateInterval = 5.0,
    this.backgroundTrackingEnabled = true,
    this.autoSaveEnabled = true,
  });
  
  UserPreferences copyWith({
    Units? units,
    ActivityType? defaultActivity,
    String? characterTheme,
    bool? soundEnabled,
    bool? hapticEnabled,
    bool? animationsEnabled,
    double? gpsUpdateInterval,
    bool? backgroundTrackingEnabled,
    bool? autoSaveEnabled,
  }) {
    return UserPreferences(
      units: units ?? this.units,
      defaultActivity: defaultActivity ?? this.defaultActivity,
      characterTheme: characterTheme ?? this.characterTheme,
      soundEnabled: soundEnabled ?? this.soundEnabled,
      hapticEnabled: hapticEnabled ?? this.hapticEnabled,
      animationsEnabled: animationsEnabled ?? this.animationsEnabled,
      gpsUpdateInterval: gpsUpdateInterval ?? this.gpsUpdateInterval,
      backgroundTrackingEnabled: backgroundTrackingEnabled ?? this.backgroundTrackingEnabled,
      autoSaveEnabled: autoSaveEnabled ?? this.autoSaveEnabled,
    );
  }
  
  // Helper getters
  String get distanceUnit => units == Units.metric ? 'km' : 'mi';
  String get speedUnit => units == Units.metric ? 'km/h' : 'mph';
  String get paceUnit => units == Units.metric ? '/km' : '/mi';
  
  // Character theme options
  static const List<String> availableThemes = [
    '🏃', // Runner
    '🤖', // Robot
    '🦸', // Superhero
    '🧙', // Wizard
  ];
  
  // GPS update interval options (in seconds)
  static const List<double> availableGpsIntervals = [
    5.0,  // High accuracy
    10.0, // Balanced
    15.0, // Battery saver
    30.0, // Maximum battery
  ];
  
  @override
  List<Object?> get props => [
    units,
    defaultActivity,
    characterTheme,
    soundEnabled,
    hapticEnabled,
    animationsEnabled,
    gpsUpdateInterval,
    backgroundTrackingEnabled,
    autoSaveEnabled,
  ];
  
  @override
  String toString() {
    return 'UserPreferences(units: $units, defaultActivity: $defaultActivity, '
           'characterTheme: $characterTheme, gpsInterval: ${gpsUpdateInterval}s)';
  }
}
