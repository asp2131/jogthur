import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/models/location_point.dart';
import '../../../../core/models/workout.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/services/storage_service.dart';

part 'workout_event.dart';
part 'workout_state.dart';

@injectable
class WorkoutBloc extends Bloc<WorkoutEvent, WorkoutState> {
  final LocationService _locationService;
  final StorageService _storageService;
  StreamSubscription<LocationPoint>? _locationSubscription;
  Timer? _timer;

  WorkoutBloc(this._locationService, this._storageService)
      : super(const WorkoutState()) {
    on<InitializeWorkout>(_onInitializeWorkout);
    on<SelectActivityType>(_onSelectActivityType);
    on<StartWorkout>(_onStartWorkout);
    on<PauseWorkout>(_onPauseWorkout);
    on<ResumeWorkout>(_onResumeWorkout);
    on<StopWorkout>(_onStopWorkout);
    on<ResetWorkout>(_onResetWorkout);
    on<_LocationUpdated>(_onLocationUpdated);
    on<_TimerTicked>(_onTimerTicked);
  }

  Future<void> _onInitializeWorkout(
    InitializeWorkout event,
    Emitter<WorkoutState> emit,
  ) async {
    try {
      await _storageService.initialize();
      final hasPermissions = await _locationService.requestPermissions();
      if (hasPermissions) {
        emit(state.copyWith(status: WorkoutStatus.ready));
      } else {
        emit(state.copyWith(
          status: WorkoutStatus.error,
          errorMessage: 'Location permissions are required to track workouts.',
        ));
      }
    } catch (e) {
      emit(state.copyWith(
        status: WorkoutStatus.error,
        errorMessage: 'Failed to initialize the app: $e',
      ));
    }
  }

  void _onSelectActivityType(
    SelectActivityType event,
    Emitter<WorkoutState> emit,
  ) {
    emit(state.copyWith(selectedActivity: event.activityType));
  }

  Future<void> _onStartWorkout(
    StartWorkout event,
    Emitter<WorkoutState> emit,
  ) async {
    if (state.status == WorkoutStatus.tracking) return;

    try {
      await _locationService.startTracking(state.selectedActivity);
      _locationSubscription = _locationService.locationStream.listen(
        (locationPoint) => add(_LocationUpdated(locationPoint)),
      );

      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        add(_TimerTicked(timer.tick));
      });

      emit(state.copyWith(
        status: WorkoutStatus.tracking,
        elapsedSeconds: 0,
        distance: 0.0,
        route: [],
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkoutStatus.error,
        errorMessage: 'Failed to start workout: $e',
      ));
    }
  }

  void _onPauseWorkout(PauseWorkout event, Emitter<WorkoutState> emit) {
    if (state.status != WorkoutStatus.tracking) return;

    _locationService.pauseTracking();
    _timer?.cancel();
    emit(state.copyWith(status: WorkoutStatus.paused));
  }

  void _onResumeWorkout(ResumeWorkout event, Emitter<WorkoutState> emit) {
    if (state.status != WorkoutStatus.paused) return;

    _locationService.resumeTracking();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      // We add the previous elapsed time to the new ticks
      add(_TimerTicked(state.elapsedSeconds + timer.tick));
    });
    emit(state.copyWith(status: WorkoutStatus.tracking));
  }

  Future<void> _onStopWorkout(
    StopWorkout event,
    Emitter<WorkoutState> emit,
  ) async {
    if (state.status != WorkoutStatus.tracking && state.status != WorkoutStatus.paused) {
      return;
    }

    await _locationService.stopTracking();
    _locationSubscription?.cancel();
    _timer?.cancel();

    final workout = Workout(
      type: state.selectedActivity,
      startTime: DateTime.now().subtract(Duration(seconds: state.elapsedSeconds)),
      endTime: DateTime.now(),
      distance: state.distance,
      duration: state.elapsedSeconds,
      averagePace: state.averagePace,
      maxSpeed: 0, // Placeholder, needs calculation
      route: state.route,
    );

    try {
      await _storageService.saveWorkout(workout);
      emit(state.copyWith(
        status: WorkoutStatus.finished,
        completedWorkout: workout,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: WorkoutStatus.error,
        errorMessage: 'Failed to save workout: $e',
      ));
    }
  }

  void _onResetWorkout(ResetWorkout event, Emitter<WorkoutState> emit) {
    emit(const WorkoutState().copyWith(status: WorkoutStatus.ready));
  }

  void _onLocationUpdated(
    _LocationUpdated event,
    Emitter<WorkoutState> emit,
  ) {
    if (state.status != WorkoutStatus.tracking) return;

    final newRoute = List<LocationPoint>.from(state.route)..add(event.locationPoint);
    double newDistance = state.distance;
    if (newRoute.length > 1) {
      newDistance += newRoute[newRoute.length - 2].distanceTo(newRoute.last);
    }

    // Calculate current speed from the location point if available
    final currentSpeed = event.locationPoint.speed ?? 0.0;

    // Calculate average pace (minutes per km)
    double averagePace = 0.0;
    if (newDistance > 0 && state.elapsedSeconds > 0) {
      final minutes = state.elapsedSeconds / 60;
      final kilometers = newDistance / 1000;
      averagePace = minutes / kilometers;
    }

    emit(state.copyWith(
      route: newRoute,
      distance: newDistance,
      currentSpeed: currentSpeed,
      averagePace: averagePace,
    ));
  }

  void _onTimerTicked(_TimerTicked event, Emitter<WorkoutState> emit) {
    if (state.status != WorkoutStatus.tracking) return;
    emit(state.copyWith(elapsedSeconds: event.elapsedSeconds));
  }

  @override
  Future<void> close() {
    _locationSubscription?.cancel();
    _timer?.cancel();
    return super.close();
  }
}
