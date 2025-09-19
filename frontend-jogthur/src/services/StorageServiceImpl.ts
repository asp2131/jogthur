import { MMKV } from 'react-native-mmkv';
import { 
  StorageService, 
  WorkoutQueryOptions, 
  WorkoutStatistics, 
  ExportFormat 
} from './StorageService';
import { Workout, UserPreferences, ActivityType } from '../models';
import { validateWorkout, validateUserPreferences, createDefaultUserPreferences } from '../utils/validation';

/**
 * Implementation of the StorageService interface using MMKV.
 */
export class StorageServiceImpl implements StorageService {
  private storage: MMKV;
  private readonly WORKOUT_PREFIX = 'workout_';
  private readonly USER_PREFS_KEY = 'user_preferences';
  private readonly WORKOUT_IDS_KEY = 'workout_ids';

  constructor() {
    // Initialize MMKV storage with encryption
    this.storage = new MMKV({
      id: 'fittracker-storage',
      encryptionKey: 'fittracker-secure-storage'
    });
  }

  /**
   * Save a workout to storage.
   * @param workout The workout to save.
   * @returns A promise that resolves when the workout is saved.
   */
  async saveWorkout(workout: Workout): Promise<void> {
    // Validate workout first
    const validation = validateWorkout(workout);
    if (!validation.isValid) {
      throw new Error(`Invalid workout: ${validation.error}`);
    }

    try {
      // Store the workout with its ID as part of the key
      const key = `${this.WORKOUT_PREFIX}${workout.id}`;
      this.storage.set(key, JSON.stringify(workout));
      
      // Update the list of workout IDs
      const ids = this.getWorkoutIds();
      if (!ids.includes(workout.id)) {
        ids.push(workout.id);
        this.storage.set(this.WORKOUT_IDS_KEY, JSON.stringify(ids));
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      throw new Error(`Failed to save workout: ${error}`);
    }
  }

  /**
   * Get a workout by ID.
   * @param id The ID of the workout to get.
   * @returns A promise that resolves with the workout or null if not found.
   */
  async getWorkout(id: string): Promise<Workout | null> {
    try {
      const key = `${this.WORKOUT_PREFIX}${id}`;
      const workoutJson = this.storage.getString(key);
      
      if (!workoutJson) {
        return null;
      }
      
      const workout = JSON.parse(workoutJson) as Workout;
      
      // Convert string dates back to Date objects
      workout.startTime = new Date(workout.startTime);
      workout.endTime = new Date(workout.endTime);
      workout.gpsPoints = workout.gpsPoints.map(point => ({
        ...point,
        timestamp: new Date(point.timestamp)
      }));
      
      return workout;
    } catch (error) {
      console.error(`Error retrieving workout ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all workouts.
   * @param options Optional filtering and sorting options.
   * @returns A promise that resolves with an array of workouts.
   */
  async getAllWorkouts(options?: WorkoutQueryOptions): Promise<Workout[]> {
    try {
      const ids = this.getWorkoutIds();
      let workouts: Workout[] = [];
      
      // Retrieve all workouts
      for (const id of ids) {
        const workout = await this.getWorkout(id);
        if (workout) {
          workouts.push(workout);
        }
      }
      
      // Apply filters if provided
      if (options) {
        // Filter by activity type
        if (options.activityType) {
          workouts = workouts.filter(w => w.type === options.activityType);
        }
        
        // Filter by date range
        if (options.startDate) {
          workouts = workouts.filter(w => w.startTime >= options.startDate!);
        }
        
        if (options.endDate) {
          workouts = workouts.filter(w => w.endTime <= options.endDate!);
        }
        
        // Sort workouts
        if (options.sortBy) {
          workouts.sort((a, b) => {
            let valueA: any, valueB: any;
            
            switch (options.sortBy) {
              case 'startTime':
                valueA = a.startTime.getTime();
                valueB = b.startTime.getTime();
                break;
              case 'endTime':
                valueA = a.endTime.getTime();
                valueB = b.endTime.getTime();
                break;
              case 'distance':
                valueA = a.distance;
                valueB = b.distance;
                break;
              case 'duration':
                valueA = a.duration;
                valueB = b.duration;
                break;
              default:
                valueA = a.startTime.getTime();
                valueB = b.startTime.getTime();
            }
            
            return options.sortDirection === 'asc' 
              ? valueA - valueB 
              : valueB - valueA;
          });
        } else {
          // Default sort by startTime descending (newest first)
          workouts.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        }
        
        // Apply pagination
        if (options.skip && options.skip > 0) {
          workouts = workouts.slice(options.skip);
        }
        
        if (options.limit && options.limit > 0) {
          workouts = workouts.slice(0, options.limit);
        }
      }
      
      return workouts;
    } catch (error) {
      console.error('Error retrieving all workouts:', error);
      return [];
    }
  }

  /**
   * Delete a workout by ID.
   * @param id The ID of the workout to delete.
   * @returns A promise that resolves with a boolean indicating success.
   */
  async deleteWorkout(id: string): Promise<boolean> {
    try {
      const key = `${this.WORKOUT_PREFIX}${id}`;
      
      // Check if workout exists
      if (!this.storage.contains(key)) {
        return false;
      }
      
      // Delete the workout
      this.storage.delete(key);
      
      // Update the list of workout IDs
      const ids = this.getWorkoutIds().filter(workoutId => workoutId !== id);
      this.storage.set(this.WORKOUT_IDS_KEY, JSON.stringify(ids));
      
      return true;
    } catch (error) {
      console.error(`Error deleting workout ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple workouts by IDs.
   * @param ids Array of workout IDs to delete.
   * @returns A promise that resolves with the number of workouts deleted.
   */
  async deleteMultipleWorkouts(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) {
      return 0;
    }
    
    let deletedCount = 0;
    
    for (const id of ids) {
      const deleted = await this.deleteWorkout(id);
      if (deleted) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Get workout statistics.
   * @param options Optional filtering options.
   * @returns A promise that resolves with workout statistics.
   */
  async getWorkoutStatistics(options?: WorkoutQueryOptions): Promise<WorkoutStatistics> {
    try {
      // Get filtered workouts based on options
      const workouts = await this.getAllWorkouts(options);
      
      if (workouts.length === 0) {
        return this.createEmptyStatistics();
      }
      
      // Calculate total statistics
      let totalDistance = 0;
      let totalDuration = 0;
      let longestDistance = 0;
      let longestDuration = 0;
      
      // Initialize activity type statistics
      const byActivityType: { [key: string]: { count: number; totalDistance: number; totalDuration: number } } = {};
      
      // Process each workout
      workouts.forEach(workout => {
        // Update totals
        totalDistance += workout.distance;
        totalDuration += workout.duration;
        
        // Update maximums
        longestDistance = Math.max(longestDistance, workout.distance);
        longestDuration = Math.max(longestDuration, workout.duration);
        
        // Update activity type statistics
        if (!byActivityType[workout.type]) {
          byActivityType[workout.type] = {
            count: 0,
            totalDistance: 0,
            totalDuration: 0
          };
        }
        
        byActivityType[workout.type].count++;
        byActivityType[workout.type].totalDistance += workout.distance;
        byActivityType[workout.type].totalDuration += workout.duration;
      });
      
      // Calculate averages
      const averageDistance = totalDistance / workouts.length;
      const averageDuration = totalDuration / workouts.length;
      
      return {
        totalCount: workouts.length,
        totalDistance,
        totalDuration,
        averageDistance,
        averageDuration,
        longestDistance,
        longestDuration,
        byActivityType
      };
    } catch (error) {
      console.error('Error calculating workout statistics:', error);
      return this.createEmptyStatistics();
    }
  }

  /**
   * Save user preferences.
   * @param preferences The user preferences to save.
   * @returns A promise that resolves when the preferences are saved.
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    // Validate preferences first
    const validation = validateUserPreferences(preferences);
    if (!validation.isValid) {
      throw new Error(`Invalid user preferences: ${validation.error}`);
    }
    
    try {
      this.storage.set(this.USER_PREFS_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw new Error(`Failed to save user preferences: ${error}`);
    }
  }

  /**
   * Get user preferences.
   * @returns A promise that resolves with the user preferences.
   */
  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const prefsJson = this.storage.getString(this.USER_PREFS_KEY);
      
      if (!prefsJson) {
        // Return default preferences if none are stored
        return createDefaultUserPreferences();
      }
      
      return JSON.parse(prefsJson) as UserPreferences;
    } catch (error) {
      console.error('Error retrieving user preferences:', error);
      return createDefaultUserPreferences();
    }
  }

  /**
   * Export workouts to a specific format.
   * @param workoutIds Array of workout IDs to export (all if not specified).
   * @param format The export format.
   * @returns A promise that resolves with the exported data.
   */
  async exportWorkouts(workoutIds?: string[], format: ExportFormat = 'json'): Promise<string> {
    try {
      // Get workouts to export
      let workouts: Workout[];
      
      if (workoutIds && workoutIds.length > 0) {
        // Get specific workouts
        workouts = [];
        for (const id of workoutIds) {
          const workout = await this.getWorkout(id);
          if (workout) {
            workouts.push(workout);
          }
        }
      } else {
        // Get all workouts
        workouts = await this.getAllWorkouts();
      }
      
      // Export based on format
      switch (format) {
        case 'json':
          return this.exportToJson(workouts);
        case 'gpx':
          return this.exportToGpx(workouts);
        case 'csv':
          return this.exportToCsv(workouts);
        default:
          return this.exportToJson(workouts);
      }
    } catch (error) {
      console.error('Error exporting workouts:', error);
      throw new Error(`Failed to export workouts: ${error}`);
    }
  }

  /**
   * Import workouts from external data.
   * @param data The data to import.
   * @param format The format of the import data.
   * @returns A promise that resolves with the number of workouts imported.
   */
  async importWorkouts(data: string, format: ExportFormat): Promise<number> {
    try {
      let workouts: Workout[] = [];
      
      // Parse data based on format
      switch (format) {
        case 'json':
          workouts = this.importFromJson(data);
          break;
        case 'gpx':
          workouts = this.importFromGpx(data);
          break;
        case 'csv':
          workouts = this.importFromCsv(data);
          break;
        default:
          throw new Error(`Unsupported import format: ${format}`);
      }
      
      // Validate and save each workout
      let importedCount = 0;
      
      for (const workout of workouts) {
        try {
          const validation = validateWorkout(workout);
          if (validation.isValid) {
            await this.saveWorkout(workout);
            importedCount++;
          } else {
            console.warn(`Skipping invalid workout: ${validation.error}`);
          }
        } catch (error) {
          console.warn(`Error importing workout: ${error}`);
        }
      }
      
      return importedCount;
    } catch (error) {
      console.error('Error importing workouts:', error);
      throw new Error(`Failed to import workouts: ${error}`);
    }
  }

  /**
   * Clear all storage data.
   * @returns A promise that resolves when all data is cleared.
   */
  async clearAllData(): Promise<void> {
    try {
      this.storage.clearAll();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error(`Failed to clear storage: ${error}`);
    }
  }

  /**
   * Get the storage usage information.
   * @returns A promise that resolves with storage usage information.
   */
  async getStorageUsage(): Promise<{ totalBytes: number; workoutCount: number; gpsPointCount: number }> {
    try {
      const workouts = await this.getAllWorkouts();
      let totalBytes = 0;
      let gpsPointCount = 0;
      
      // Calculate storage usage
      for (const workout of workouts) {
        const workoutJson = JSON.stringify(workout);
        totalBytes += workoutJson.length;
        gpsPointCount += workout.gpsPoints.length;
      }
      
      // Add user preferences size
      const prefsJson = this.storage.getString(this.USER_PREFS_KEY);
      if (prefsJson) {
        totalBytes += prefsJson.length;
      }
      
      return {
        totalBytes,
        workoutCount: workouts.length,
        gpsPointCount
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return {
        totalBytes: 0,
        workoutCount: 0,
        gpsPointCount: 0
      };
    }
  }

  /**
   * Get the list of workout IDs.
   * @returns Array of workout IDs.
   */
  private getWorkoutIds(): string[] {
    const idsJson = this.storage.getString(this.WORKOUT_IDS_KEY);
    return idsJson ? JSON.parse(idsJson) : [];
  }

  /**
   * Create empty workout statistics.
   * @returns Empty WorkoutStatistics object.
   */
  private createEmptyStatistics(): WorkoutStatistics {
    return {
      totalCount: 0,
      totalDistance: 0,
      totalDuration: 0,
      averageDistance: 0,
      averageDuration: 0,
      longestDistance: 0,
      longestDuration: 0,
      byActivityType: {}
    };
  }

  /**
   * Export workouts to JSON format.
   * @param workouts Array of workouts to export.
   * @returns JSON string.
   */
  private exportToJson(workouts: Workout[]): string {
    return JSON.stringify(workouts, null, 2);
  }

  /**
   * Export workouts to GPX format.
   * @param workouts Array of workouts to export.
   * @returns GPX string.
   */
  private exportToGpx(workouts: Workout[]): string {
    let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
    gpx += '<gpx version="1.1" creator="FitTracker" xmlns="http://www.topografix.com/GPX/1/1">\n';
    
    workouts.forEach(workout => {
      gpx += `  <trk>\n`;
      gpx += `    <name>${workout.name || `${workout.type} on ${workout.startTime.toLocaleDateString()}`}</name>\n`;
      gpx += `    <type>${workout.type}</type>\n`;
      gpx += `    <trkseg>\n`;
      
      workout.gpsPoints.forEach(point => {
        gpx += `      <trkpt lat="${point.latitude}" lon="${point.longitude}">\n`;
        if (point.altitude !== undefined) {
          gpx += `        <ele>${point.altitude}</ele>\n`;
        }
        gpx += `        <time>${point.timestamp.toISOString()}</time>\n`;
        gpx += `      </trkpt>\n`;
      });
      
      gpx += `    </trkseg>\n`;
      gpx += `  </trk>\n`;
    });
    
    gpx += '</gpx>';
    return gpx;
  }

  /**
   * Export workouts to CSV format.
   * @param workouts Array of workouts to export.
   * @returns CSV string.
   */
  private exportToCsv(workouts: Workout[]): string {
    let csv = 'id,type,startTime,endTime,distance,duration,avgPace,maxSpeed,calories\n';
    
    workouts.forEach(workout => {
      csv += `${workout.id},`;
      csv += `${workout.type},`;
      csv += `${workout.startTime.toISOString()},`;
      csv += `${workout.endTime.toISOString()},`;
      csv += `${workout.distance},`;
      csv += `${workout.duration},`;
      csv += `${workout.avgPace},`;
      csv += `${workout.maxSpeed},`;
      csv += `${workout.calories || ''}\n`;
    });
    
    return csv;
  }

  /**
   * Import workouts from JSON format.
   * @param data JSON string.
   * @returns Array of workouts.
   */
  private importFromJson(data: string): Workout[] {
    try {
      const parsedData = JSON.parse(data);
      
      if (!Array.isArray(parsedData)) {
        throw new Error('Invalid JSON format: expected an array of workouts');
      }
      
      return parsedData.map(workout => {
        // Convert string dates back to Date objects
        return {
          ...workout,
          startTime: new Date(workout.startTime),
          endTime: new Date(workout.endTime),
          gpsPoints: workout.gpsPoints.map((point: any) => ({
            ...point,
            timestamp: new Date(point.timestamp)
          }))
        };
      });
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error(`Invalid JSON format: ${error}`);
    }
  }

  /**
   * Import workouts from GPX format.
   * @param data GPX string.
   * @returns Array of workouts.
   */
  private importFromGpx(data: string): Workout[] {
    // This is a simplified implementation
    // In a real app, we would use a proper GPX parser
    
    try {
      const workouts: Workout[] = [];
      
      // Very basic GPX parsing using regex
      // This is not robust and should be replaced with a proper XML parser
      const trkRegex = /<trk>([\s\S]*?)<\/trk>/g;
      const nameRegex = /<name>(.*?)<\/name>/;
      const typeRegex = /<type>(.*?)<\/type>/;
      const trkptRegex = /<trkpt lat="(.*?)" lon="(.*?)">([\s\S]*?)<\/trkpt>/g;
      const eleRegex = /<ele>(.*?)<\/ele>/;
      const timeRegex = /<time>(.*?)<\/time>/;
      
      let trkMatch;
      while ((trkMatch = trkRegex.exec(data)) !== null) {
        const trkContent = trkMatch[1];
        
        // Extract track name and type
        const nameMatch = nameRegex.exec(trkContent);
        const typeMatch = typeRegex.exec(trkContent);
        
        const name = nameMatch ? nameMatch[1] : '';
        const type = typeMatch ? typeMatch[1] as ActivityType : 'walk';
        
        // Extract track points
        const gpsPoints: any[] = [];
        let trkptMatch;
        while ((trkptMatch = trkptRegex.exec(trkContent)) !== null) {
          const latitude = parseFloat(trkptMatch[1]);
          const longitude = parseFloat(trkptMatch[2]);
          const pointContent = trkptMatch[3];
          
          const eleMatch = eleRegex.exec(pointContent);
          const timeMatch = timeRegex.exec(pointContent);
          
          const altitude = eleMatch ? parseFloat(eleMatch[1]) : undefined;
          const timestamp = timeMatch ? new Date(timeMatch[1]) : new Date();
          
          gpsPoints.push({
            latitude,
            longitude,
            altitude,
            timestamp,
            accuracy: 10 // Default accuracy
          });
        }
        
        if (gpsPoints.length > 0) {
          // Create a workout from the track
          const startTime = gpsPoints[0].timestamp;
          const endTime = gpsPoints[gpsPoints.length - 1].timestamp;
          const duration = (endTime.getTime() - startTime.getTime()) / 1000;
          
          // Calculate distance (simplified)
          let distance = 0;
          for (let i = 1; i < gpsPoints.length; i++) {
            const p1 = gpsPoints[i - 1];
            const p2 = gpsPoints[i];
            
            // Simple distance calculation (not Haversine)
            const latDiff = p2.latitude - p1.latitude;
            const lonDiff = p2.longitude - p1.longitude;
            const segmentDistance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111000; // Rough conversion to meters
            
            distance += segmentDistance;
          }
          
          const avgPace = distance > 0 ? duration / (distance / 1000) : 0; // seconds per km
          const maxSpeed = 0; // Would need to calculate from points
          
          workouts.push({
            id: `imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type,
            startTime,
            endTime,
            distance,
            duration,
            avgPace,
            maxSpeed,
            gpsPoints,
            name
          });
        }
      }
      
      return workouts;
    } catch (error) {
      console.error('Error parsing GPX:', error);
      throw new Error(`Invalid GPX format: ${error}`);
    }
  }

  /**
   * Import workouts from CSV format.
   * @param data CSV string.
   * @returns Array of workouts.
   */
  private importFromCsv(data: string): Workout[] {
    try {
      const lines = data.split('\n');
      
      // Skip header row
      if (lines.length < 2) {
        return [];
      }
      
      const workouts: Workout[] = [];
      
      // Process each line (skip header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        
        if (values.length < 8) {
          console.warn(`Skipping invalid CSV line: ${line}`);
          continue;
        }
        
        const [id, type, startTimeStr, endTimeStr, distanceStr, durationStr, avgPaceStr, maxSpeedStr, caloriesStr] = values;
        
        // Basic validation
        if (!id || !type || !startTimeStr || !endTimeStr) {
          console.warn(`Skipping CSV line with missing required fields: ${line}`);
          continue;
        }
        
        // Parse values
        const startTime = new Date(startTimeStr);
        const endTime = new Date(endTimeStr);
        const distance = parseFloat(distanceStr);
        const duration = parseFloat(durationStr);
        const avgPace = parseFloat(avgPaceStr);
        const maxSpeed = parseFloat(maxSpeedStr);
        const calories = caloriesStr ? parseFloat(caloriesStr) : undefined;
        
        // Create workout (without GPS points)
        workouts.push({
          id,
          type: type as ActivityType,
          startTime,
          endTime,
          distance,
          duration,
          avgPace,
          maxSpeed,
          calories,
          gpsPoints: [] // CSV doesn't include GPS points
        });
      }
      
      return workouts;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw new Error(`Invalid CSV format: ${error}`);
    }
  }
}
