import { LocationPoint } from './LocationPoint';

/**
 * Represents the type of workout activity.
 */
export type ActivityType = 'walk' | 'run' | 'bike';

/**
 * Represents a workout session with tracking data.
 */
export interface Workout {
  /**
   * Unique identifier for the workout.
   */
  id: string;
  
  /**
   * Type of workout activity.
   */
  type: ActivityType;
  
  /**
   * Date and time when the workout started.
   */
  startTime: Date;
  
  /**
   * Date and time when the workout ended.
   */
  endTime: Date;
  
  /**
   * Total distance covered in meters.
   */
  distance: number;
  
  /**
   * Total duration in seconds.
   */
  duration: number;
  
  /**
   * Average pace in seconds per kilometer.
   */
  avgPace: number;
  
  /**
   * Maximum speed reached during the workout in meters per second.
   */
  maxSpeed: number;
  
  /**
   * Estimated calories burned during the workout.
   */
  calories?: number;
  
  /**
   * Array of GPS points recorded during the workout.
   */
  gpsPoints: LocationPoint[];
  
  /**
   * Optional notes or comments about the workout.
   */
  notes?: string;
  
  /**
   * Optional workout name or title.
   */
  name?: string;
}
