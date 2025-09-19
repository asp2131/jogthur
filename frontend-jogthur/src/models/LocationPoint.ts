/**
 * Represents a GPS location point with coordinates, timestamp, and accuracy.
 */
export interface LocationPoint {
  /**
   * Latitude coordinate in decimal degrees.
   */
  latitude: number;
  
  /**
   * Longitude coordinate in decimal degrees.
   */
  longitude: number;
  
  /**
   * Timestamp when the location was recorded.
   */
  timestamp: Date;
  
  /**
   * GPS accuracy in meters.
   */
  accuracy: number;
  
  /**
   * Optional altitude in meters above sea level.
   */
  altitude?: number;
  
  /**
   * Optional speed in meters per second.
   */
  speed?: number;
  
  /**
   * Optional heading in degrees from true north.
   */
  heading?: number;
}
