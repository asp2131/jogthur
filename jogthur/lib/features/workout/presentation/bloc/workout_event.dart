part of 'workout_bloc.dart';

abstract class WorkoutEvent extends Equatable {
  const WorkoutEvent();

  @override
  List<Object> get props => [];
}

class InitializeWorkout extends WorkoutEvent {}

class SelectActivityType extends WorkoutEvent {
  final ActivityType activityType;

  const SelectActivityType(this.activityType);

  @override
  List<Object> get props => [activityType];
}

class StartWorkout extends WorkoutEvent {}

class PauseWorkout extends WorkoutEvent {}

class ResumeWorkout extends WorkoutEvent {}

class StopWorkout extends WorkoutEvent {}

class ResetWorkout extends WorkoutEvent {}

class _LocationUpdated extends WorkoutEvent {
  final LocationPoint locationPoint;

  const _LocationUpdated(this.locationPoint);

  @override
  List<Object> get props => [locationPoint];
}

class _TimerTicked extends WorkoutEvent {
  final int elapsedSeconds;

  const _TimerTicked(this.elapsedSeconds);

  @override
  List<Object> get props => [elapsedSeconds];
}
