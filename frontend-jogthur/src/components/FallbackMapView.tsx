import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LocationPoint, ActivityType } from '../models';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Fallback MapView component props (same interface as WorkoutMapView)
 */
interface FallbackMapViewProps {
  routePoints: LocationPoint[];
  currentLocation?: LocationPoint;
  activityType: ActivityType;
  showUserLocation?: boolean;
  followUserLocation?: boolean;
  mapTheme?: 'standard' | 'dark' | 'satellite';
  showZoomControls?: boolean;
  enableOfflineCache?: boolean;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onUserLocationPress?: () => void;
  width?: number;
  height?: number;
}

/**
 * Get activity color scheme
 */
const getActivityColors = (activityType: ActivityType) => {
  switch (activityType) {
    case 'walk':
      return { primary: '#00D4AA', secondary: '#007991' };
    case 'run':
      return { primary: '#FF6B35', secondary: '#E94560' };
    case 'bike':
      return { primary: '#C724B1', secondary: '#8E44AD' };
    default:
      return { primary: '#FF6B35', secondary: '#E94560' };
  }
};

/**
 * Simple route visualization using SVG-like drawing
 */
const RouteVisualization: React.FC<{
  routePoints: LocationPoint[];
  currentLocation?: LocationPoint;
  colors: { primary: string; secondary: string };
  width: number;
  height: number;
}> = ({ routePoints, currentLocation, colors, width, height }) => {
  const routeData = useMemo(() => {
    if (routePoints.length === 0) return null;

    // Calculate bounds
    const lats = routePoints.map(p => p.latitude);
    const lngs = routePoints.map(p => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    // Convert to screen coordinates
    const padding = 40;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;

    const points = routePoints.map(point => ({
      x: padding + ((point.longitude - minLng) / lngRange) * drawWidth,
      y: padding + ((maxLat - point.latitude) / latRange) * drawHeight
    }));

    return { points, bounds: { minLat, maxLat, minLng, maxLng } };
  }, [routePoints, width, height]);

  if (!routeData || routeData.points.length === 0) {
    return (
      <View style={styles.emptyRoute}>
        <Text style={styles.emptyText}>Start your workout to see the route</Text>
      </View>
    );
  }

  return (
    <View style={styles.routeContainer}>
      {/* Route path */}
      {routeData.points.length > 1 && (
        <View style={styles.routePath}>
          {routeData.points.slice(1).map((point, index) => {
            const prevPoint = routeData.points[index];
            const length = Math.sqrt(
              Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
            );
            const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * 180 / Math.PI;

            return (
              <View
                key={index}
                style={[
                  styles.routeSegment,
                  {
                    left: prevPoint.x,
                    top: prevPoint.y,
                    width: length,
                    backgroundColor: colors.primary,
                    transform: [{ rotate: `${angle}deg` }]
                  }
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Start point */}
      {routeData.points.length > 0 && (
        <View
          style={[
            styles.startPoint,
            {
              left: routeData.points[0].x - 8,
              top: routeData.points[0].y - 8,
              backgroundColor: '#4CAF50'
            }
          ]}
        >
          <Text style={styles.pointText}>S</Text>
        </View>
      )}

      {/* Current location */}
      {currentLocation && routeData.points.length > 0 && (
        <View
          style={[
            styles.currentLocation,
            {
              left: routeData.points[routeData.points.length - 1].x - 10,
              top: routeData.points[routeData.points.length - 1].y - 10,
              backgroundColor: colors.primary
            }
          ]}
        >
          <View style={styles.currentLocationInner} />
        </View>
      )}

      {/* Route points */}
      {routeData.points.map((point, index) => (
        <View
          key={index}
          style={[
            styles.routePoint,
            {
              left: point.x - 2,
              top: point.y - 2,
              backgroundColor: colors.secondary
            }
          ]}
        />
      ))}
    </View>
  );
};

/**
 * Fallback map view component
 */
export const FallbackMapView: React.FC<FallbackMapViewProps> = ({
  routePoints,
  currentLocation,
  activityType,
  showUserLocation = true,
  width = screenWidth,
  height = screenHeight * 0.5
}) => {
  const colors = getActivityColors(activityType);

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Route Tracking</Text>
        <View style={[styles.activityIndicator, { backgroundColor: colors.primary }]}>
          <Text style={styles.activityText}>{activityType.toUpperCase()}</Text>
        </View>
      </View>

      {/* Route visualization */}
      <RouteVisualization
        routePoints={routePoints}
        currentLocation={currentLocation}
        colors={colors}
        width={width}
        height={height - 60} // Account for header
      />

      {/* Stats overlay */}
      {routePoints.length > 0 && (
        <View style={styles.statsOverlay}>
          <Text style={styles.statsText}>
            Points: {routePoints.length}
          </Text>
          {currentLocation && (
            <Text style={styles.statsText}>
              Speed: {((currentLocation.speed || 0) * 3.6).toFixed(1)} km/h
            </Text>
          )}
        </View>
      )}

      {/* Fallback notice */}
      <View style={styles.fallbackNotice}>
        <Text style={styles.fallbackText}>📍 Route Preview Mode</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    position: 'relative'
  },
  header: {
    height: 60,
    backgroundColor: '#2c3e50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  headerText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  activityIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  activityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  routeContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e8f5e8'
  },
  emptyRoute: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center'
  },
  routePath: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  routeSegment: {
    position: 'absolute',
    height: 4,
    borderRadius: 2
  },
  routePoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2
  },
  startPoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  pointText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  currentLocation: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  currentLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff'
  },
  statsOverlay: {
    position: 'absolute',
    top: 80,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8
  },
  statsText: {
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 2
  },
  fallbackNotice: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    padding: 8,
    borderRadius: 8
  },
  fallbackText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  }
});

export default FallbackMapView;
