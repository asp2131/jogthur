import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Group,
  Circle,
  RoundedRect,
  Paint,
  useSharedValueEffect,
  useValue,
  runTiming,
  Easing,
  useTouchHandler,
  TouchInfo,
  Skia,
  useFrameCallback,
  vec
} from '@shopify/react-native-skia';
import { ActivityType } from '../models';
import { CharacterAnimationEngine, AnimationKeyframe } from './CharacterAnimationEngine';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Enhanced Character3D component props
 */
interface EnhancedCharacter3DProps {
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
  
  /**
   * Performance mode (reduces animation quality for better performance)
   */
  performanceMode?: boolean;
}

/**
 * Character appearance configuration
 */
const getCharacterAppearance = (activityType: ActivityType) => {
  switch (activityType) {
    case 'walk':
      return {
        primaryColor: '#00D4AA',
        secondaryColor: '#007991',
        accentColor: '#FFD700',
        accessoryColor: '#FF6B35',
        accessory: 'hat',
        particles: { color: '#00D4AA', count: 6 }
      };
    case 'run':
      return {
        primaryColor: '#FF6B35',
        secondaryColor: '#E94560',
        accentColor: '#FFFFFF',
        accessoryColor: '#FFD700',
        accessory: 'headband',
        particles: { color: '#FF6B35', count: 8 }
      };
    case 'bike':
      return {
        primaryColor: '#C724B1',
        secondaryColor: '#8E44AD',
        accentColor: '#F39C12',
        accessoryColor: '#FFFFFF',
        accessory: 'helmet',
        particles: { color: '#C724B1', count: 10 }
      };
    default:
      return {
        primaryColor: '#FF6B35',
        secondaryColor: '#E94560',
        accentColor: '#FFFFFF',
        accessoryColor: '#FFD700',
        accessory: 'none',
        particles: { color: '#FF6B35', count: 8 }
      };
  }
};

/**
 * Enhanced 3D Character component with advanced animations
 */
