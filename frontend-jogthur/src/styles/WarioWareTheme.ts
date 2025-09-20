/**
 * WarioWare-style high-energy color scheme and styling system
 */

export const WarioWareColors = {
  // Primary vibrant colors
  primary: {
    orange: '#FF6B35',
    yellow: '#FFD23F',
    green: '#06FFA5',
    blue: '#3A86FF',
    purple: '#C724B1',
    red: '#FF3B30',
    pink: '#FF2D92'
  },

  // Secondary colors
  secondary: {
    lightOrange: '#FF8C69',
    lightYellow: '#FFF176',
    lightGreen: '#69F0AE',
    lightBlue: '#64B5F6',
    lightPurple: '#E1BEE7',
    lightRed: '#EF5350',
    lightPink: '#F48FB1'
  },

  // Dark variants
  dark: {
    orange: '#E55100',
    yellow: '#F57F17',
    green: '#00C853',
    blue: '#1976D2',
    purple: '#7B1FA2',
    red: '#C62828',
    pink: '#AD1457'
  },

  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
    gray: '#9E9E9E',
    darkGray: '#424242',
    black: '#000000',
    background: '#1A1A1A',
    surface: '#2D2D2D'
  },

  // Gradient combinations
  gradients: {
    sunset: ['#FF6B35', '#F7931E', '#FFD23F'],
    ocean: ['#3A86FF', '#06FFA5', '#00D4AA'],
    cosmic: ['#C724B1', '#7B1FA2', '#3A86FF'],
    fire: ['#FF3B30', '#FF6B35', '#FFD23F'],
    neon: ['#06FFA5', '#FFD23F', '#FF2D92']
  }
};

export const WarioWareFonts = {
  sizes: {
    tiny: 10,
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24,
    xxlarge: 32,
    huge: 48
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const
  }
};

export const WarioWareSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  huge: 64
};

export const WarioWareBorderRadius = {
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  round: 9999
};

export const WarioWareShadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8
  },
  neon: {
    shadowColor: '#06FFA5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12
  }
};

/**
 * Activity-specific color schemes
 */
export const ActivityColors = {
  walk: {
    primary: WarioWareColors.primary.green,
    secondary: WarioWareColors.secondary.lightGreen,
    dark: WarioWareColors.dark.green,
    gradient: WarioWareColors.gradients.ocean
  },
  run: {
    primary: WarioWareColors.primary.orange,
    secondary: WarioWareColors.secondary.lightOrange,
    dark: WarioWareColors.dark.orange,
    gradient: WarioWareColors.gradients.sunset
  },
  bike: {
    primary: WarioWareColors.primary.purple,
    secondary: WarioWareColors.secondary.lightPurple,
    dark: WarioWareColors.dark.purple,
    gradient: WarioWareColors.gradients.cosmic
  }
};

/**
 * Button style presets
 */
export const ButtonStyles = {
  primary: {
    backgroundColor: WarioWareColors.primary.orange,
    borderColor: WarioWareColors.neutral.white,
    borderWidth: 3,
    borderRadius: WarioWareBorderRadius.large,
    ...WarioWareShadows.large
  },
  secondary: {
    backgroundColor: WarioWareColors.neutral.darkGray,
    borderColor: WarioWareColors.neutral.white,
    borderWidth: 2,
    borderRadius: WarioWareBorderRadius.medium,
    ...WarioWareShadows.medium
  },
  success: {
    backgroundColor: WarioWareColors.primary.green,
    borderColor: WarioWareColors.neutral.white,
    borderWidth: 3,
    borderRadius: WarioWareBorderRadius.large,
    ...WarioWareShadows.large
  },
  danger: {
    backgroundColor: WarioWareColors.primary.red,
    borderColor: WarioWareColors.neutral.white,
    borderWidth: 3,
    borderRadius: WarioWareBorderRadius.large,
    ...WarioWareShadows.large
  },
  warning: {
    backgroundColor: WarioWareColors.primary.yellow,
    borderColor: WarioWareColors.neutral.black,
    borderWidth: 3,
    borderRadius: WarioWareBorderRadius.large,
    ...WarioWareShadows.large
  },
  neon: {
    backgroundColor: WarioWareColors.primary.green,
    borderColor: WarioWareColors.primary.green,
    borderWidth: 2,
    borderRadius: WarioWareBorderRadius.large,
    ...WarioWareShadows.neon
  }
};

/**
 * Animation timing presets
 */
export const AnimationTimings = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
  bounce: {
    tension: 400,
    friction: 8
  },
  spring: {
    tension: 300,
    friction: 10
  },
  elastic: {
    tension: 200,
    friction: 6
  }
};

/**
 * Screen layout presets
 */
export const LayoutPresets = {
  container: {
    flex: 1,
    backgroundColor: WarioWareColors.neutral.background
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: WarioWareColors.neutral.background
  },
  splitScreen: {
    flex: 1,
    backgroundColor: WarioWareColors.neutral.background
  },
  topHalf: {
    flex: 1,
    backgroundColor: WarioWareColors.neutral.black
  },
  bottomHalf: {
    flex: 1,
    backgroundColor: WarioWareColors.neutral.surface
  }
};

/**
 * Text style presets
 */
export const TextStyles = {
  title: {
    fontSize: WarioWareFonts.sizes.xxlarge,
    fontWeight: WarioWareFonts.weights.black,
    color: WarioWareColors.neutral.white,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4
  },
  subtitle: {
    fontSize: WarioWareFonts.sizes.large,
    fontWeight: WarioWareFonts.weights.bold,
    color: WarioWareColors.neutral.white,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  body: {
    fontSize: WarioWareFonts.sizes.medium,
    fontWeight: WarioWareFonts.weights.medium,
    color: WarioWareColors.neutral.white,
    lineHeight: 24
  },
  button: {
    fontSize: WarioWareFonts.sizes.large,
    fontWeight: WarioWareFonts.weights.black,
    color: WarioWareColors.neutral.white,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  stat: {
    fontSize: WarioWareFonts.sizes.xlarge,
    fontWeight: WarioWareFonts.weights.black,
    color: WarioWareColors.neutral.white,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4
  },
  label: {
    fontSize: WarioWareFonts.sizes.small,
    fontWeight: WarioWareFonts.weights.semibold,
    color: WarioWareColors.neutral.lightGray,
    textAlign: 'center' as const,
    opacity: 0.8
  }
};

/**
 * Utility function to get random vibrant color
 */
export const getRandomVibrantColor = (): string => {
  const colors = Object.values(WarioWareColors.primary);
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Utility function to get activity color scheme
 */
export const getActivityColorScheme = (activity: 'walk' | 'run' | 'bike') => {
  return ActivityColors[activity];
};

/**
 * Utility function to create gradient style
 */
export const createGradientStyle = (colors: string[], direction: 'horizontal' | 'vertical' = 'vertical') => {
  // This would typically be used with a gradient library like react-native-linear-gradient
  return {
    colors,
    start: direction === 'horizontal' ? { x: 0, y: 0 } : { x: 0, y: 0 },
    end: direction === 'horizontal' ? { x: 1, y: 0 } : { x: 0, y: 1 }
  };
};
