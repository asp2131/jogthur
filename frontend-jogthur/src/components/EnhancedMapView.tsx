import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform, Text, TouchableOpacity } from 'react-native';
import MapView, { 
  Polyline, 
  Marker, 
  Region, 
  LatLng, 
  MapPressEvent,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT
} from 'expo-maps';
import { LocationPoint, ActivityType } from '../models';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Map tile cache configuration
 */
interface TileCacheConfig {
  maxCacheSize: number; // in MB
  maxAge: number; // in days
  preloadRadius: number; // in meters
}

/**
 * Route segment for progressive loading
 */
interface RouteSegment {
  coordinates: LatLng[];
  timestamp: Date;
  distance: number;
  speed: number;
}

/**
 * Enhanced map statistics
 */
interface MapStatistics {
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  routePoints: number;
}

/**
 * Enhanced WorkoutMapView component props
 */
interface EnhancedMapViewProps {
  /**
   * Array of GPS points representing the workout route
   */
  routePoints: LocationPoint[];
  
  /**
   * Current user location
   */
  currentLocation?: LocationPoint;
  
  /**
   * Activity type for styling
   */
  activityType: ActivityType;
  
  /**
   * Whether to show the user's current location
   */
  showUserLocation?: boolean;
  
  /**
   * Whether to follow the user's location
   */
  followUserLocation?: boolean;
  
  /**
   * Map theme
   */
  mapTheme?: 'standard' | 'dark' | 'satellite';
  
  /**
   * Whether to show zoom controls
   */
  showZoomControls?: boolean;
  
  /**
   * Whether to show route statistics
   */
  showStatistics?: boolean;
  
  /**
   * Tile cache configuration
   */
  cacheConfig?: TileCacheConfig;
  
  /**
   * Whether to enable route animation
   */
  enableRouteAnimation?: boolean;
  
  /**
   * Route animation speed (1 = normal, 2 = 2x speed, etc.)
   */
  animationSpeed?: number;
  
  /**
   * Callback when map is pressed
   */
  onMapPress?: (coordinate: LatLng) => void;
  
  /**
   * Callback when user location marker is pressed
   */
  onUserLocationPress?: () => void;
  
  /**
   * Callback when route segment is completed
   */
  onRouteSegmentComplete?: (segment: RouteSegment) => void;
  
  /**
   * Component width
   */
  width?: number;
  
  /**
   * Component height
   */
  height?: number;
}

/**
 * Enhanced WorkoutMapView with advanced features
 */
