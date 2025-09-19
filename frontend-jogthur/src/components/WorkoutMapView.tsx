import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
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
 * Map style configurations for different themes
 */
const MAP_STYLES = {
  standard: [],
  dark: [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#212121" }]
    }
  ],
  satellite: []
};

/**
 * Route style configurations based on activity type
 */
const getRouteStyle = (activityType: ActivityType) => {
  switch (activityType) {
    case 'walk':
      return {
        strokeColor: '#00D4AA',
        strokeWidth: 6,
        strokePattern: [1, 0], // Solid line
        fillColor: 'rgba(0, 212, 170, 0.3)'
      };
    case 'run':
      return {
        strokeColor: '#FF6B35',
        strokeWidth: 8,
        strokePattern: [1, 0], // Solid line
        fillColor: 'rgba(255, 107, 53, 0.3)'
      };
    case 'bike':
      return {
        strokeColor: '#C724B1',
        strokeWidth: 10,
        strokePattern: [1, 0], // Solid line
        fillColor: 'rgba(199, 36, 177, 0.3)'
      };
    default:
      return {
        strokeColor: '#FF6B35',
        strokeWidth: 6,
        strokePattern: [1, 0],
        fillColor: 'rgba(255, 107, 53, 0.3)'
      };
  }
};

/**
 * WorkoutMapView component props
 */
interface WorkoutMapViewProps {
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
   * Whether to enable offline tile caching
   */
  enableOfflineCache?: boolean;
  
  /**
   * Callback when map is pressed
   */
  onMapPress?: (coordinate: LatLng) => void;
  
  /**
   * Callback when user location marker is pressed
   */
  onUserLocationPress?: () => void;
  
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
 * WorkoutMapView component for real-time route visualization
 */
export const WorkoutMapView: React.FC<WorkoutMapViewProps> = ({
  routePoints,
  currentLocation,
  activityType,
  showUserLocation = true,
  followUserLocation = true,
  mapTheme = 'standard',
  showZoomControls = true,
  enableOfflineCache = true,
  onMapPress,
  onUserLocationPress,
  width = screenWidth,
  height = screenHeight * 0.5
}) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const animatedMarkerPosition = useRef(new Animated.ValueXY()).current;
  
  // Route style based on activity type
  const routeStyle = useMemo(() => getRouteStyle(activityType), [activityType]);
  
  // Convert LocationPoints to LatLng coordinates
  const routeCoordinates = useMemo(() => {
    return routePoints.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude
    }));
  }, [routePoints]);
  
  // Calculate initial region based on route points or current location
  const calculateInitialRegion = useCallback((): Region | null => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01, // ~1km
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
    
    // Calculate bounds for multiple points
    const latitudes = routePoints.map(p => p.latitude);
    const longitudes = routePoints.map(p => p.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    const latDelta = Math.max(maxLat - minLat, 0.01) * 1.2; // Add 20% padding
    const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.2;
    
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
  
  // Follow user location
  useEffect(() => {
    if (followUserLocation && currentLocation && isMapReady && mapRef.current) {
      const newRegion: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: region?.latitudeDelta || 0.01,
        longitudeDelta: region?.longitudeDelta || 0.01
      };
      
      mapRef.current.animateToRegion(newRegion, 1000);
      setRegion(newRegion);
    }
  }, [currentLocation, followUserLocation, isMapReady, region]);
  
  // Animate user location marker
  useEffect(() => {
    if (currentLocation) {
      Animated.timing(animatedMarkerPosition, {
        toValue: {
          x: currentLocation.latitude,
          y: currentLocation.longitude
        },
        duration: 1000,
        useNativeDriver: false
      }).start();
    }
  }, [currentLocation, animatedMarkerPosition]);
  
  // Fit route to view when route changes significantly
  useEffect(() => {
    if (routePoints.length > 1 && isMapReady && mapRef.current && !followUserLocation) {
      const newRegion = calculateInitialRegion();
      if (newRegion) {
        mapRef.current.animateToRegion(newRegion, 1000);
        setRegion(newRegion);
      }
    }
  }, [routePoints.length, isMapReady, followUserLocation, calculateInitialRegion]);
  
  // Handle map ready
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);
  
  // Handle region change
  const handleRegionChange = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);
  
  // Handle map press
  const handleMapPress = useCallback((event: MapPressEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    onMapPress?.(coordinate);
  }, [onMapPress]);
  
  // Zoom to fit route
  const zoomToFitRoute = useCallback(() => {
    if (routePoints.length > 0 && isMapReady && mapRef.current) {
      const newRegion = calculateInitialRegion();
      if (newRegion) {
        mapRef.current.animateToRegion(newRegion, 1000);
        setRegion(newRegion);
      }
    }
  }, [routePoints, isMapReady, calculateInitialRegion]);
  
  // Zoom to user location
  const zoomToUserLocation = useCallback(() => {
    if (currentLocation && isMapReady && mapRef.current) {
      const newRegion: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };
      
      mapRef.current.animateToRegion(newRegion, 1000);
      setRegion(newRegion);
    }
  }, [currentLocation, isMapReady]);
  
  if (!region) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.loadingContainer}>
          {/* Loading placeholder */}
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
        onRegionChange={handleRegionChange}
        onMapReady={handleMapReady}
        onPress={handleMapPress}
        showsUserLocation={false} // We'll use custom marker
        showsMyLocationButton={false}
        showsCompass={showZoomControls}
        showsScale={showZoomControls}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={false}
        pitchEnabled={false}
        customMapStyle={MAP_STYLES[mapTheme]}
        cacheEnabled={enableOfflineCache}
        loadingEnabled={true}
        loadingIndicatorColor={routeStyle.strokeColor}
        loadingBackgroundColor="#f0f0f0"
      >
        {/* Route Polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={routeStyle.strokeColor}
            strokeWidth={routeStyle.strokeWidth}
            lineCap="round"
            lineJoin="round"
            geodesic={true}
          />
        )}
        
        {/* Start Point Marker */}
        {routeCoordinates.length > 0 && (
          <Marker
            coordinate={routeCoordinates[0]}
            title="Start"
            description="Workout start point"
            pinColor="green"
          />
        )}
        
        {/* End Point Marker (if different from current location) */}
        {routeCoordinates.length > 1 && !followUserLocation && (
          <Marker
            coordinate={routeCoordinates[routeCoordinates.length - 1]}
            title="End"
            description="Workout end point"
            pinColor="red"
          />
        )}
        
        {/* Current Location Marker */}
        {showUserLocation && currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude
            }}
            title="Current Location"
            description={`Speed: ${currentLocation.speed?.toFixed(1) || 0} m/s`}
            onPress={onUserLocationPress}
          >
            <View style={[styles.userLocationMarker, { backgroundColor: routeStyle.strokeColor }]}>
              <View style={styles.userLocationInner} />
            </View>
          </Marker>
        )}
      </MapView>
      
      {/* Zoom Controls */}
      {showZoomControls && (
        <View style={styles.zoomControls}>
          <View style={styles.zoomButton} onTouchEnd={zoomToUserLocation}>
            <View style={styles.zoomButtonInner} />
          </View>
          <View style={styles.zoomButton} onTouchEnd={zoomToFitRoute}>
            <View style={styles.zoomButtonInner} />
          </View>
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
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5
  },
  userLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff'
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'column',
    gap: 8
  },
  zoomButton: {
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
  zoomButtonInner: {
    width: 24,
    height: 24,
    backgroundColor: '#666666',
    borderRadius: 12
  }
});

export default WorkoutMapView;