export const EnhancedCharacter3D: React.FC<EnhancedCharacter3DProps> = ({
  activityType,
  currentSpeed,
  celebrationTrigger = false,
  onCharacterTap,
  width = screenWidth,
  height = 300,
  animationsEnabled = true,
  performanceMode = false
}) => {
  // Animation engine
  const animationEngine = useRef(new CharacterAnimationEngine());
  
  // Skia values for smooth animations
  const bodyBounce = useValue(0);
  const armLeftRotation = useValue(0);
  const armRightRotation = useValue(0);
  const legLeftRotation = useValue(0);
  const legRightRotation = useValue(0);
  const headBob = useValue(0);
  const characterScale = useValue(1);
  const tapScale = useValue(1);
  const celebrationParticles = useValue(0);
  
  // Character appearance
  const appearance = useMemo(() => getCharacterAppearance(activityType), [activityType]);
  
  // Previous animation state to detect changes
  const prevAnimationState = useRef<string>('');
  const prevCelebrationTrigger = useRef(false);
  
  // Update animation when activity or speed changes
  useEffect(() => {
    if (!animationsEnabled) return;
    
    const animationName = CharacterAnimationEngine.getAnimationForActivity(activityType, currentSpeed);
    const animationSpeed = CharacterAnimationEngine.calculateAnimationSpeed(activityType, currentSpeed);
    
    if (prevAnimationState.current !== animationName) {
      animationEngine.current.setAnimation(animationName, animationSpeed);
      prevAnimationState.current = animationName;
    }
  }, [activityType, currentSpeed, animationsEnabled]);
  
  // Handle celebration trigger
  useEffect(() => {
    if (celebrationTrigger && !prevCelebrationTrigger.current && animationsEnabled) {
      animationEngine.current.setAnimation('celebrating', 1);
      
      // Trigger celebration particles
      runTiming(celebrationParticles, 1, {
        duration: 2000,
        easing: Easing.out(Easing.quad),
      });
      
      setTimeout(() => {
        celebrationParticles.current = 0;
        // Return to normal animation after celebration
        const normalAnimation = CharacterAnimationEngine.getAnimationForActivity(activityType, currentSpeed);
        const normalSpeed = CharacterAnimationEngine.calculateAnimationSpeed(activityType, currentSpeed);
        animationEngine.current.setAnimation(normalAnimation, normalSpeed);
      }, 2000);
    }
    
    prevCelebrationTrigger.current = celebrationTrigger;
  }, [celebrationTrigger, activityType, currentSpeed, animationsEnabled]);
  
  // Frame callback for smooth 60fps animations
  const frameCallback = useFrameCallback((info) => {
    if (!animationsEnabled) return;
    
    // Update animation engine
    const deltaTime = info.timeSinceFirstFrame / 1000; // Convert to seconds
    animationEngine.current.update(deltaTime);
    
    // Get current animation frame
    const frame = animationEngine.current.getCurrentFrame();
    
    // Update Skia values smoothly
    if (!performanceMode) {
      // Smooth transitions for better quality
      runTiming(bodyBounce, frame.bodyBounce, { duration: 50, easing: Easing.out(Easing.quad) });
      runTiming(armLeftRotation, frame.armLeftRotation, { duration: 50, easing: Easing.out(Easing.quad) });
      runTiming(armRightRotation, frame.armRightRotation, { duration: 50, easing: Easing.out(Easing.quad) });
      runTiming(legLeftRotation, frame.legLeftRotation, { duration: 50, easing: Easing.out(Easing.quad) });
      runTiming(legRightRotation, frame.legRightRotation, { duration: 50, easing: Easing.out(Easing.quad) });
      runTiming(headBob, frame.headBob, { duration: 50, easing: Easing.out(Easing.quad) });
      runTiming(characterScale, frame.scale, { duration: 50, easing: Easing.out(Easing.quad) });
    } else {
      // Direct value assignment for better performance
      bodyBounce.current = frame.bodyBounce;
      armLeftRotation.current = frame.armLeftRotation;
      armRightRotation.current = frame.armRightRotation;
      legLeftRotation.current = frame.legLeftRotation;
      legRightRotation.current = frame.legRightRotation;
      headBob.current = frame.headBob;
      characterScale.current = frame.scale;
    }
  }, true);
  
  // Touch handler for interactive taps
  const touchHandler = useTouchHandler({
    onStart: (touchInfo: TouchInfo) => {
      if (animationsEnabled) {
        runTiming(tapScale, 0.85, {
          duration: 100,
          easing: Easing.out(Easing.quad),
        });
      }
      onCharacterTap?.();
    },
    onEnd: () => {
      if (animationsEnabled) {
        runTiming(tapScale, 1, {
          duration: 300,
          easing: Easing.elastic(1.5),
        });
      }
    },
  });
  
  // Character dimensions and positioning
  const characterWidth = width * 0.5;
  const characterHeight = height * 0.7;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Create paints with memoization for performance
  const paints = useMemo(() => {
    const primaryPaint = Skia.Paint();
    primaryPaint.setColor(Skia.Color(appearance.primaryColor));
    primaryPaint.setAntiAlias(true);
    
    const secondaryPaint = Skia.Paint();
    secondaryPaint.setColor(Skia.Color(appearance.secondaryColor));
    secondaryPaint.setAntiAlias(true);
    
    const accentPaint = Skia.Paint();
    accentPaint.setColor(Skia.Color(appearance.accentColor));
    accentPaint.setAntiAlias(true);
    
    const accessoryPaint = Skia.Paint();
    accessoryPaint.setColor(Skia.Color(appearance.accessoryColor));
    accessoryPaint.setAntiAlias(true);
    
    const shadowPaint = Skia.Paint();
    shadowPaint.setColor(Skia.Color('rgba(0, 0, 0, 0.2)'));
    shadowPaint.setAntiAlias(true);
    
    const particlePaint = Skia.Paint();
    particlePaint.setColor(Skia.Color(appearance.particles.color));
    particlePaint.setAntiAlias(true);
    
    return {
      primary: primaryPaint,
      secondary: secondaryPaint,
      accent: accentPaint,
      accessory: accessoryPaint,
      shadow: shadowPaint,
      particle: particlePaint
    };
  }, [appearance]);
  
  // Render accessory based on activity type
  const renderAccessory = useCallback(() => {
    const accessorySize = characterWidth / 8;
    
    switch (appearance.accessory) {
      case 'hat':
        return (
          <RoundedRect
            x={centerX - accessorySize}
            y={centerY - characterHeight / 2.2}
            width={accessorySize * 2}
            height={accessorySize / 2}
            r={accessorySize / 4}
            paint={paints.accessory}
          />
        );
        
      case 'headband':
        return (
          <RoundedRect
            x={centerX - accessorySize * 1.2}
            y={centerY - characterHeight / 2.5}
            width={accessorySize * 2.4}
            height={accessorySize / 3}
            r={accessorySize / 6}
            paint={paints.accessory}
          />
        );
        
      case 'helmet':
        return (
          <Group>
            <Circle
              cx={centerX}
              cy={centerY - characterHeight / 2.8}
              r={characterWidth / 6}
              paint={paints.accessory}
            />
            <Circle
              cx={centerX}
              cy={centerY - characterHeight / 2.8}
              r={characterWidth / 8}
              paint={paints.accent}
            />
          </Group>
        );
        
      default:
        return null;
    }
  }, [appearance.accessory, centerX, centerY, characterWidth, characterHeight, paints]);
  
  // Render celebration particles
  const renderCelebrationParticles = useCallback(() => {
    if (celebrationParticles.current === 0) return null;
    
    const particleCount = performanceMode ? 
      Math.floor(appearance.particles.count / 2) : 
      appearance.particles.count;
    
    return (
      <Group>
        {Array.from({ length: particleCount }, (_, i) => {
          const angle = (i / particleCount) * Math.PI * 2;
          const progress = celebrationParticles.current;
          const distance = 30 + progress * 50;
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance - progress * 20;
          const size = 2 + progress * 3;
          const opacity = 1 - progress;
          
          const particlePaint = Skia.Paint();
          particlePaint.setColor(Skia.Color(`${appearance.particles.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`));
          particlePaint.setAntiAlias(true);
          
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={size}
              paint={particlePaint}
            />
          );
        })}
      </Group>
    );
  }, [celebrationParticles, centerX, centerY, appearance.particles, performanceMode]);
  
  return (
    <View style={{ width, height }}>
      <Canvas style={{ flex: 1 }} onTouch={touchHandler}>
        <Group
          transform={[
            { translateX: centerX },
            { translateY: centerY + bodyBounce + headBob },
            { scale: tapScale },
            { scale: characterScale },
            { translateX: -centerX },
            { translateY: -centerY },
          ]}
        >
          {/* Character Shadow */}
          <Circle
            cx={centerX}
            cy={centerY + characterHeight / 2 + 15}
            r={characterWidth / 5}
            paint={paints.shadow}
          />
          
          {/* Character Body */}
          <RoundedRect
            x={centerX - characterWidth / 8}
            y={centerY - characterHeight / 8}
            width={characterWidth / 4}
            height={characterHeight / 2}
            r={characterWidth / 16}
            paint={paints.primary}
          />
          
          {/* Character Head */}
          <Group
            transform={[
              { translateX: centerX },
              { translateY: centerY - characterHeight / 2.8 + headBob / 2 },
              { translateX: -centerX },
              { translateY: -(centerY - characterHeight / 2.8 + headBob / 2) },
            ]}
          >
            <Circle
              cx={centerX}
              cy={centerY - characterHeight / 2.8}
              r={characterWidth / 10}
              paint={paints.accent}
            />
            
            {/* Eyes */}
            <Circle
              cx={centerX - characterWidth / 25}
              cy={centerY - characterHeight / 2.6}
              r={characterWidth / 80}
              paint={paints.shadow}
            />
            <Circle
              cx={centerX + characterWidth / 25}
              cy={centerY - characterHeight / 2.6}
              r={characterWidth / 80}
              paint={paints.shadow}
            />
          </Group>
          
          {/* Left Arm */}
          <Group
            transform={[
              { translateX: centerX - characterWidth / 6 },
              { translateY: centerY - characterHeight / 12 },
              { rotate: armLeftRotation * (Math.PI / 180) },
              { translateX: -(centerX - characterWidth / 6) },
              { translateY: -(centerY - characterHeight / 12) },
            ]}
          >
            <RoundedRect
              x={centerX - characterWidth / 6 - characterWidth / 32}
              y={centerY - characterHeight / 12}
              width={characterWidth / 16}
              height={characterHeight / 5}
              r={characterWidth / 64}
              paint={paints.secondary}
            />
          </Group>
          
          {/* Right Arm */}
          <Group
            transform={[
              { translateX: centerX + characterWidth / 6 },
              { translateY: centerY - characterHeight / 12 },
              { rotate: armRightRotation * (Math.PI / 180) },
              { translateX: -(centerX + characterWidth / 6) },
              { translateY: -(centerY - characterHeight / 12) },
            ]}
          >
            <RoundedRect
              x={centerX + characterWidth / 6 - characterWidth / 32}
              y={centerY - characterHeight / 12}
              width={characterWidth / 16}
              height={characterHeight / 5}
              r={characterWidth / 64}
              paint={paints.secondary}
            />
          </Group>
          
          {/* Left Leg */}
          <Group
            transform={[
              { translateX: centerX - characterWidth / 12 },
              { translateY: centerY + characterHeight / 10 },
              { rotate: legLeftRotation * (Math.PI / 180) },
              { translateX: -(centerX - characterWidth / 12) },
              { translateY: -(centerY + characterHeight / 10) },
            ]}
          >
            <RoundedRect
              x={centerX - characterWidth / 12 - characterWidth / 40}
              y={centerY + characterHeight / 10}
              width={characterWidth / 20}
              height={characterHeight / 4}
              r={characterWidth / 80}
              paint={paints.primary}
            />
          </Group>
          
          {/* Right Leg */}
          <Group
            transform={[
              { translateX: centerX + characterWidth / 12 },
              { translateY: centerY + characterHeight / 10 },
              { rotate: legRightRotation * (Math.PI / 180) },
              { translateX: -(centerX + characterWidth / 12) },
              { translateY: -(centerY + characterHeight / 10) },
            ]}
          >
            <RoundedRect
              x={centerX + characterWidth / 12 - characterWidth / 40}
              y={centerY + characterHeight / 10}
              width={characterWidth / 20}
              height={characterHeight / 4}
              r={characterWidth / 80}
              paint={paints.primary}
            />
          </Group>
          
          {/* Activity-specific Accessory */}
          {renderAccessory()}
        </Group>
        
        {/* Celebration Particles */}
        {renderCelebrationParticles()}
      </Canvas>
    </View>
  );
};

export default EnhancedCharacter3D;
