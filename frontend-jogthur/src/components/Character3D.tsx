import React, { useEffect, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Group,
  Circle,
  RoundedRect,
  Skia,
  useValue,
  useTouchHandler,
  TouchInfo,
  runTiming,
  Easing
} from '@shopify/react-native-skia';
import { ActivityType } from '../models';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Character animation states
 */
export enum AnimationState {
  IDLE = 'idle',
  WALKING = 'walking',
  RUNNING = 'running',
  CYCLING = 'cycling',
  CELEBRATING = 'celebrating'
}

/**
 * Character3D component props
 */
interface Character3DProps {
  /**
   * Current activity type
   */
  activityType: ActivityType;
  
  /**
   * Current speed in m/s
   */
  currentSpeed: number;
  
  /**
   * Whether to trigger celebration animation
   */
  celebrationTrigger?: boolean;
  
  /**
   * Callback when character is tapped
   */
  onCharacterTap?: () => void;
  
  /**
   * Component width (defaults to screen width)
   */
  width?: number;
  
  /**
   * Component height
   */
  height?: number;
  
  /**
   * Whether animations are enabled
   */
  animationsEnabled?: boolean;
}

/**
 * Character appearance configuration based on activity type
 */
const getCharacterConfig = (activityType: ActivityType) => {
  switch (activityType) {
    case 'walk':
      return {
        primaryColor: '#00D4AA', // Bright teal
        secondaryColor: '#007991', // Darker teal
        accentColor: '#FFD700', // Gold
        accessory: 'hat', // Walking hat
        animationSpeed: 1.0
      };
    case 'run':
      return {
        primaryColor: '#FF6B35', // Vibrant orange
        secondaryColor: '#E94560', // Bright red
        accentColor: '#FFFFFF', // White
        accessory: 'headband', // Running headband
        animationSpeed: 1.5
      };
    case 'bike':
      return {
        primaryColor: '#C724B1', // Magenta
        secondaryColor: '#8E44AD', // Purple
        accentColor: '#F39C12', // Orange
        accessory: 'helmet', // Cycling helmet
        animationSpeed: 2.0
      };
    default:
      return {
        primaryColor: '#FF6B35',
        secondaryColor: '#E94560',
        accentColor: '#FFFFFF',
        accessory: 'none',
        animationSpeed: 1.0
      };
  }
};

/**
 * 3D Character component with Skia rendering
 */
