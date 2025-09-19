import { LocationPoint, Workout, ActivityType } from '../models';
import { LocationService } from './LocationService';
import { StorageService } from './StorageService';
import { calculateSpeed } from '../utils/geoUtils';

/**
 * Represents the current state of a workout session.
 */
export enum WorkoutState {
  IDLE = 'idle',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped'
}

/**
 * Real-time workout statistics.
 */
export interface WorkoutStats {
  distance: number;        // Total distance in meters
  duration: number;        // Total duration in seconds
  activeDuration: number;  // Active duration (excluding paused time) in seconds
  currentPace: number;     // Current pace in seconds per km
  averagePace: number;     // Average pace in seconds per km
  currentSpeed: number;    // Current speed in m/s
  maxSpeed: number;        // Maximum speed reached in m/s
  calories?: number;       // Estimated calories burned
}

/**
 * Configuration for different activity types.
 */
export interface ActivityConfig {
  type: ActivityType;
  minSpeed: number;        // Minimum speed to consider movement (m/s)
  maxReasonableSpeed: number; // Maximum reasonable speed for filtering (m/s)
  caloriesPerKm?: number;  // Calories burned per km (optional)
  gpsUpdateInterval: number; // GPS update interval in seconds
  distanceFilter: number;  // Minimum distance between GPS points in meters
}

/**
 * Workout session data that's maintained during an active workout.
 */
export interface WorkoutSession {
  id: string;
  type: ActivityType;
  state: WorkoutState;
  startTime: Date;
  pausedTime?: Date;
  resumedTime?: Date;
  gpsPoints: LocationPoint[];
  stats: WorkoutStats;
  totalPausedDuration: number; // Total time spent paused in seconds
}

/**
 * WorkoutManager coordinates GPS tracking, storage, and real-time statistics
 * for workout sessions.
 */
export class WorkoutManager {
  private locationService: LocationService;
  private storageService: StorageService;
  private currentSession: WorkoutSession | null = null;
  private locationUnsubscribe: (() => void) | null = null;
  private statsUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private lastLocationUpdate: Date | null = null;

  // Activity configurations
  private readonly activityConfigs: Record<ActivityType, ActivityConfig> = {
    walk: {
      type: 'walk',
      minSpeed: 0.5,        // 0.5 m/s (1.8 km/h)
      maxReasonableSpeed: 3.0, // 3.0 m/s (10.8 km/h)
      caloriesPerKm: 50,    // Approximate calories per km for walking
      gpsUpdateInterval: 5,  // 5 seconds
      distanceFilter: 3     // 3 meters
    },
    run: {
      type: 'run',
      minSpeed: 1.5,        // 1.5 m/s (5.4 km/h)
      maxReasonableSpeed: 8.0, // 8.0 m/s (28.8 km/h)
      caloriesPerKm: 80,    // Approximate calories per km for running
      gpsUpdateInterval: 3,  // 3 seconds for more accuracy
      distanceFilter: 5     // 5 meters
    },
    bike: {
      type: 'bike',
      minSpeed: 2.0,        // 2.0 m/s (7.2 km/h)
      maxReasonableSpeed: 20.0, // 20.0 m/s (72 km/h)
      caloriesPerKm: 30,    // Approximate calories per km for biking
      gpsUpdateInterval: 5,  // 5 seconds
      distanceFilter: 10    // 10 meters
    }
  };

  constructor(locationService: LocationService, storageService: StorageService) {
    this.locationService = locationService;
    this.storageService = storageService;
  }