export const EnhancedMapView: React.FC<EnhancedMapViewProps> = ({
  routePoints,
  currentLocation,
  activityType,
  showUserLocation = true,
  followUserLocation = true,
  mapTheme = 'standard',
  showZoomControls = true,
  showStatistics = false,
  cacheConfig = {
    maxCacheSize: 100, // 100MB
    maxAge: 30, // 30 days
    preloadRadius: 1000 // 1km
  },
  enableRouteAnimation = false,
  animationSpeed = 1,
  onMapPress,
  onUserLocationPress,
  onRouteSegmentComplete,
  width = screenWidth,
  height = screenHeight * 0.5
}) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [animatedRoutePoints, setAnimatedRoutePoints] = useState<LocationPoint[]>([]);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [mapStatistics, setMapStatistics] = useState<MapStatistics>({
    totalDistance: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    elevationGain: 0,
    routePoints: 0
  });
  
  const animationProgress = useRef(new Animated.Value(0)).current;
  const userLocationAnimation = useRef(new Animated.ValueXY()).current;
  
  // Route style based on activity type with enhanced styling
  const routeStyle = useMemo(() => {
    const baseStyle = {
      walk: {
        strokeColor: '#00D4AA',
        strokeWidth: 6,
        gradientColors: ['#00D4AA', '#007991'],
        shadowColor: 'rgba(0, 212, 170, 0.5)'
      },
      run: {
        strokeColor: '#FF6B35',
        strokeWidth: 8,
        gradientColors: ['#FF6B35', '#E94560'],
        shadowColor: 'rgba(255, 107, 53, 0.5)'
      },
      bike: {
        strokeColor: '#C724B1',
        strokeWidth: 10,
        gradientColors: ['#C724B1', '#8E44AD'],
        shadowColor: 'rgba(199, 36, 177, 0.5)'
      }
    };
    
    return baseStyle[activityType] || baseStyle.run;
  }, [activityType]);
  
  // Convert LocationPoints to LatLng coordinates
  const routeCoordinates = useMemo(() => {
    const points = enableRouteAnimation ? animatedRoutePoints : routePoints;
    return points.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude
    }));
  }, [routePoints, animatedRoutePoints, enableRouteAnimation]);
  
  // Calculate route statistics
  const calculateStatistics = useCallback((points: LocationPoint[]): MapStatistics => {
    if (points.length < 2) {
      return {
        totalDistance: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        elevationGain: 0,
        routePoints: points.length
      };
    }
    
    let totalDistance = 0;
    let maxSpeed = 0;
    let elevationGain = 0;
    let totalTime = 0;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Calculate distance using Haversine formula
      const R = 6371e3; // Earth's radius in meters
      const φ1 = prev.latitude * Math.PI / 180;
      const φ2 = curr.latitude * Math.PI / 180;
      const Δφ = (curr.latitude - prev.latitude) * Math.PI / 180;
      const Δλ = (curr.longitude - prev.longitude) * Math.PI / 180;
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
      
      // Calculate speed
      const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000; // seconds
      if (timeDiff > 0) {
        const speed = distance / timeDiff; // m/s
        maxSpeed = Math.max(maxSpeed, speed);
        totalTime += timeDiff;
      }
      
      // Calculate elevation gain
      if (prev.altitude && curr.altitude) {
        const elevationDiff = curr.altitude - prev.altitude;
        if (elevationDiff > 0) {
          elevationGain += elevationDiff;
        }
      }
    }
    
    const averageSpeed = totalTime > 0 ? totalDistance / totalTime : 0;
    
    return {
      totalDistance,
      averageSpeed,
      maxSpeed,
      elevationGain,
      routePoints: points.length
    };
  }, []);
  
  // Update statistics when route points change
  useEffect(() => {
    const stats = calculateStatistics(routePoints);
    setMapStatistics(stats);
  }, [routePoints, calculateStatistics]);
  
  // Route animation effect
  useEffect(() => {
    if (enableRouteAnimation && routePoints.length > 0) {
      const animateRoute = () => {
        animationProgress.setValue(0);
        
        Animated.timing(animationProgress, {
          toValue: 1,
          duration: (routePoints.length * 100) / animationSpeed, // 100ms per point by default
          useNativeDriver: false
        }).start();
      };
      
      // Listen to animation progress
      const listener = animationProgress.addListener(({ value }) => {
        const pointIndex = Math.floor(value * (routePoints.length - 1));
        const newAnimatedPoints = routePoints.slice(0, pointIndex + 1);
        setAnimatedRoutePoints(newAnimatedPoints);
      });
      
      animateRoute();
      
      return () => {
        animationProgress.removeListener(listener);
      };
    } else {
      setAnimatedRoutePoints(routePoints);
    }
  }, [routePoints, enableRouteAnimation, animationSpeed, animationProgress]);
  
  // Create route segments for progressive loading
  useEffect(() => {
    if (routePoints.length > 1) {
      const segments: RouteSegment[] = [];
      const segmentSize = 50; // Points per segment
      
      for (let i = 0; i < routePoints.length; i += segmentSize) {
        const segmentPoints = routePoints.slice(i, i + segmentSize);
        if (segmentPoints.length > 1) {
          const coordinates = segmentPoints.map(p => ({
            latitude: p.latitude,
            longitude: p.longitude
          }));
          
          const stats = calculateStatistics(segmentPoints);
          
          segments.push({
            coordinates,
            timestamp: segmentPoints[0].timestamp,
            distance: stats.totalDistance,
            speed: stats.averageSpeed
          });
        }
      }
      
      setRouteSegments(segments);
    }
  }, [routePoints, calculateStatistics]);
  
  // Calculate initial region
  const calculateInitialRegion = useCallback((): Region | null => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };
    }
    
    if (routePoints.length === 0) return null;
    
    if (routePoints.length === 1) {
      const point = routePoints[0];
      return {
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };
    }
    
    // Calculate bounds
    const latitudes = routePoints.map(p => p.latitude);
    const longitudes = routePoints.map(p => p.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    const latDelta = Math.max(maxLat - minLat, 0.01) * 1.3;
    const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.3;
    
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta
    };
  }, [routePoints, currentLocation]);
  
  // Initialize region
  useEffect(() => {
    const initialRegion = calculateInitialRegion();
    if (initialRegion && !region) {
      setRegion(initialRegion);
    }
  }, [calculateInitialRegion, region]);
  
  // Animate user location
  useEffect(() => {
    if (currentLocation) {
      Animated.timing(userLocationAnimation, {
        toValue: {
          x: currentLocation.latitude,
          y: currentLocation.longitude
        },
        duration: 1000,
        useNativeDriver: false
      }).start();
    }
  }, [currentLocation, userLocationAnimation]);
  
  // Handle map ready
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);
  
  // Zoom controls
  const zoomIn = useCallback(() => {
    if (region && mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 0.5,
        longitudeDelta: region.longitudeDelta * 0.5
      };
      mapRef.current.animateToRegion(newRegion, 300);
      setRegion(newRegion);
    }
  }, [region]);
  
  const zoomOut = useCallback(() => {
    if (region && mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2
      };
      mapRef.current.animateToRegion(newRegion, 300);
      setRegion(newRegion);
    }
  }, [region]);
  
  const centerOnUser = useCallback(() => {
    if (currentLocation && mapRef.current) {
      const newRegion: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };
      mapRef.current.animateToRegion(newRegion, 500);
      setRegion(newRegion);
    }
  }, [currentLocation]);
  
  const fitToRoute = useCallback(() => {
    const newRegion = calculateInitialRegion();
    if (newRegion && mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 500);
      setRegion(newRegion);
    }
  }, [calculateInitialRegion]);
  
  if (!region) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { width, height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={region}
        onMapReady={handleMapReady}
        onPress={onMapPress}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={false}
        pitchEnabled={false}
        cacheEnabled={true}
        loadingEnabled={true}
        loadingIndicatorColor={routeStyle.strokeColor}
      >
        {/* Render route segments for better performance */}
        {routeSegments.map((segment, index) => (
          <Polyline
            key={`segment-${index}`}
            coordinates={segment.coordinates}
            strokeColor={routeStyle.strokeColor}
            strokeWidth={routeStyle.strokeWidth}
            lineCap="round"
            lineJoin="round"
            geodesic={true}
          />
        ))}
        
        {/* Start Point */}
        {routeCoordinates.length > 0 && (
          <Marker
            coordinate={routeCoordinates[0]}
            title="Start"
            description="Workout started here"
          >
            <View style={[styles.startMarker, { backgroundColor: routeStyle.strokeColor }]}>
              <Text style={styles.markerText}>S</Text>
            </View>
          </Marker>
        )}
        
        {/* Current Location */}
        {showUserLocation && currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude
            }}
            title="You are here"
            description={`Speed: ${(currentLocation.speed || 0).toFixed(1)} m/s`}
            onPress={onUserLocationPress}
          >
            <View style={[styles.userMarker, { backgroundColor: routeStyle.strokeColor }]}>
              <View style={styles.userMarkerInner} />
              <View style={[styles.userMarkerPulse, { backgroundColor: routeStyle.strokeColor }]} />
            </View>
          </Marker>
        )}
      </MapView>
      
      {/* Statistics Overlay */}
      {showStatistics && (
        <View style={styles.statisticsOverlay}>
          <Text style={styles.statisticsTitle}>Route Stats</Text>
          <Text style={styles.statisticsText}>
            Distance: {(mapStatistics.totalDistance / 1000).toFixed(2)} km
          </Text>
          <Text style={styles.statisticsText}>
            Avg Speed: {(mapStatistics.averageSpeed * 3.6).toFixed(1)} km/h
          </Text>
          <Text style={styles.statisticsText}>
            Max Speed: {(mapStatistics.maxSpeed * 3.6).toFixed(1)} km/h
          </Text>
          <Text style={styles.statisticsText}>
            Points: {mapStatistics.routePoints}
          </Text>
        </View>
      )}
      
      {/* Zoom Controls */}
      {showZoomControls && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
            <Text style={styles.controlButtonText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
            <Text style={styles.controlButtonText}>📍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={fitToRoute}>
            <Text style={styles.controlButtonText}>🗺️</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0'
  },
  map: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0'
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500'
  },
  startMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  markerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff'
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.3
  },
  statisticsOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    minWidth: 150
  },
  statisticsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333333'
  },
  statisticsText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'column',
    gap: 8
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333'
  }
});

export default EnhancedMapView;
