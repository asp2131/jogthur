import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Easing,
  Dimensions
} from 'react-native';
import { ScreenTransition, useBouncySpring } from './WarioWareAnimations';
import { 
  WarioWareColors, 
  TextStyles, 
  WarioWareShadows,
  getActivityColorScheme,
  getRandomVibrantColor 
} from '../styles/WarioWareTheme';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Enhanced animated stats display props
 */
interface EnhancedAnimatedStatsDisplayProps {
  distance: number;
  duration: number;
  currentPace: number;
  averagePace: number;
  currentSpeed: number;
  calories: number;
  activityType: 'walk' | 'run' | 'bike';
  isVisible: boolean;
  celebrationTrigger?: boolean;
}

/**
 * Individual stat item component with enhanced animations
 */
interface AnimatedStatItemProps {
  label: string;
  value: number;
  unit: string;
  formatter: (value: number) => string;
  color: string;
  celebrationTrigger?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedStatItem: React.FC<AnimatedStatItemProps> = ({
  label,
  value,
  unit,
  formatter,
  color,
  celebrationTrigger = false,
  size = 'medium'
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);
  const [currentColor, setCurrentColor] = useState(color);
  
  const { springAnim, triggerBounce, resetBounce } = useBouncySpring();

  // Size configurations
  const sizeConfig = {
    small: { fontSize: 14, labelSize: 10, unitSize: 8 },
    medium: { fontSize: 18, labelSize: 12, unitSize: 10 },
    large: { fontSize: 24, labelSize: 14, unitSize: 12 }
  }[size];

  // Value animation
  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(value);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, animatedValue]);

  // Celebration animation
  useEffect(() => {
    if (celebrationTrigger) {
      // Bounce effect
      triggerBounce(1.2);
      setTimeout(() => resetBounce(), 500);

      // Color flash
      setCurrentColor(getRandomVibrantColor());
      setTimeout(() => setCurrentColor(color), 1000);

      // Scale pulse
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.elastic(1.5),
          useNativeDriver: true
        })
      ]).start();
    }
  }, [celebrationTrigger, triggerBounce, resetBounce, scaleAnim, color]);

  // Glow animation
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false
        })
      ])
    );
    
    glowAnimation.start();
    
    return () => {
      glowAnimation.stop();
    };
  }, [glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6]
  });

  return (
    <Animated.View
      style={[
        styles.statItem,
        {
          transform: [
            { scale: springAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      {/* Glow background */}
      <Animated.View
        style={[
          styles.statGlow,
          {
            backgroundColor: currentColor,
            opacity: glowOpacity
          }
        ]}
      />
      
      {/* Content */}
      <View style={styles.statContent}>
        <Text style={[styles.statLabel, { fontSize: sizeConfig.labelSize }]}>
          {label}
        </Text>
        
        <Animated.Text
          style={[
            styles.statValue,
            {
              fontSize: sizeConfig.fontSize,
              color: currentColor,
              textShadowColor: currentColor,
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3
            }
          ]}
        >
          {formatter(displayValue)}
        </Animated.Text>
        
        <Text style={[styles.statUnit, { fontSize: sizeConfig.unitSize }]}>
          {unit}
        </Text>
      </View>
    </Animated.View>
  );
};

/**
 * Enhanced animated stats display component
 */
export const EnhancedAnimatedStatsDisplay: React.FC<EnhancedAnimatedStatsDisplayProps> = ({
  distance,
  duration,
  currentPace,
  averagePace,
  currentSpeed,
  calories,
  activityType,
  isVisible,
  celebrationTrigger = false
}) => {
  const containerAnim = useRef(new Animated.Value(0)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // Get activity color scheme
  const colorScheme = getActivityColorScheme(activityType);

  // Formatters
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number): string => {
    if (pace === 0 || !isFinite(pace)) return '--:--';
    const minutes = Math.floor(pace / 60);
    const seconds = Math.floor(pace % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance: number): string => {
    return (distance / 1000).toFixed(2);
  };

  const formatSpeed = (speed: number): string => {
    return (speed * 3.6).toFixed(1);
  };

  const formatCalories = (calories: number): string => {
    return Math.round(calories).toString();
  };

  // Container animation
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      Animated.parallel([
        Animated.timing(containerAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true
        }),
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(containerAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(backgroundAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false
        })
      ]).start(() => {
        setIsAnimating(false);
      });
    }
  }, [isVisible, containerAnim, backgroundAnim]);

  // Background color animation
  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.9)']
  });

  const borderColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0)', colorScheme.primary]
  });

  if (!isVisible && !isAnimating) return null;

  return (
    <ScreenTransition isVisible={isVisible} transitionType="bounce">
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor,
            transform: [
              { scale: containerAnim },
              {
                translateY: containerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0]
                })
              }
            ]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: colorScheme.primary }]}>
            {activityType.toUpperCase()} STATS
          </Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <AnimatedStatItem
            label="DISTANCE"
            value={distance}
            unit="km"
            formatter={formatDistance}
            color={colorScheme.primary}
            celebrationTrigger={celebrationTrigger}
            size="large"
          />
          
          <AnimatedStatItem
            label="TIME"
            value={duration}
            unit=""
            formatter={formatTime}
            color={WarioWareColors.primary.blue}
            celebrationTrigger={celebrationTrigger}
            size="large"
          />
          
          <AnimatedStatItem
            label="PACE"
            value={currentPace}
            unit="min/km"
            formatter={formatPace}
            color={WarioWareColors.primary.yellow}
            celebrationTrigger={celebrationTrigger}
            size="medium"
          />
          
          <AnimatedStatItem
            label="SPEED"
            value={currentSpeed}
            unit="km/h"
            formatter={formatSpeed}
            color={WarioWareColors.primary.green}
            celebrationTrigger={celebrationTrigger}
            size="medium"
          />
          
          {calories > 0 && (
            <AnimatedStatItem
              label="CALORIES"
              value={calories}
              unit="kcal"
              formatter={formatCalories}
              color={WarioWareColors.primary.red}
              celebrationTrigger={celebrationTrigger}
              size="medium"
            />
          )}
        </View>

        {/* Activity indicator */}
        <View style={styles.activityIndicator}>
          <View
            style={[
              styles.activityDot,
              { backgroundColor: colorScheme.primary }
            ]}
          />
          <Text style={[styles.activityText, { color: colorScheme.primary }]}>
            ACTIVE
          </Text>
        </View>
      </Animated.View>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    ...WarioWareShadows.large
  },
  header: {
    alignItems: 'center',
    marginBottom: 16
  },
  headerText: {
    ...TextStyles.subtitle,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  statItem: {
    alignItems: 'center',
    minWidth: '30%',
    position: 'relative',
    padding: 8,
    borderRadius: 12
  },
  statGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    opacity: 0.2
  },
  statContent: {
    alignItems: 'center',
    zIndex: 1
  },
  statLabel: {
    ...TextStyles.label,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4
  },
  statValue: {
    ...TextStyles.stat,
    fontWeight: '900',
    marginVertical: 2,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4
  },
  statUnit: {
    ...TextStyles.label,
    fontWeight: '600',
    opacity: 0.8
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  activityText: {
    ...TextStyles.label,
    fontWeight: '700',
    letterSpacing: 1
  }
});

export default EnhancedAnimatedStatsDisplay;
