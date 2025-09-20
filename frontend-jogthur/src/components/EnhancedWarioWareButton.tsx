import React, { useRef, useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Animated,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Easing,
  View
} from 'react-native';
import { ExaggeratedPress, useScreenShake, useBouncySpring } from './WarioWareAnimations';
import { 
  WarioWareColors, 
  ButtonStyles, 
  TextStyles, 
  AnimationTimings,
  getRandomVibrantColor 
} from '../styles/WarioWareTheme';

/**
 * Enhanced WarioWare-style button props
 */
interface EnhancedWarioWareButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'neon';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  pulse?: boolean;
  bounce?: boolean;
  rainbow?: boolean;
  explode?: boolean;
  shakeOnPress?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

/**
 * Get button size configuration
 */
const getSizeConfig = (size: string) => {
  switch (size) {
    case 'small':
      return { 
        width: 80, 
        height: 40, 
        fontSize: 14, 
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8
      };
    case 'medium':
      return { 
        width: 120, 
        height: 50, 
        fontSize: 16, 
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12
      };
    case 'large':
      return { 
        width: 160, 
        height: 60, 
        fontSize: 18, 
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 16
      };
    case 'xlarge':
      return { 
        width: 200, 
        height: 70, 
        fontSize: 20, 
        borderRadius: 35,
        paddingHorizontal: 24,
        paddingVertical: 20
      };
    default:
      return { 
        width: 120, 
        height: 50, 
        fontSize: 16, 
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12
      };
  }
};

/**
 * Enhanced WarioWare-style animated button component
 */
export const EnhancedWarioWareButton: React.FC<EnhancedWarioWareButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  pulse = false,
  bounce = false,
  rainbow = false,
  explode = false,
  shakeOnPress = true,
  style,
  textStyle,
  icon
}) => {
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const explodeAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rainbowAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [currentColor, setCurrentColor] = useState(WarioWareColors.primary.orange);
  const [isExploding, setIsExploding] = useState(false);
  
  // Custom hooks
  const { shakeAnim, triggerShake } = useScreenShake();
  const { springAnim, triggerBounce, resetBounce } = useBouncySpring();
  
  // Get configuration
  const sizeConfig = getSizeConfig(size);
  const buttonStyle = ButtonStyles[variant] || ButtonStyles.primary;
  
  // Pulse animation
  useEffect(() => {
    if (pulse && !disabled) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: AnimationTimings.slow,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: AnimationTimings.slow,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      );
      
      pulseAnimation.start();
      
      return () => {
        pulseAnimation.stop();
      };
    }
  }, [pulse, disabled, pulseAnim]);

  // Bounce animation
  useEffect(() => {
    if (bounce && !disabled) {
      const bounceAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.bounce,
            useNativeDriver: true
          })
        ])
      );
      
      bounceAnimation.start();
      
      return () => {
        bounceAnimation.stop();
      };
    }
  }, [bounce, disabled, bounceAnim]);

  // Rainbow animation
  useEffect(() => {
    if (rainbow && !disabled) {
      const rainbowAnimation = Animated.loop(
        Animated.timing(rainbowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false
        })
      );
      
      rainbowAnimation.start();
      
      // Color cycling
      const colorInterval = setInterval(() => {
        setCurrentColor(getRandomVibrantColor());
      }, 300);
      
      return () => {
        rainbowAnimation.stop();
        clearInterval(colorInterval);
      };
    }
  }, [rainbow, disabled, rainbowAnim]);

  // Glow animation
  useEffect(() => {
    if (!disabled) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false
          })
        ])
      );
      
      glowAnimation.start();
      
      return () => {
        glowAnimation.stop();
      };
    }
  }, [disabled, glowAnim]);

  // Handle press
  const handlePress = () => {
    if (disabled) return;

    // Trigger screen shake
    if (shakeOnPress) {
      triggerShake(8, 300);
    }

    // Trigger bounce
    triggerBounce(0.9);
    setTimeout(() => resetBounce(), 200);

    // Explode animation
    if (explode) {
      setIsExploding(true);
      Animated.sequence([
        Animated.timing(explodeAnim, {
          toValue: 1.3,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(explodeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.elastic(1.5),
          useNativeDriver: true
        })
      ]).start(() => {
        setIsExploding(false);
      });
    }

    onPress();
  };

  // Interpolated values
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8]
  });

  const backgroundColor = rainbow ? currentColor : (buttonStyle.backgroundColor || WarioWareColors.primary.orange);

  return (
    <ExaggeratedPress
      onPress={handlePress}
      pressScale={0.9}
      pressRotation={5}
      shakeIntensity={shakeOnPress ? 6 : 0}
      disabled={disabled}
      style={style}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { scale: springAnim },
              { scale: pulseAnim },
              { scale: explodeAnim },
              { translateY: bounceAnim },
              { translateX: shakeAnim }
            ]
          }
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glowEffect,
            {
              width: sizeConfig.width + 20,
              height: sizeConfig.height + 20,
              borderRadius: sizeConfig.borderRadius + 10,
              backgroundColor: backgroundColor,
              opacity: disabled ? 0 : glowOpacity
            }
          ]}
        />
        
        {/* Main button */}
        <Animated.View
          style={[
            styles.button,
            buttonStyle,
            {
              backgroundColor: disabled ? WarioWareColors.neutral.darkGray : backgroundColor,
              width: sizeConfig.width,
              height: sizeConfig.height,
              borderRadius: sizeConfig.borderRadius,
              paddingHorizontal: sizeConfig.paddingHorizontal,
              paddingVertical: sizeConfig.paddingVertical
            }
          ]}
        >
          {/* Inner content */}
          <View style={styles.content}>
            {icon && (
              <View style={styles.iconContainer}>
                {icon}
              </View>
            )}
            
            <Text
              style={[
                styles.buttonText,
                TextStyles.button,
                {
                  fontSize: sizeConfig.fontSize,
                  color: disabled ? WarioWareColors.neutral.gray : WarioWareColors.neutral.white
                },
                textStyle
              ]}
            >
              {title}
            </Text>
          </View>
          
          {/* Inner highlight */}
          <View
            style={[
              styles.innerHighlight,
              {
                borderRadius: sizeConfig.borderRadius - 4,
                opacity: disabled ? 0 : 0.4
              }
            ]}
          />
          
          {/* Border shine */}
          <Animated.View
            style={[
              styles.borderShine,
              {
                borderRadius: sizeConfig.borderRadius,
                opacity: disabled ? 0 : glowOpacity
              }
            ]}
          />
        </Animated.View>
        
        {/* Explosion particles (if exploding) */}
        {isExploding && (
          <View style={styles.explosionContainer}>
            {Array.from({ length: 8 }, (_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.explosionParticle,
                  {
                    backgroundColor: getRandomVibrantColor(),
                    transform: [
                      {
                        translateX: Math.cos((i * Math.PI * 2) / 8) * 30
                      },
                      {
                        translateY: Math.sin((i * Math.PI * 2) / 8) * 30
                      }
                    ]
                  }
                ]}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </ExaggeratedPress>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  glowEffect: {
    position: 'absolute',
    zIndex: 0,
    opacity: 0.3
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3
  },
  iconContainer: {
    marginRight: 8
  },
  buttonText: {
    zIndex: 3
  },
  innerHighlight: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1
  },
  borderShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 2
  },
  explosionContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 4
  },
  explosionParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    marginTop: -3
  }
});

export default EnhancedWarioWareButton;
