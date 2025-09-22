part of 'workout_bloc.dart';

enum WorkoutStatus {
  initial,
  ready,
  tracking,
  paused,
  finished,
  error,
}

class WorkoutState extends Equatable {
  final WorkoutStatus status;
  final ActivityType selectedActivity;
  final int elapsedSeconds;
  final double distance; // in meters
  final double currentSpeed; // in m/s
  final double averagePace; // minutes per km
  final List<LocationPoint> route;
  final Workout? completedWorkout;
  final String? errorMessage;

  const WorkoutState({
    this.status = WorkoutStatus.initial,
    this.selectedActivity = ActivityType.walk,
    this.elapsedSeconds = 0,
    this.distance = 0.0,
    this.currentSpeed = 0.0,
    this.averagePace = 0.0,
    this.route = const [],
    this.completedWorkout,
    this.errorMessage,
  });

  WorkoutState copyWith({
    WorkoutStatus? status,
    ActivityType? selectedActivity,
    int? elapsedSeconds,
    double? distance,
    double? currentSpeed,
    double? averagePace,
    List<LocationPoint>? route,
    Workout? completedWorkout,
    String? errorMessage,
  }) {
    return WorkoutState(
      status: status ?? this.status,
      selectedActivity: selectedActivity ?? this.selectedActivity,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      distance: distance ?? this.distance,
      currentSpeed: currentSpeed ?? this.currentSpeed,
      averagePace: averagePace ?? this.averagePace,
      route: route ?? this.route,
      completedWorkout: completedWorkout ?? this.completedWorkout,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        status,
        selectedActivity,
        elapsedSeconds,
        distance,
        currentSpeed,
        averagePace,
        route,
        completedWorkout,
        errorMessage,
      ];
}
