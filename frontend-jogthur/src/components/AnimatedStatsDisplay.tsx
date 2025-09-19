import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Easing
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Individual stat item props
 */
interface StatItemProps {
  label: string;
  value: number;
  unit?: string;
  formatter?: (value: number) => string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Animated stat item component
 */
const AnimatedStatItem: React.FC<StatItemProps> = ({
  label,
  value,
  unit = '',
  formatter = (v) => v.toFixed(0),
  color = '#FFFFFF',
  size = 'medium'
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);
  const [prevValue, setPrevValue] = React.useState(0);

  // Size configurations
  const sizeConfig = {
    small: { fontSize: 16, labelSize: 10, spacing: 4 },
    medium: { fontSize: 24, labelSize: 12, spacing: 6 },
    large: { fontSize: 32, labelSize: 14, spacing: 8 }
  }[size];

  useEffect(() => {
    // Animate value change
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(value);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();

    // Trigger glow effect on significant changes
    if (Math.abs(value - prevValue) > (prevValue * 0.1)) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.elastic(1.2),
          useNativeDriver: true
        })
      ]).start();

      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true
        })
      ]).start();
    }

    setPrevValue(value);

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, animatedValue, scaleAnim, glowAnim, prevValue]);

  return (
    <Animated.View
      style={[
        styles.statItem,
        {
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <Text style={[styles.statLabel, { fontSize: sizeConfig.labelSize, color }]}>
        {label.toUpperCase()}
      </Text>
      
      <View style={styles.valueContainer}>
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowAnim,
              backgroundColor: color
            }
          ]}
        />
        
        <Text style={[styles.statValue, { fontSize: sizeConfig.fontSize, color }]}>
          {formatter(displayValue)}
        </Text>
        
        {unit && (
          <Text style={[styles.statUnit, { fontSize: sizeConfig.labelSize, color }]}>
            {unit}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

/**
 * Animated stats display props
 */
interface AnimatedStatsDisplayProps {
  /**
   * Statistics data
   */
  stats: {
    distance: number;
    duration: number;
    currentPace: number;
    averagePace: number;
    currentSpeed: number;
    calories?: number;
  };
  
  /**
   * Activity type for theming
   */
  activityType: 'walk' | 'run' | 'bike';
  
  /**
   * Whether to show all stats or compact view
   */
  compact?: boolean;
  
  /**
   * Custom color scheme
   */
  colorScheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/**
 * Get color scheme based on activity type
 */
const getActivityColors = (activityType: string) => {
  switch (activityType) {
    case 'walk':
      return {
        primary: '#00D4AA',
        secondary: '#007991',
        accent: '#FFD700'
      };
    case 'run':
      return {
        primary: '#FF6B35',
        secondary: '#E94560',
        accent: '#FFFFFF'
      };
    case 'bike':
      return {
        primary: '#C724B1',
        secondary: '#8E44AD',
        accent: '#F39C12'
      };
    default:
      return {
        primary: '#FF6B35',
        secondary: '#E94560',
        accent: '#FFFFFF'
      };
  }
};

/**
 * Format time in MM:SS or HH:MM:SS format
 */
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format pace in MM:SS format
 */
const formatPace = (pace: number): string => {
  if (pace === 0 || !isFinite(pace)) return '--:--';
  const minutes = Math.floor(pace / 60);
  const seconds = Math.floor(pace % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format distance in kilometers
 */
const formatDistance = (distance: number): string => {
  return (distance / 1000).toFixed(2);
};

/**
 * Format speed in km/h
 */
const formatSpeed = (speed: number): string => {
  return (speed * 3.6).toFixed(1);
};

/**
 * Animated statistics display component
 */
export const AnimatedStatsDisplay: React.FC<AnimatedStatsDisplayProps> = ({
  stats,
  activityType,
  compact = false,
  colorScheme
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = colorScheme || getActivityColors(activityType);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      })
    ]).start();
  }, [slideAnim, fadeAnim]);

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim
          }
        ]}
      >
        <View style={styles.compactRow}>
          <AnimatedStatItem
            label="Distance"
            value={stats.distance}
            unit="km"
            formatter={formatDistance}
            color={colors.primary}
            size="small"
          />
          <AnimatedStatItem
            label="Time"
            value={stats.duration}
            formatter={formatTime}
            color={colors.secondary}
            size="small"
          />
          <AnimatedStatItem
            label="Pace"
            value={stats.currentPace}
            unit="min/km"
            formatter={formatPace}
            color={colors.accent}
            size="small"
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}
    >
      <View style={styles.primaryStats}>
        <AnimatedStatItem
          label="Distance"
          value={stats.distance}
          unit="km"
          formatter={formatDistance}
          color={colors.primary}
          size="large"
        />
        <AnimatedStatItem
          label="Time"
          value={stats.duration}
          formatter={formatTime}
          color={colors.primary}
          size="large"
        />
      </View>

      <View style={styles.secondaryStats}>
        <AnimatedStatItem
          label="Current Pace"
          value={stats.currentPace}
          unit="min/km"
          formatter={formatPace}
          color={colors.secondary}
          size="medium"
        />
        <AnimatedStatItem
          label="Avg Pace"
          value={stats.averagePace}
          unit="min/km"
          formatter={formatPace}
          color={colors.secondary}
          size="medium"
        />
        <AnimatedStatItem
          label="Speed"
          value={stats.currentSpeed}
          unit="km/h"
          formatter={formatSpeed}
          color={colors.secondary}
          size="medium"
        />
      </View>

      {stats.calories && stats.calories > 0 && (
        <View style={styles.tertiaryStats}>
          <AnimatedStatItem
            label="Calories"
            value={stats.calories}
            unit="kcal"
            formatter={(v) => Math.round(v).toString()}
            color={colors.accent}
            size="medium"
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  compactContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
    margin: 8
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  primaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12
  },
  tertiaryStats: {
    alignItems: 'center'
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80
  },
  statLabel: {
    fontWeight: '600',
    opacity: 0.8,
    marginBottom: 4
  },
  valueContainer: {
    position: 'relative',
    alignItems: 'center'
  },
  statValue: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  statUnit: {
    opacity: 0.7,
    marginTop: 2
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -8,
    right: -8,
    bottom: -4,
    borderRadius: 8,
    opacity: 0.3
  }
});

export default AnimatedStatsDisplay;
