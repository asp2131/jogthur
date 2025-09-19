import { Workout, UserPreferences } from '../models';

/**
 * Interface for storage service.
 */
export interface StorageService {
  /**
   * Save a workout to storage.
   * @param workout The workout to save.
   * @returns A promise that resolves when the workout is saved.
   */
  saveWorkout(workout: Workout): Promise<void>;
  
  /**
   * Get a workout by ID.
   * @param id The ID of the workout to get.
   * @returns A promise that resolves with the workout or null if not found.
   */
  getWorkout(id: string): Promise<Workout | null>;
  
  /**
   * Get all workouts.
   * @param options Optional filtering and sorting options.
   * @returns A promise that resolves with an array of workouts.
   */
  getAllWorkouts(options?: WorkoutQueryOptions): Promise<Workout[]>;
  
  /**
   * Delete a workout by ID.
   * @param id The ID of the workout to delete.
   * @returns A promise that resolves with a boolean indicating success.
   */
  deleteWorkout(id: string): Promise<boolean>;
  
  /**
   * Delete multiple workouts by IDs.
   * @param ids Array of workout IDs to delete.
   * @returns A promise that resolves with the number of workouts deleted.
   */
  deleteMultipleWorkouts(ids: string[]): Promise<number>;
  
  /**
   * Get workout statistics.
   * @param options Optional filtering options.
   * @returns A promise that resolves with workout statistics.
   */
  getWorkoutStatistics(options?: WorkoutQueryOptions): Promise<WorkoutStatistics>;
  
  /**
   * Save user preferences.
   * @param preferences The user preferences to save.
   * @returns A promise that resolves when the preferences are saved.
   */
  saveUserPreferences(preferences: UserPreferences): Promise<void>;
  
  /**
   * Get user preferences.
   * @returns A promise that resolves with the user preferences.
   */
  getUserPreferences(): Promise<UserPreferences>;
  
  /**
   * Export workouts to a specific format.
   * @param workoutIds Array of workout IDs to export (all if not specified).
   * @param format The export format.
   * @returns A promise that resolves with the exported data.
   */
  exportWorkouts(workoutIds?: string[], format?: ExportFormat): Promise<string>;
  
  /**
   * Import workouts from external data.
   * @param data The data to import.
   * @param format The format of the import data.
   * @returns A promise that resolves with the number of workouts imported.
   */
  importWorkouts(data: string, format: ExportFormat): Promise<number>;
  
  /**
   * Clear all storage data.
   * @returns A promise that resolves when all data is cleared.
   */
  clearAllData(): Promise<void>;
  
  /**
   * Get the storage usage information.
   * @returns A promise that resolves with storage usage information.
   */
  getStorageUsage(): Promise<StorageUsage>;
}

/**
 * Options for querying workouts.
 */
export interface WorkoutQueryOptions {
  /**
   * Filter by activity type.
   */
  activityType?: string;
  
  /**
   * Filter by start date (inclusive).
   */
  startDate?: Date;
  
  /**
   * Filter by end date (inclusive).
   */
  endDate?: Date;
  
  /**
   * Sort by field.
   */
  sortBy?: 'startTime' | 'endTime' | 'distance' | 'duration';
  
  /**
   * Sort direction.
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Limit the number of results.
   */
  limit?: number;
  
  /**
   * Skip a number of results (for pagination).
   */
  skip?: number;
}

/**
 * Workout statistics.
 */
export interface WorkoutStatistics {
  /**
   * Total number of workouts.
   */
  totalCount: number;
  
  /**
   * Total distance in meters.
   */
  totalDistance: number;
  
  /**
   * Total duration in seconds.
   */
  totalDuration: number;
  
  /**
   * Average distance per workout in meters.
   */
  averageDistance: number;
  
  /**
   * Average duration per workout in seconds.
   */
  averageDuration: number;
  
  /**
   * Longest workout distance in meters.
   */
  longestDistance: number;
  
  /**
   * Longest workout duration in seconds.
   */
  longestDuration: number;
  
  /**
   * Statistics broken down by activity type.
   */
  byActivityType: {
    [key: string]: {
      count: number;
      totalDistance: number;
      totalDuration: number;
    };
  };
}

/**
 * Export format for workouts.
 */
export type ExportFormat = 'json' | 'gpx' | 'csv';

/**
 * Storage usage information.
 */
export interface StorageUsage {
  /**
   * Total storage used in bytes.
   */
  totalBytes: number;
  
  /**
   * Number of workouts stored.
   */
  workoutCount: number;
  
  /**
   * Number of GPS points stored.
   */
  gpsPointCount: number;
}