  /**
   * Start a new workout session.
   * @param activityType The type of activity (walk, run, bike)
   * @returns Promise that resolves when the workout has started
   */
  async startWorkout(activityType: ActivityType): Promise<WorkoutSession> {
    if (this.currentSession && this.currentSession.state !== WorkoutState.STOPPED) {
      throw new Error('A workout is already in progress');
    }

    const config = this.activityConfigs[activityType];
    const sessionId = `workout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const startTime = new Date();

    // Create new session
    this.currentSession = {
      id: sessionId,
      type: activityType,
      state: WorkoutState.ACTIVE,
      startTime,
      gpsPoints: [],
      stats: this.createInitialStats(),
      totalPausedDuration: 0
    };

    try {
      // Start location tracking with activity-specific configuration
      await this.locationService.startTracking({
        updateInterval: config.gpsUpdateInterval * 1000, // Convert to milliseconds
        distanceFilter: config.distanceFilter,
        highAccuracy: true,
        backgroundTracking: true,
        useKalmanFilter: true
      });

      // Subscribe to location updates
      this.locationUnsubscribe = this.locationService.subscribeToLocationUpdates(
        this.handleLocationUpdate.bind(this)
      );

      // Start stats update interval
      this.startStatsUpdateInterval();

      this.lastLocationUpdate = new Date();

      return this.currentSession;
    } catch (error) {
      // Clean up if starting fails
      this.currentSession = null;
      throw new Error(`Failed to start workout: ${error}`);
    }
  }

  /**
   * Pause the current workout session.
   * @returns Promise that resolves when the workout is paused
   */
  async pauseWorkout(): Promise<void> {
    if (!this.currentSession || this.currentSession.state !== WorkoutState.ACTIVE) {
      throw new Error('No active workout to pause');
    }

    this.currentSession.state = WorkoutState.PAUSED;
    this.currentSession.pausedTime = new Date();

    // Stop location tracking while paused
    await this.locationService.stopTracking();
    
    // Unsubscribe from location updates
    if (this.locationUnsubscribe) {
      this.locationUnsubscribe();
      this.locationUnsubscribe = null;
    }

    // Stop stats updates while paused
    this.stopStatsUpdateInterval();
  }

  /**
   * Resume a paused workout session.
   * @returns Promise that resolves when the workout is resumed
   */
  async resumeWorkout(): Promise<void> {
    if (!this.currentSession || this.currentSession.state !== WorkoutState.PAUSED) {
      throw new Error('No paused workout to resume');
    }

    const resumeTime = new Date();
    
    // Calculate paused duration
    if (this.currentSession.pausedTime) {
      const pausedDuration = (resumeTime.getTime() - this.currentSession.pausedTime.getTime()) / 1000;
      this.currentSession.totalPausedDuration += pausedDuration;
    }

    this.currentSession.state = WorkoutState.ACTIVE;
    this.currentSession.resumedTime = resumeTime;
    this.currentSession.pausedTime = undefined;

    const config = this.activityConfigs[this.currentSession.type];

    try {
      // Restart location tracking
      await this.locationService.startTracking({
        updateInterval: config.gpsUpdateInterval * 1000,
        distanceFilter: config.distanceFilter,
        highAccuracy: true,
        backgroundTracking: true,
        useKalmanFilter: true
      });

      // Resubscribe to location updates
      this.locationUnsubscribe = this.locationService.subscribeToLocationUpdates(
        this.handleLocationUpdate.bind(this)
      );

      // Restart stats updates
      this.startStatsUpdateInterval();

      this.lastLocationUpdate = new Date();
    } catch (error) {
      throw new Error(`Failed to resume workout: ${error}`);
    }
  }

  /**
   * Stop the current workout session and save it.
   * @returns Promise that resolves with the completed workout
   */
  async stopWorkout(): Promise<Workout> {
    if (!this.currentSession) {
      throw new Error('No workout session to stop');
    }

    const endTime = new Date();
    
    // If workout was paused, add the final paused duration
    if (this.currentSession.state === WorkoutState.PAUSED && this.currentSession.pausedTime) {
      const finalPausedDuration = (endTime.getTime() - this.currentSession.pausedTime.getTime()) / 1000;
      this.currentSession.totalPausedDuration += finalPausedDuration;
    }

    this.currentSession.state = WorkoutState.STOPPED;

    // Stop location tracking
    await this.locationService.stopTracking();
    
    // Clean up subscriptions and intervals
    if (this.locationUnsubscribe) {
      this.locationUnsubscribe();
      this.locationUnsubscribe = null;
    }
    this.stopStatsUpdateInterval();

    // Calculate final statistics
    this.updateWorkoutStats();

    // Create the final workout object
    const totalDuration = (endTime.getTime() - this.currentSession.startTime.getTime()) / 1000;
    const activeDuration = totalDuration - this.currentSession.totalPausedDuration;

    const workout: Workout = {
      id: this.currentSession.id,
      type: this.currentSession.type,
      startTime: this.currentSession.startTime,
      endTime,
      distance: this.currentSession.stats.distance,
      duration: activeDuration, // Store only active duration
      avgPace: this.currentSession.stats.averagePace,
      maxSpeed: this.currentSession.stats.maxSpeed,
      calories: this.currentSession.stats.calories,
      gpsPoints: this.currentSession.gpsPoints
    };

    // Save the workout
    await this.storageService.saveWorkout(workout);

    // Clear current session
    const completedWorkout = workout;
    this.currentSession = null;

    return completedWorkout;
  }

  /**
   * Get the current workout session.
   * @returns Current workout session or null if no active session
   */
  getCurrentSession(): WorkoutSession | null {
    return this.currentSession;
  }

  /**
   * Get current workout statistics.
   * @returns Current workout stats or null if no active session
   */
  getCurrentStats(): WorkoutStats | null {
    return this.currentSession?.stats || null;
  }

  /**
   * Check if there's an active workout.
   * @returns True if there's an active or paused workout
   */
  isWorkoutActive(): boolean {
    return this.currentSession !== null && 
           this.currentSession.state !== WorkoutState.STOPPED;
  }

  /**
   * Get activity configuration for a specific activity type.
   * @param activityType The activity type
   * @returns Activity configuration
   */
  getActivityConfig(activityType: ActivityType): ActivityConfig {
    return this.activityConfigs[activityType];
  }

  /**
   * Handle location updates from the LocationService.
   * @param location New location point
   */
  private handleLocationUpdate(location: LocationPoint): void {
    if (!this.currentSession || this.currentSession.state !== WorkoutState.ACTIVE) {
      return;
    }

    const config = this.activityConfigs[this.currentSession.type];
    
    // Filter out locations with poor accuracy or unreasonable speeds
    if (location.accuracy > 50) { // Reject locations with accuracy worse than 50m
      return;
    }

    // Check for reasonable speed if we have a previous location
    if (this.currentSession.gpsPoints.length > 0) {
      const lastPoint = this.currentSession.gpsPoints[this.currentSession.gpsPoints.length - 1];
      const speed = calculateSpeed(lastPoint, location);
      
      if (speed > config.maxReasonableSpeed) {
        return; // Reject unreasonable speeds
      }
    }

    // Add the location point
    this.currentSession.gpsPoints.push(location);
    this.lastLocationUpdate = new Date();

    // Update statistics
    this.updateWorkoutStats();
  }

  /**
   * Update workout statistics based on current GPS points.
   */
  private updateWorkoutStats(): void {
    if (!this.currentSession) {
      return;
    }

    const points = this.currentSession.gpsPoints;
    const config = this.activityConfigs[this.currentSession.type];
    
    // Calculate total distance
    const distance = this.locationService.calculateTotalDistance(points);
    
    // Calculate durations
    const now = new Date();
    const totalDuration = (now.getTime() - this.currentSession.startTime.getTime()) / 1000;
    const activeDuration = totalDuration - this.currentSession.totalPausedDuration;
    
    // Calculate current speed and pace
    let currentSpeed = 0;
    let currentPace = 0;
    
    if (points.length >= 2) {
      const lastPoint = points[points.length - 1];
      const secondLastPoint = points[points.length - 2];
      currentSpeed = calculateSpeed(secondLastPoint, lastPoint);
      
      if (currentSpeed > config.minSpeed) {
        currentPace = 1000 / currentSpeed; // seconds per km
      }
    }
    
    // Calculate average pace
    let averagePace = 0;
    if (distance > 0 && activeDuration > 0) {
      const distanceInKm = distance / 1000;
      averagePace = activeDuration / distanceInKm; // seconds per km
    }
    
    // Calculate max speed
    let maxSpeed = this.currentSession.stats.maxSpeed;
    if (currentSpeed > maxSpeed) {
      maxSpeed = currentSpeed;
    }
    
    // Estimate calories
    let calories: number | undefined;
    if (config.caloriesPerKm && distance > 0) {
      const distanceInKm = distance / 1000;
      calories = Math.round(distanceInKm * config.caloriesPerKm);
    }
    
    // Update stats
    this.currentSession.stats = {
      distance,
      duration: totalDuration,
      activeDuration,
      currentPace,
      averagePace,
      currentSpeed,
      maxSpeed,
      calories
    };
  }

  /**
   * Create initial workout statistics.
   * @returns Initial WorkoutStats object
   */
  private createInitialStats(): WorkoutStats {
    return {
      distance: 0,
      duration: 0,
      activeDuration: 0,
      currentPace: 0,
      averagePace: 0,
      currentSpeed: 0,
      maxSpeed: 0,
      calories: 0
    };
  }

  /**
   * Start the statistics update interval.
   */
  private startStatsUpdateInterval(): void {
    this.stopStatsUpdateInterval(); // Clear any existing interval
    
    // Update stats every second
    this.statsUpdateInterval = setInterval(() => {
      this.updateWorkoutStats();
    }, 1000);
  }

  /**
   * Stop the statistics update interval.
   */
  private stopStatsUpdateInterval(): void {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }
  }
}