export const Character3D: React.FC<Character3DProps> = ({
  activityType,
  currentSpeed,
  celebrationTrigger = false,
  onCharacterTap,
  width = screenWidth,
  height = 300,
  animationsEnabled = true
}) => {
  // Animation values
  const animationTime = useValue(0);
  const bounceOffset = useValue(0);
  const armSwing = useValue(0);
  const legSwing = useValue(0);
  const celebrationScale = useValue(1);
  const celebrationRotation = useValue(0);
  const tapScale = useValue(1);
  
  // Character configuration
  const config = useMemo(() => getCharacterConfig(activityType), [activityType]);
  
  // Determine animation state based on speed and activity
  const animationState = useMemo((): AnimationState => {
    if (celebrationTrigger) return AnimationState.CELEBRATING;
    if (currentSpeed < 0.5) return AnimationState.IDLE;
    
    switch (activityType) {
      case 'walk':
        return AnimationState.WALKING;
      case 'run':
        return AnimationState.RUNNING;
      case 'bike':
        return AnimationState.CYCLING;
      default:
        return AnimationState.IDLE;
    }
  }, [activityType, currentSpeed, celebrationTrigger]);
  
  // Animation speed based on user's actual speed
  const animationSpeed = useMemo(() => {
    const baseSpeed = config.animationSpeed;
    const speedMultiplier = Math.max(currentSpeed * 0.5, 0.5); // Minimum 0.5x speed
    return baseSpeed * speedMultiplier;
  }, [currentSpeed, config.animationSpeed]);
  
  // Main animation loop
  useEffect(() => {
    if (!animationsEnabled) return;
    
    const animate = () => {
      runTiming(animationTime, animationTime.current + 1, {
        duration: 1000 / animationSpeed,
        easing: Easing.linear,
      });
    };
    
    const interval = setInterval(animate, 1000 / animationSpeed);
    return () => clearInterval(interval);
  }, [animationSpeed, animationsEnabled]);
  
  // Update animations based on state
  useSharedValueEffect(() => {
    const time = animationTime.current;
    
    switch (animationState) {
      case AnimationState.WALKING:
        bounceOffset.current = Math.sin(time * Math.PI * 2) * 5;
        armSwing.current = Math.sin(time * Math.PI * 2) * 15;
        legSwing.current = Math.sin(time * Math.PI * 2 + Math.PI) * 10;
        break;
        
      case AnimationState.RUNNING:
        bounceOffset.current = Math.sin(time * Math.PI * 4) * 8;
        armSwing.current = Math.sin(time * Math.PI * 4) * 25;
        legSwing.current = Math.sin(time * Math.PI * 4 + Math.PI) * 20;
        break;
        
      case AnimationState.CYCLING:
        bounceOffset.current = Math.sin(time * Math.PI * 6) * 3;
        armSwing.current = Math.sin(time * Math.PI * 2) * 5; // Less arm movement
        legSwing.current = Math.sin(time * Math.PI * 6) * 30; // More leg movement
        break;
        
      case AnimationState.CELEBRATING:
        bounceOffset.current = Math.sin(time * Math.PI * 8) * 15;
        armSwing.current = Math.sin(time * Math.PI * 8) * 45;
        celebrationScale.current = 1 + Math.sin(time * Math.PI * 4) * 0.2;
        celebrationRotation.current = Math.sin(time * Math.PI * 2) * 10;
        break;
        
      default: // IDLE
        bounceOffset.current = Math.sin(time * Math.PI) * 2;
        armSwing.current = 0;
        legSwing.current = 0;
        break;
    }
  }, animationTime);
  
  // Handle celebration trigger
  useEffect(() => {
    if (celebrationTrigger && animationsEnabled) {
      runTiming(celebrationScale, 1.3, {
        duration: 300,
        easing: Easing.elastic(2),
      });
      
      setTimeout(() => {
        runTiming(celebrationScale, 1, {
          duration: 500,
          easing: Easing.out(Easing.quad),
        });
      }, 300);
    }
  }, [celebrationTrigger, animationsEnabled]);
  
  // Touch handler for tap interactions
  const touchHandler = useTouchHandler({
    onStart: (touchInfo: TouchInfo) => {
      if (animationsEnabled) {
        runTiming(tapScale, 0.9, {
          duration: 100,
          easing: Easing.out(Easing.quad),
        });
      }
      onCharacterTap?.();
    },
    onEnd: () => {
      if (animationsEnabled) {
        runTiming(tapScale, 1, {
          duration: 200,
          easing: Easing.elastic(1.5),
        });
      }
    },
  });
  
  // Character dimensions
  const characterWidth = width * 0.6;
  const characterHeight = height * 0.8;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Create paints
  const primaryPaint = Skia.Paint();
  primaryPaint.setColor(Skia.Color(config.primaryColor));
  primaryPaint.setAntiAlias(true);
  
  const secondaryPaint = Skia.Paint();
  secondaryPaint.setColor(Skia.Color(config.secondaryColor));
  secondaryPaint.setAntiAlias(true);
  
  const accentPaint = Skia.Paint();
  accentPaint.setColor(Skia.Color(config.accentColor));
  accentPaint.setAntiAlias(true);
  
  const shadowPaint = Skia.Paint();
  shadowPaint.setColor(Skia.Color('rgba(0, 0, 0, 0.3)'));
  shadowPaint.setAntiAlias(true);
  
  return (
    <View style={{ width, height }}>
      <Canvas style={{ flex: 1 }} onTouch={touchHandler}>
        <Group
          transform={[
            { translateX: centerX },
            { translateY: centerY + bounceOffset },
            { scale: tapScale },
            { scale: celebrationScale },
            { rotate: celebrationRotation * (Math.PI / 180) },
            { translateX: -centerX },
            { translateY: -centerY },
          ]}
        >
          {/* Character Shadow */}
          <Circle
            cx={centerX}
            cy={centerY + characterHeight / 2 + 20}
            r={characterWidth / 4}
            paint={shadowPaint}
          />
          
          {/* Character Body */}
          <RoundedRect
            x={centerX - characterWidth / 6}
            y={centerY - characterHeight / 6}
            width={characterWidth / 3}
            height={characterHeight / 2.5}
            r={characterWidth / 12}
            paint={primaryPaint}
          />
          
          {/* Character Head */}
          <Circle
            cx={centerX}
            cy={centerY - characterHeight / 3}
            r={characterWidth / 8}
            paint={accentPaint}
          />
          
          {/* Left Arm */}
          <Group
            transform={[
              { translateX: centerX - characterWidth / 4 },
              { translateY: centerY - characterHeight / 8 },
              { rotate: armSwing * (Math.PI / 180) },
              { translateX: -(centerX - characterWidth / 4) },
              { translateY: -(centerY - characterHeight / 8) },
            ]}
          >
            <RoundedRect
              x={centerX - characterWidth / 4 - characterWidth / 20}
              y={centerY - characterHeight / 8}
              width={characterWidth / 10}
              height={characterHeight / 4}
              r={characterWidth / 40}
              paint={secondaryPaint}
            />
          </Group>
          
          {/* Right Arm */}
          <Group
            transform={[
              { translateX: centerX + characterWidth / 4 },
              { translateY: centerY - characterHeight / 8 },
              { rotate: -armSwing * (Math.PI / 180) },
              { translateX: -(centerX + characterWidth / 4) },
              { translateY: -(centerY - characterHeight / 8) },
            ]}
          >
            <RoundedRect
              x={centerX + characterWidth / 4 - characterWidth / 20}
              y={centerY - characterHeight / 8}
              width={characterWidth / 10}
              height={characterHeight / 4}
              r={characterWidth / 40}
              paint={secondaryPaint}
            />
          </Group>
          
          {/* Left Leg */}
          <Group
            transform={[
              { translateX: centerX - characterWidth / 8 },
              { translateY: centerY + characterHeight / 8 },
              { rotate: legSwing * (Math.PI / 180) },
              { translateX: -(centerX - characterWidth / 8) },
              { translateY: -(centerY + characterHeight / 8) },
            ]}
          >
            <RoundedRect
              x={centerX - characterWidth / 8 - characterWidth / 24}
              y={centerY + characterHeight / 8}
              width={characterWidth / 12}
              height={characterHeight / 3}
              r={characterWidth / 48}
              paint={primaryPaint}
            />
          </Group>
          
          {/* Right Leg */}
          <Group
            transform={[
              { translateX: centerX + characterWidth / 8 },
              { translateY: centerY + characterHeight / 8 },
              { rotate: -legSwing * (Math.PI / 180) },
              { translateX: -(centerX + characterWidth / 8) },
              { translateY: -(centerY + characterHeight / 8) },
            ]}
          >
            <RoundedRect
              x={centerX + characterWidth / 8 - characterWidth / 24}
              y={centerY + characterHeight / 8}
              width={characterWidth / 12}
              height={characterHeight / 3}
              r={characterWidth / 48}
              paint={primaryPaint}
            />
          </Group>
          
          {/* Activity-specific Accessory */}
          {config.accessory === 'hat' && (
            <RoundedRect
              x={centerX - characterWidth / 12}
              y={centerY - characterHeight / 2.5}
              width={characterWidth / 6}
              height={characterWidth / 20}
              r={characterWidth / 40}
              paint={accentPaint}
            />
          )}
          
          {config.accessory === 'headband' && (
            <RoundedRect
              x={centerX - characterWidth / 10}
              y={centerY - characterHeight / 2.8}
              width={characterWidth / 5}
              height={characterWidth / 30}
              r={characterWidth / 60}
              paint={accentPaint}
            />
          )}
          
          {config.accessory === 'helmet' && (
            <Circle
              cx={centerX}
              cy={centerY - characterHeight / 3}
              r={characterWidth / 7}
              paint={accentPaint}
            />
          )}
          
          {/* Eyes */}
          <Circle
            cx={centerX - characterWidth / 20}
            cy={centerY - characterHeight / 2.8}
            r={characterWidth / 60}
            paint={shadowPaint}
          />
          <Circle
            cx={centerX + characterWidth / 20}
            cy={centerY - characterHeight / 2.8}
            r={characterWidth / 60}
            paint={shadowPaint}
          />
        </Group>
        
        {/* Celebration particles (when celebrating) */}
        {animationState === AnimationState.CELEBRATING && (
          <Group>
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const distance = 50 + Math.sin(animationTime.current * Math.PI * 4) * 20;
              const x = centerX + Math.cos(angle) * distance;
              const y = centerY + Math.sin(angle) * distance;
              
              return (
                <Circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  paint={i % 2 === 0 ? accentPaint : primaryPaint}
                />
              );
            })}
          </Group>
        )}
      </Canvas>
    </View>
  );
};

export default Character3D;
