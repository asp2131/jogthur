import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Easing
} from 'react-native';

/**
 * WarioWare-style button props
 */
interface WarioWareButtonProps {
  /**
   * Button text
   */
  title: string;
  
  /**
   * Press handler
   */
  onPress: () => void;
  
  /**
   * Button background color
   */
  backgroundColor?: string;
  
  /**
   * Button text color
   */
  textColor?: string;
  
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether to show pulsing animation
   */
  pulse?: boolean;
  
  /**
   * Whether to show bouncing animation
   */
  bounce?: boolean;
  
  /**
   * Custom style for container
   */
  style?: ViewStyle;
  
  /**
   * Custom style for text
   */
  textStyle?: TextStyle;
  
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
}

/**
 * Get button configuration based on variant
 */
const getButtonConfig = (variant: string) => {
  switch (variant) {
    case 'primary':
      return { backgroundColor: '#FF6B35', textColor: '#FFFFFF' };
    case 'secondary':
      return { backgroundColor: '#6C757D', textColor: '#FFFFFF' };
    case 'danger':
      return { backgroundColor: '#DC3545', textColor: '#FFFFFF' };
    case 'success':
      return { backgroundColor: '#28A745', textColor: '#FFFFFF' };
    case 'warning':
      return { backgroundColor: '#FFC107', textColor: '#000000' };
    default:
      return { backgroundColor: '#FF6B35', textColor: '#FFFFFF' };
  }
};

/**
 * Get button size configuration
 */
const getSizeConfig = (size: string) => {
  switch (size) {
    case 'small':
      return { width: 80, height: 40, fontSize: 14, borderRadius: 20 };
    case 'medium':
      return { width: 120, height: 50, fontSize: 16, borderRadius: 25 };
    case 'large':
      return { width: 160, height: 60, fontSize: 18, borderRadius: 30 };
    default:
      return { width: 120, height: 50, fontSize: 16, borderRadius: 25 };
  }
};

/**
 * WarioWare-style animated button component
 */
export const WarioWareButton: React.FC<WarioWareButtonProps> = ({
  title,
  onPress,
  backgroundColor,
  textColor,
  size = 'medium',
  disabled = false,
  pulse = false,
  bounce = false,
  style,
  textStyle,
  variant = 'primary'
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;
  
  // Get configuration
  const variantConfig = getButtonConfig(variant);
  const sizeConfig = getSizeConfig(size);
  
  const finalBackgroundColor = backgroundColor || variantConfig.backgroundColor;
  const finalTextColor = textColor || variantConfig.textColor;
  
  // Pulse animation
  useEffect(() => {
    if (pulse && !disabled) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
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
            toValue: -5,
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
  
  // Press animations
  const handlePressIn = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: false
      })
    ]).start();
  };
  
  const handlePressOut = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.elastic(1.2),
        useNativeDriver: true
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false
      })
    ]).start();
  };
  
  // Rotation interpolation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '3deg']
  });
  
  // Shadow interpolation
  const shadowOpacity = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.4]
  });
  
  const shadowOffset = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 6]
  });
  
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.9}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: disabled ? '#CCCCCC' : finalBackgroundColor,
            width: sizeConfig.width,
            height: sizeConfig.height,
            borderRadius: sizeConfig.borderRadius,
            shadowOpacity,
            shadowOffset: {
              width: 0,
              height: shadowOffset
            },
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim },
              { rotate },
              { translateY: bounceAnim }
            ]
          }
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: disabled ? '#666666' : finalTextColor,
              fontSize: sizeConfig.fontSize
            },
            textStyle
          ]}
        >
          {title}
        </Text>
        
        {/* Inner glow effect */}
        <Animated.View
          style={[
            styles.innerGlow,
            {
              backgroundColor: finalBackgroundColor,
              borderRadius: sizeConfig.borderRadius - 2,
              opacity: disabled ? 0 : 0.3
            }
          ]}
        />
        
        {/* Border highlight */}
        <Animated.View
          style={[
            styles.borderHighlight,
            {
              borderRadius: sizeConfig.borderRadius,
              opacity: disabled ? 0 : 0.6
            }
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden'
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    zIndex: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  innerGlow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    zIndex: 0
  },
  borderHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1
  }
});

export default WarioWareButton;
