import React, { useEffect, useState, useMemo } from 'react';
import { View, Dimensions, Animated } from 'react-native';
import {
  Canvas,
  Group,
  Circle,
  RoundedRect,
  Skia,
  Paint
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
 * Simple Character3D component props
 */
interface SimpleCharacter3DProps {
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
        accessory: 'hat',
        animationSpeed: 1000 // milliseconds per cycle
      };
    case 'run':
      return {
        primaryColor: '#FF6B35', // Vibrant orange
        secondaryColor: '#E94560', // Bright red
        accentColor: '#FFFFFF', // White
        accessory: 'headband',
        animationSpeed: 600
      };
    case 'bike':
      return {
        primaryColor: '#C724B1', // Magenta
        secondaryColor: '#8E44AD', // Purple
        accentColor: '#F39C12', // Orange
        accessory: 'helmet',
        animationSpeed: 800
      };
    default:
      return {
        primaryColor: '#FF6B35',
        secondaryColor: '#E94560',
        accentColor: '#FFFFFF',
        accessory: 'none',
        animationSpeed: 1000
      };
  }
};

/**
 * Simple 3D Character component with Skia rendering
 */
export const SimpleCharacter3D: React.FC<SimpleCharacter3DProps> = ({
  activityType,
  currentSpeed,
  celebrationTrigger = false,
  onCharacterTap,
  width = screenWidth,
  height = 300,
  animationsEnabled = true
}) => {
  // Animation state
  const [animationTime, setAnimationTime] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
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
    const speedMultiplier = Math.max(currentSpeed * 0.5, 0.3);
    return Math.floor(baseSpeed / speedMultiplier);
  }, [currentSpeed, config.animationSpeed]);
  
  // Animation loop
  useEffect(() => {
    if (!animationsEnabled || animationState === AnimationState.IDLE) {
      setIsAnimating(false);
      return;
    }
    
    setIsAnimating(true);
    const interval = setInterval(() => {
      setAnimationTime(prev => (prev + 1) % 360); // 0-360 degrees cycle
    }, animationSpeed / 36); // Divide by 36 to get smooth 10-degree increments
    
    return () => clearInterval(interval);
  }, [animationSpeed, animationsEnabled, animationState]);
  
  // Calculate animation values based on current time and state
  const getAnimationValues = () => {
    const time = (animationTime * Math.PI) / 180; // Convert to radians
    
    switch (animationState) {
      case AnimationState.WALKING:
        return {
          bodyBounce: Math.sin(time * 2) * 3,
          armSwing: Math.sin(time * 2) * 15,
          legSwing: Math.sin(time * 2 + Math.PI) * 10,
          scale: 1 + Math.sin(time * 2) * 0.02
        };
        
      case AnimationState.RUNNING:
        return {
          bodyBounce: Math.sin(time * 4) * 6,
          armSwing: Math.sin(time * 4) * 25,
          legSwing: Math.sin(time * 4 + Math.PI) * 20,
          scale: 1 + Math.sin(time * 4) * 0.05
        };
        
      case AnimationState.CYCLING:
        return {
          bodyBounce: Math.sin(time * 6) * 2,
          armSwing: Math.sin(time * 2) * 5,
          legSwing: Math.sin(time * 6) * 30,
          scale: 1 + Math.sin(time * 6) * 0.02
        };
        
      case AnimationState.CELEBRATING:
        return {
          bodyBounce: Math.sin(time * 8) * 12,
          armSwing: Math.sin(time * 8) * 45,
          legSwing: Math.sin(time * 4) * 15,
          scale: 1 + Math.sin(time * 4) * 0.15
        };
        
      default: // IDLE
        return {
          bodyBounce: Math.sin(time * 0.5) * 1,
          armSwing: 0,
          legSwing: 0,
          scale: 1
        };
    }
  };
  
  const animValues = getAnimationValues();
  
  // Character dimensions
  const characterWidth = width * 0.6;
  const characterHeight = height * 0.8;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Create paints
  const primaryPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(config.primaryColor));
    paint.setAntiAlias(true);
    return paint;
  }, [config.primaryColor]);
  
  const secondaryPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(config.secondaryColor));
    paint.setAntiAlias(true);
    return paint;
  }, [config.secondaryColor]);
  
  const accentPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(config.accentColor));
    paint.setAntiAlias(true);
    return paint;
  }, [config.accentColor]);
  
  const shadowPaint = useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color('rgba(0, 0, 0, 0.3)'));
    paint.setAntiAlias(true);
    return paint;
  }, []);
  
  return (
    <View style={{ width, height }}>
      <Canvas style={{ flex: 1 }}>
        <Group
          transform={[
            { translateX: centerX },
            { translateY: centerY + animValues.bodyBounce },
            { scale: animValues.scale },
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
              { rotate: (animValues.armSwing * Math.PI) / 180 },
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
              { rotate: (-animValues.armSwing * Math.PI) / 180 },
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
              { rotate: (animValues.legSwing * Math.PI) / 180 },
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
              { rotate: (-animValues.legSwing * Math.PI) / 180 },
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
              const distance = 50 + Math.sin((animationTime * Math.PI) / 180 * 4) * 20;
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

export default SimpleCharacter3D;
