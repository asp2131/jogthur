import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Animated,
  Easing,
  Dimensions,
  StyleSheet,
  ViewStyle
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Screen shake animation hook
 */
export const useScreenShake = () => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = (intensity: number = 10, duration: number = 500) => {
    const shakeSequence = Array.from({ length: 8 }, (_, i) => {
      const direction = i % 2 === 0 ? intensity : -intensity;
      const reducedIntensity = intensity * (1 - i / 8); // Gradually reduce intensity
      
      return Animated.timing(shakeAnim, {
        toValue: direction * reducedIntensity,
        duration: duration / 8,
        easing: Easing.linear,
        useNativeDriver: true
      });
    });

    // Reset to center
    shakeSequence.push(
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        easing: Easing.elastic(1),
        useNativeDriver: true
      })
    );

    Animated.sequence(shakeSequence).start();
  };

  return { shakeAnim, triggerShake };
};

/**
 * Bouncy spring physics animation hook
 */
export const useBouncySpring = (initialValue: number = 1) => {
  const springAnim = useRef(new Animated.Value(initialValue)).current;

  const triggerBounce = (
    toValue: number,
    tension: number = 400,
    friction: number = 8
  ) => {
    Animated.spring(springAnim, {
      toValue,
      tension,
      friction,
      useNativeDriver: true
    }).start();
  };

  const resetBounce = (tension: number = 300, friction: number = 10) => {
    Animated.spring(springAnim, {
      toValue: initialValue,
      tension,
      friction,
      useNativeDriver: true
    }).start();
  };

  return { springAnim, triggerBounce, resetBounce };
};

/**
 * Exaggerated press effect component
 */
interface ExaggeratedPressProps {
  children: React.ReactNode;
  onPress?: () => void;
  pressScale?: number;
  pressRotation?: number;
  shakeIntensity?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

export const ExaggeratedPress: React.FC<ExaggeratedPressProps> = ({
  children,
  onPress,
  pressScale = 0.85,
  pressRotation = 8,
  shakeIntensity = 5,
  style,
  disabled = false
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { shakeAnim, triggerShake } = useScreenShake();

  const handlePressIn = () => {
    if (disabled) return;

    // Trigger screen shake
    triggerShake(shakeIntensity, 200);

    // Scale and rotate animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: pressScale,
        tension: 300,
        friction: 8,
        useNativeDriver: true
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      })
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 6,
        useNativeDriver: true
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.elastic(1.5),
        useNativeDriver: true
      })
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${pressRotation}deg`]
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateX: shakeAnim },
            { scale: scaleAnim },
            { rotate }
          ]
        }
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
    >
      {children}
    </Animated.View>
  );
};

/**
 * Confetti particle interface
 */
interface ConfettiParticle {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
}

/**
 * Confetti celebration animation
 */
interface ConfettiAnimationProps {
  trigger: boolean;
  particleCount?: number;
  duration?: number;
  colors?: string[];
}

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  trigger,
  particleCount = 50,
  duration = 3000,
  colors = ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#C724B1', '#3A86FF']
}) => {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    if (trigger) {
      // Create particles
      const newParticles: ConfettiParticle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: `particle-${i}`,
        x: new Animated.Value(Math.random() * screenWidth),
        y: new Animated.Value(-50),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(1),
        color: colors[Math.floor(Math.random() * colors.length)]
      }));

      setParticles(newParticles);

      // Animate particles
      const animations = newParticles.map(particle => {
        const finalY = screenHeight + 100;
        const finalRotation = Math.random() * 720 - 360; // Random rotation
        const finalScale = 0.1;

        return Animated.parallel([
          Animated.timing(particle.y, {
            toValue: finalY,
            duration: duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(particle.rotation, {
            toValue: finalRotation,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(particle.scale, {
            toValue: finalScale,
            duration: duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          // Add some horizontal drift
          Animated.timing(particle.x, {
            toValue: (particle.x as any)._value + (Math.random() - 0.5) * 200,
            duration: duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          })
        ]);
      });

      Animated.parallel(animations).start(() => {
        // Clear particles after animation
        setParticles([]);
      });
    }
  }, [trigger, particleCount, duration, colors]);

  if (particles.length === 0) return null;

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {particles.map(particle => {
        const rotation = particle.rotation.interpolate({
          inputRange: [-360, 360],
          outputRange: ['-360deg', '360deg']
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.confettiParticle,
              {
                backgroundColor: particle.color,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { rotate: rotation },
                  { scale: particle.scale }
                ]
              }
            ]}
          />
        );
      })}
    </View>
  );
};

/**
 * Zoom and whoosh screen transition
 */
interface ScreenTransitionProps {
  isVisible: boolean;
  children: React.ReactNode;
  transitionType?: 'zoom' | 'whoosh' | 'bounce';
  duration?: number;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  isVisible,
  children,
  transitionType = 'zoom',
  duration = 500
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (isVisible) {
      const animations = [
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: duration * 0.6,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ];

      if (transitionType === 'zoom' || transitionType === 'bounce') {
        const easing = transitionType === 'bounce' 
          ? Easing.elastic(1.2) 
          : Easing.out(Easing.back(1.7));
        
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration,
            easing,
            useNativeDriver: true
          })
        );
      }

      if (transitionType === 'whoosh') {
        animations.push(
          Animated.timing(translateAnim, {
            toValue: 0,
            duration,
            easing: Easing.out(Easing.back(1.7)),
            useNativeDriver: true
          })
        );
      }

      Animated.parallel(animations).start();
    } else {
      // Exit animations
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: duration * 0.3,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: duration * 0.3,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(translateAnim, {
          toValue: -100,
          duration: duration * 0.3,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isVisible, transitionType, duration, scaleAnim, opacityAnim, translateAnim]);

  const getTransform = () => {
    const transforms = [];

    if (transitionType === 'zoom' || transitionType === 'bounce') {
      transforms.push({ scale: scaleAnim });
    }

    if (transitionType === 'whoosh') {
      transforms.push({ translateY: translateAnim });
    }

    return transforms;
  };

  return (
    <Animated.View
      style={[
        styles.transitionContainer,
        {
          opacity: opacityAnim,
          transform: getTransform()
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * High-energy loading spinner
 */
interface WarioWareLoadingProps {
  isVisible: boolean;
  size?: number;
  colors?: string[];
}

export const WarioWareLoading: React.FC<WarioWareLoadingProps> = ({
  isVisible,
  size = 60,
  colors = ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#C724B1']
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );

      // Pulsing scale animation
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true
          })
        ])
      );

      rotateAnimation.start();
      scaleAnimation.start();

      // Color cycling
      const colorInterval = setInterval(() => {
        setColorIndex(prev => (prev + 1) % colors.length);
      }, 200);

      return () => {
        rotateAnimation.stop();
        scaleAnimation.stop();
        clearInterval(colorInterval);
      };
    }
  }, [isVisible, rotateAnim, scaleAnim, colors]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (!isVisible) return null;

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingSpinner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors[colorIndex],
            transform: [
              { rotate },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View
          style={[
            styles.loadingInner,
            {
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              backgroundColor: '#FFFFFF'
            }
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4
  },
  transitionContainer: {
    flex: 1
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 999
  },
  loadingSpinner: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  loadingInner: {
    justifyContent: 'center',
    alignItems: 'center'
  }
});
