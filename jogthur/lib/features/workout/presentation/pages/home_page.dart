import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/models/workout.dart';
import '../bloc/workout_bloc.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    // Initialize the workout bloc to check for permissions
    context.read<WorkoutBloc>().add(InitializeWorkout());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Jogthur'),
      ),
      body: BlocConsumer<WorkoutBloc, WorkoutState>(
        listener: (context, state) {
          if (state.status == WorkoutStatus.error) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage ?? 'An unknown error occurred.'),
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state.status == WorkoutStatus.initial) {
            return const Center(child: CircularProgressIndicator());
          }

          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                const Text(
                  'Select Your Activity',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 32),
                _buildActivitySelector(context, state),
                const SizedBox(height: 64),
                _buildStartButton(context, state),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildActivitySelector(BuildContext context, WorkoutState state) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: ActivityType.values.map((activity) {
        final isSelected = state.selectedActivity == activity;
        return GestureDetector(
          onTap: () {
            context.read<WorkoutBloc>().add(SelectActivityType(activity));
          },
          child: Column(
            children: [
              Icon(
                _getIconForActivity(activity),
                size: 60,
                color: isSelected
                    ? Theme.of(context).colorScheme.primary
                    : Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
              ),
              const SizedBox(height: 8),
              Text(
                activity.name[0].toUpperCase() + activity.name.substring(1),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(context).colorScheme.onSurface.withOpacity(0.8),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildStartButton(BuildContext context, WorkoutState state) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 80, vertical: 20),
        textStyle: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
      ),
      onPressed: state.status == WorkoutStatus.ready
          ? () {
              // Navigate to workout screen or start tracking directly
              // For now, we'll just start the workout
              context.read<WorkoutBloc>().add(StartWorkout());
            }
          : null,
      child: const Text('START'),
    );
  }

  IconData _getIconForActivity(ActivityType activity) {
    switch (activity) {
      case ActivityType.walk:
        return Icons.directions_walk;
      case ActivityType.run:
        return Icons.directions_run;
      case ActivityType.bike:
        return Icons.directions_bike;
    }
  }
}
