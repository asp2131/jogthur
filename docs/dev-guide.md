# FitTracker Implementation Plan - Senior Developer Guide

## Project Setup & Architecture

### **Phase 1: Foundation Setup (Day 1)**

#### Initial Project Scaffold
```bash
# Create React Native project with TypeScript
npx react-native@latest init FitTracker --template react-native-template-typescript

cd FitTracker

# Install core dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install zustand @tanstack/react-query
npm install react-native-mmkv
npm install react-native-reanimated react-native-gesture-handler

# UI/Styling dependencies
npm install nativewind tailwindcss
npm install react-native-elements react-native-vector-icons
npm install react-native-linear-gradient

# Performance & Lists
npm install @shopify/flash-list
npm install react-native-outside-press

# Location & Background
npm install @react-native-community/geolocation
npm install react-native-background-actions
npm install react-native-permissions
npm install react-native-maps

# 3D & Animation
npm install @react-three/fiber expo-gl expo-gl-cpp
npm install three @types/three
npm install react-native-progress

# Optimization
npm install babel-plugin-transform-remove-console
npm install react-native-keyboard-controller

# Development
npm install @types/react-native-vector-icons
npm install lodash @types/lodash
```

#### Folder Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements (buttons, cards)
│   ├── workout/        # Workout-specific components
│   └── three/          # 3D character components
├── screens/            # Screen components
├── store/              # Zustand stores
├── utils/              # Utility functions
├── hooks/              # Custom hooks
├── types/              # TypeScript definitions
├── theme/              # Design system & theme
└── services/           # GPS, storage, calculations
```

#### Core Configuration Files

**tailwind.config.js** (WarioWare theme):
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#F7931E', 
        accent: '#C724B1',
        success: '#00D4AA',
        background: '#1A1A2E',
        surface: '#16213E',
        surfaceLight: '#E94560',
      },
      fontFamily: {
        'black': ['System', 'sans-serif'], // Will replace with custom font
      }
    },
  },
  plugins: [],
}
```

**babel.config.js**:
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'nativewind/babel',
    'react-native-reanimated/plugin',
    ['transform-remove-console', { exclude: ['error', 'warn'] }]
  ],
};
```

### **Phase 2: Type Definitions & Store Setup (Day 1-2)**

#### Core Types (`src/types/index.ts`)
```typescript
export interface Workout {
  id: string;
  type: 'walk' | 'run' | 'bike';
  startTime: Date;
  endTime: Date | null;
  distance: number; // meters
  duration: number; // seconds
  avgPace: number; // seconds per km
  maxSpeed: number; // m/s
  calories?: number;
  gpsPoints: GpsPoint[];
  isActive: boolean;
}

export interface GpsPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  defaultActivityType: ActivityType;
  autoBackgroundTracking: boolean;
  gpsUpdateInterval: number;
  enableHapticFeedback: boolean;
  enableAnimations: boolean;
}

export type ActivityType = 'walk' | 'run' | 'bike';
```

#### Zustand Store (`src/store/workoutStore.ts`)
```typescript
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'workout-storage' });

interface WorkoutState {
  // State
  currentWorkout: Workout | null;
  workoutHistory: Workout[];
  isTracking: boolean;
  userPreferences: UserPreferences;
  
  // Actions
  startWorkout: (type: ActivityType) => void;
  stopWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  updateWorkoutData: (data: Partial<Workout>) => void;
  saveWorkout: (workout: Workout) => void;
  loadWorkoutHistory: () => void;
  deleteWorkout: (id: string) => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  currentWorkout: null,
  workoutHistory: [],
  isTracking: false,
  userPreferences: {
    units: 'metric',
    defaultActivityType: 'run',
    autoBackgroundTracking: true,
    gpsUpdateInterval: 8,
    enableHapticFeedback: true,
    enableAnimations: true,
  },

  startWorkout: (type) => {
    const newWorkout: Workout = {
      id: Date.now().toString(),
      type,
      startTime: new Date(),
      endTime: null,
      distance: 0,
      duration: 0,
      avgPace: 0,
      maxSpeed: 0,
      gpsPoints: [],
      isActive: true,
    };
    set({ currentWorkout: newWorkout, isTracking: true });
  },

  stopWorkout: () => {
    const { currentWorkout } = get();
    if (currentWorkout) {
      const finishedWorkout = {
        ...currentWorkout,
        endTime: new Date(),
        isActive: false,
      };
      
      // Save to MMKV
      const key = `workout_${finishedWorkout.id}`;
      storage.set(key, JSON.stringify(finishedWorkout));
      
      // Update state
      set(state => ({
        currentWorkout: null,
        isTracking: false,
        workoutHistory: [finishedWorkout, ...state.workoutHistory],
      }));
    }
  },

  updateWorkoutData: (data) => {
    set(state => ({
      currentWorkout: state.currentWorkout 
        ? { ...state.currentWorkout, ...data }
        : null
    }));
  },

  loadWorkoutHistory: () => {
    try {
      const keys = storage.getAllKeys();
      const workouts = keys
        .filter(key => key.startsWith('workout_'))
        .map(key => {
          const data = storage.getString(key);
          return data ? JSON.parse(data) : null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      
      set({ workoutHistory: workouts });
    } catch (error) {
      console.error('Failed to load workout history:', error);
    }
  },

  deleteWorkout: (id) => {
    storage.delete(`workout_${id}`);
    set(state => ({
      workoutHistory: state.workoutHistory.filter(workout => workout.id !== id)
    }));
  },
}));
```

### **Phase 3: Core Services (Day 2-3)**

#### GPS Service (`src/services/gpsService.ts`)
```typescript
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import { debounce } from 'lodash';
import { GpsPoint } from '../types';

export class GPSService {
  private watchId: number | null = null;
  private onLocationUpdate: (location: GpsPoint) => void;
  private debouncedUpdate: (location: GpsPoint) => void;

  constructor(onLocationUpdate: (location: GpsPoint) => void) {
    this.onLocationUpdate = onLocationUpdate;
    this.debouncedUpdate = debounce(onLocationUpdate, 8000);
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async requestBackgroundPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const result = await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
        return result === RESULTS.GRANTED;
      } catch (error) {
        console.error('Background permission request failed:', error);
        return false;
      }
    }
    return true; // iOS handles this differently
  }

  async startTracking(): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      this.watchId = Geolocation.watchPosition(
        (position) => {
          const gpsPoint: GpsPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(),
            accuracy: position.coords.accuracy,
          };
          this.debouncedUpdate(gpsPoint);
        },
        (error) => {
          console.error('GPS tracking error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 5, // Only update if moved 5 meters
          interval: 8000,    // Check every 8 seconds
          fastestInterval: 5000,
        }
      );
      resolve();
    });
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
```

#### Distance Calculator (`src/utils/distanceCalculator.ts`)
```typescript
import { GpsPoint } from '../types';

export class DistanceCalculator {
  // Haversine formula implementation
  static calculateDistance(point1: GpsPoint, point2: GpsPoint): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI/180;
    const φ2 = point2.latitude * Math.PI/180;
    const Δφ = (point2.latitude-point1.latitude) * Math.PI/180;
    const Δλ = (point2.longitude-point1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  static calculateTotalDistance(points: GpsPoint[]): number {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += this.calculateDistance(points[i-1], points[i]);
    }
    return totalDistance;
  }

  static calculatePace(distance: number, duration: number): number {
    if (distance === 0) return 0;
    // Return seconds per kilometer
    return (duration / (distance / 1000));
  }

  static calculateSpeed(distance: number, duration: number): number {
    if (duration === 0) return 0;
    // Return meters per second
    return distance / duration;
  }

  // Douglas-Peucker algorithm for route simplification
  static simplifyRoute(points: GpsPoint[], tolerance: number = 0.0001): GpsPoint[] {
    if (points.length <= 2) return points;
    
    // Implementation of Douglas-Peucker algorithm
    // This reduces the number of GPS points while maintaining route accuracy
    return points; // Simplified implementation for now
  }
}
```

### **Phase 4: UI Component System (Day 3-4)**

#### WarioWare Base Components (`src/components/ui/`)

**WarioWareButton.tsx**:
```typescript
import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';

interface WarioWareButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const WarioWareButton: React.FC<WarioWareButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scale.value, { damping: 8, stiffness: 200 }) },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = 0.85;
    rotation.value = withSequence(
      withTiming(-3, { duration: 50 }),
      withTiming(3, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = 1.1;
    setTimeout(() => scale.value = 1, 100);
  };

  const getButtonClasses = () => {
    const baseClasses = 'rounded-2xl shadow-lg border-4 border-white items-center justify-center';
    const sizeClasses = {
      sm: 'px-4 py-2',
      md: 'px-6 py-3',
      lg: 'px-8 py-4'
    };
    
    const variantClasses = {
      primary: 'bg-gradient-to-r from-primary to-secondary',
      secondary: 'bg-gradient-to-r from-accent to-surfaceLight',
      danger: 'bg-gradient-to-r from-red-500 to-red-600'
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
      disabled ? 'opacity-50' : ''
    }`;
  };

  const getTextClasses = () => {
    const sizeClasses = {
      sm: 'text-lg',
      md: 'text-xl', 
      lg: 'text-2xl'
    };
    return `text-white font-black text-center ${sizeClasses[size]}`;
  };

  return (
    <Pressable 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut} 
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={animatedStyle} className={getButtonClasses()}>
        <Text className={getTextClasses()}>
          {title.toUpperCase()}
        </Text>
      </Animated.View>
    </Pressable>
  );
};
```

**ActivityTypeSelector.tsx**:
```typescript
import React from 'react';
import { View, Pressable, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ActivityType } from '../../types';

interface ActivityTypeSelectorProps {
  selectedType: ActivityType;
  onTypeSelect: (type: ActivityType) => void;
}

const ACTIVITIES = [
  { type: 'walk' as ActivityType, icon: 'directions-walk', label: 'WALK' },
  { type: 'run' as ActivityType, icon: 'directions-run', label: 'RUN' },
  { type: 'bike' as ActivityType, icon: 'directions-bike', label: 'BIKE' },
];

export const ActivityTypeSelector: React.FC<ActivityTypeSelectorProps> = ({
  selectedType,
  onTypeSelect
}) => {
  return (
    <View className="flex-row justify-center space-x-4 mb-8">
      {ACTIVITIES.map((activity) => (
        <ActivityButton
          key={activity.type}
          activity={activity}
          isSelected={selectedType === activity.type}
          onPress={() => onTypeSelect(activity.type)}
        />
      ))}
    </View>
  );
};

const ActivityButton: React.FC<{
  activity: typeof ACTIVITIES[0];
  isSelected: boolean;
  onPress: () => void;
}> = ({ activity, isSelected, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 180 }) }],
  }));

  const handlePressIn = () => {
    scale.value = 0.9;
  };

  const handlePressOut = () => {
    scale.value = isSelected ? 1.05 : 1;
  };

  React.useEffect(() => {
    scale.value = isSelected ? 1.05 : 1;
  }, [isSelected]);

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
      <Animated.View 
        style={animatedStyle}
        className={`p-6 rounded-3xl border-4 ${
          isSelected 
            ? 'bg-primary border-secondary shadow-2xl' 
            : 'bg-surface border-gray-600 shadow-lg'
        }`}
      >
        <Icon 
          name={activity.icon} 
          size={40} 
          color={isSelected ? '#FFFFFF' : '#A0A0A0'} 
        />
        <Text className={`text-center mt-2 font-bold ${
          isSelected ? 'text-white' : 'text-gray-400'
        }`}>
          {activity.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};
```

**WarioWareStatsCard.tsx**:
```typescript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

interface WarioWareStatsCardProps {
  distance: number;
  pace: number;
  time: number;
}

export const WarioWareStatsCard: React.FC<WarioWareStatsCardProps> = ({
  distance,
  pace,
  time
}) => {
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const formatPace = (paceInSeconds: number): string => {
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = Math.floor(paceInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View 
      style={animatedStyle}
      className="absolute top-4 left-4 right-4 bg-gradient-to-r from-surface/95 to-surfaceLight/95 
                 rounded-3xl p-6 border-4 border-secondary shadow-2xl"
    >
      <View className="flex-row justify-between items-center">
        <StatBubble 
          value={(distance / 1000).toFixed(2)} 
          unit="KM" 
          color="text-primary"
        />
        <StatBubble 
          value={formatPace(pace)} 
          unit="PACE" 
          color="text-success"
        />
        <StatBubble 
          value={formatTime(time)} 
          unit="TIME" 
          color="text-accent"
        />
      </View>
    </Animated.View>
  );
};

const StatBubble: React.FC<{
  value: string;
  unit: string;
  color: string;
}> = ({ value, unit, color }) => (
  <View className="items-center">
    <Text className={`text-3xl font-black ${color}`}>
      {value}
    </Text>
    <Text className="text-white text-sm font-bold">
      {unit}
    </Text>
  </View>
);
```

### **Phase 5: 3D Character Implementation (Day 4-5)**

#### Three.js Character (`src/components/three/RunningCharacter.tsx`)
```typescript
import React, { useRef } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ActivityType } from '../../types';

interface RunningCharacterProps {
  currentSpeed: number;
  activityType: ActivityType;
  celebrationTrigger: boolean;
  onCharacterTap: () => void;
}

const RunningCharacter3D = ({ currentSpeed, activityType, celebrationTrigger, onCharacterTap }) => {
  const bodyRef = useRef<THREE.Group>();
  const leftArmRef = useRef<THREE.Mesh>();
  const rightArmRef = useRef<THREE.Mesh>();
  const leftLegRef = useRef<THREE.Mesh>();
  const rightLegRef = useRef<THREE.Mesh>();

  useFrame((state, delta) => {
    if (!bodyRef.current) return;

    const runningSpeed = Math.max(currentSpeed * 2, 1);
    const time = state.clock.elapsedTime * runningSpeed;
    
    // Body bounce while running
    bodyRef.current.position.y = Math.abs(Math.sin(time * 4)) * 0.1;
    
    // Arms swinging
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(time * 4) * 0.8;
      rightArmRef.current.rotation.x = -Math.sin(time * 4) * 0.8;
    }
    
    // Legs running motion
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(time * 4) * 0.6;
      rightLegRef.current.rotation.x = -Math.sin(time * 4) * 0.6;
    }
    
    // Celebration animation - character jumps and spins
    if (celebrationTrigger) {
      bodyRef.current.position.y += Math.sin(time * 8) * 0.3;
      bodyRef.current.rotation.y += delta * 4;
    }
  });

  // Color changes based on activity type
  const getCharacterColor = () => {
    switch (activityType) {
      case 'run': return '#FF6B35';    // Vibrant orange
      case 'walk': return '#00D4AA';   // Bright teal  
      case 'bike': return '#C724B1';   // Magenta
      default: return '#FF6B35';
    }
  };

  return (
    <group ref={bodyRef} onClick={onCharacterTap}>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 1.5, 0.4]} />
        <meshStandardMaterial color={getCharacterColor()} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.6, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color={getCharacterColor()} />
      </mesh>

      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.6, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color={getCharacterColor()} />
      </mesh>

      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.3, -1.2, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#4A4A4A" />
      </mesh>

      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.3, -1.2, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#4A4A4A" />
      </mesh>
    </group>
  );
};

const BackgroundElements = () => {
  const cubeRef = useRef<THREE.Mesh>();
  const sphereRef = useRef<THREE.Mesh>();
  const cylinderRef = useRef<THREE.Mesh>();

  useFrame((state) => {
    if (cubeRef.current) {
      cubeRef.current.rotation.x += 0.01;
      cubeRef.current.rotation.y += 0.01;
    }
    if (sphereRef.current) {
      sphereRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2 + 1;
    }
    if (cylinderRef.current) {
      cylinderRef.current.rotation.z += 0.02;
    }
  });

  return (
    <>
      <mesh ref={cubeRef} position={[-2, 2, -1]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#F7931E" />
      </mesh>
      <mesh ref={sphereRef} position={[2, 1, -1]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#C724B1" />
      </mesh>
      <mesh ref={cylinderRef} position={[0, 3, -2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4]} />
        <meshStandardMaterial color="#00D4AA" />
      </mesh>
    </>
  );
};

export const ThreeJSCharacter: React.FC<RunningCharacterProps> = (props) => {
  return (
    <View className="flex-1">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <spotLight position={[0, 5, 5]} angle={0.3} intensity={0.5} />
        
        <RunningCharacter3D {...props} />
        <BackgroundElements />
      </Canvas>
    </View>
  );
};
```

### **Phase 6: Main Screens Implementation (Day 5-7)**

#### Active Workout Screen (Split Layout) (`src/screens/ActiveWorkoutScreen.tsx`)
```typescript
import React, { useEffect, useState, useMemo } from 'react';
import { View, Alert } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { ThreeJSCharacter } from '../components/three/RunningCharacter';
import { WarioWareStatsCard } from '../components/ui/WarioWareStatsCard';
import { WarioWareButton } from '../components/ui/WarioWareButton';
import { useWorkoutStore } from '../store/workoutStore';
import { useWorkoutTracking } from '../hooks/useWorkoutTracking';

export const ActiveWorkoutScreen: React.FC = () => {
  const { currentWorkout, isTracking, stopWorkout, pauseWorkout, resumeWorkout } = useWorkoutStore();
  const { startTracking, stopTracking } = useWorkoutTracking();
  const [isPaused, setIsPaused] = useState(false);
  const [milestoneReached, setMilestoneReached] = useState(false);

  // Calculate current speed from recent GPS points
  const currentSpeed = useMemo(() => {
    if (!currentWorkout?.gpsPoints || currentWorkout.gpsPoints.length < 2) return 0;
    
    const recentPoints = currentWorkout.gpsPoints.slice(-3);
    if (recentPoints.length < 2) return 0;
    
    const lastPoint = recentPoints[recentPoints.length - 1];
    const secondLastPoint = recentPoints[recentPoints.length - 2];
    
    const distance = DistanceCalculator.calculateDistance(secondLastPoint, lastPoint);
    const timeDiff = (lastPoint.timestamp.getTime() - secondLastPoint.timestamp.getTime()) / 1000;
    
    return distance / timeDiff; // m/s
  }, [currentWorkout?.gpsPoints]);

  // Route coordinates for map
  const routeCoordinates = useMemo(() => {
    return currentWorkout?.gpsPoints.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
    })) || [];
  }, [currentWorkout?.gpsPoints]);

  // Map region that follows user
  const mapRegion = useMemo(() => {
    if (!currentWorkout?.gpsPoints.length) return null;
    
    const lastPoint = currentWorkout.gpsPoints[currentWorkout.gpsPoints.length - 1];
    return {
      latitude: lastPoint.latitude,
      longitude: lastPoint.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [currentWorkout?.gpsPoints]);

  useEffect(() => {
    if (isTracking && !isPaused) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isTracking, isPaused]);

  // Check for milestones
  useEffect(() => {
    if (currentWorkout && currentWorkout.distance > 0) {
      const kmMilestone = Math.floor(currentWorkout.distance / 1000);
      if (kmMilestone > 0 && currentWorkout.distance % 1000 < 50) {
        setMilestoneReached(true);
        setTimeout(() => setMilestoneReached(false), 3000);
      }
    }
  }, [currentWorkout?.distance]);

  const handlePause = () => {
    setIsPaused(true);
    pauseWorkout();
  };

  const handleResume = () => {
    setIsPaused(false);
    resumeWorkout();
  };

  const handleStop = () => {
    Alert.alert(
      'End Workout',
      'Are you sure you want to end this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Workout', 
          style: 'destructive',
          onPress: () => {
            stopWorkout();
            stopTracking();
          }
        },
      ]
    );
  };

  const handleCharacterTap = () => {
    // Trigger a fun animation or encouragement
    setMilestoneReached(true);
    setTimeout(() => setMilestoneReached(false), 1000);
  };

  if (!currentWorkout) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-white text-xl">No active workout</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Top Half - Live Map */}
      <View className="flex-1">
        {mapRegion && (
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            showsUserLocation={true}
            followsUserLocation={true}
            showsMyLocationButton={false}
            toolbarEnabled={false}
          >
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#FF6B35"
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>
        )}
        
        {/* Floating Stats Overlay */}
        <WarioWareStatsCard
          distance={currentWorkout.distance}
          pace={currentWorkout.avgPace}
          time={currentWorkout.duration}
        />
      </View>
      
      {/* Bottom Half - 3D Character */}
      <View className="flex-1 relative">
        <ThreeJSCharacter
          currentSpeed={currentSpeed}
          activityType={currentWorkout.type}
          celebrationTrigger={milestoneReached}
          onCharacterTap={handleCharacterTap}
        />
        
        {/* Control Buttons */}
        <View className="absolute bottom-8 left-4 right-4">
          <View className="flex-row justify-center space-x-4">
            {isPaused ? (
              <WarioWareButton
                title="RESUME"
                onPress={handleResume}
                variant="primary"
                size="lg"
              />
            ) : (
              <WarioWareButton
                title="PAUSE"
                onPress={handlePause}
                variant="secondary"
                size="lg"
              />
            )}
            <WarioWareButton
              title="STOP"
              onPress={handleStop}
              variant="danger"
              size="lg"
            />
          </View>
        </View>
      </View>
    </View>
  );
};
```

#### Home Screen (`src/screens/HomeScreen.tsx`)
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ActivityTypeSelector } from '../components/ui/ActivityTypeSelector';
import { WarioWareButton } from '../components/ui/WarioWareButton';
import { useWorkoutStore } from '../store/workoutStore';
import { ActivityType } from '../types';
import { FlashList } from '@shopify/flash-list';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { startWorkout, workoutHistory, loadWorkoutHistory } = useWorkoutStore();
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('run');

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const handleStartWorkout = () => {
    startWorkout(selectedActivity);
    navigation.navigate('ActiveWorkout');
  };

  const recentWorkouts = workoutHistory.slice(0, 3);
  const thisWeekDistance = workoutHistory
    .filter(workout => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(workout.startTime) > weekAgo;
    })
    .reduce((total, workout) => total + workout.distance, 0);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        {/* Header */}
        <View className="items-center mb-8 mt-8">
          <Text className="text-4xl font-black text-primary mb-2">
            FITTRACKER
          </Text>
          <Text className="text-white text-lg">
            Ready to get moving?
          </Text>
        </View>

        {/* Activity Selector */}
        <ActivityTypeSelector
          selectedType={selectedActivity}
          onTypeSelect={setSelectedActivity}
        />

        {/* Start Workout Button */}
        <View className="mb-8">
          <WarioWareButton
            title="START WORKOUT!"
            onPress={handleStartWorkout}
            size="lg"
          />
        </View>

        {/* Quick Stats */}
        <View className="bg-surface rounded-3xl p-6 mb-6 border-4 border-gray-600">
          <Text className="text-white text-xl font-bold mb-4 text-center">
            THIS WEEK
          </Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-3xl font-black text-primary">
                {(thisWeekDistance / 1000).toFixed(1)}
              </Text>
              <Text className="text-gray-400 font-bold">KM</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-black text-success">
                {workoutHistory.length}
              </Text>
              <Text className="text-gray-400 font-bold">WORKOUTS</Text>
            </View>
          </View>
        </View>

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">
              Recent Workouts
            </Text>
            {recentWorkouts.map((workout) => (
              <RecentWorkoutCard key={workout.id} workout={workout} />
            ))}
            
            <WarioWareButton
              title="VIEW ALL"
              onPress={() => navigation.navigate('WorkoutHistory')}
              variant="secondary"
              size="md"
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const RecentWorkoutCard: React.FC<{ workout: Workout }> = ({ workout }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'walk': return '🚶';
      case 'run': return '🏃';
      case 'bike': return '🚴';
    }
  };

  return (
    <View className="bg-surface rounded-2xl p-4 mb-3 border-2 border-gray-600">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Text className="text-2xl mr-3">{getActivityIcon(workout.type)}</Text>
          <View>
            <Text className="text-white font-bold capitalize">
              {workout.type}
            </Text>
            <Text className="text-gray-400">
              {formatDate(workout.startTime)}
            </Text>
          </View>
        </View>
        <Text className="text-primary text-xl font-black">
          {(workout.distance / 1000).toFixed(2)} km
        </Text>
      </View>
    </View>
  );
};
```

#### Workout History Screen (`src/screens/WorkoutHistoryScreen.tsx`)
```typescript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useWorkoutStore } from '../store/workoutStore';
import { AnimatedWorkoutCard } from '../components/workout/AnimatedWorkoutCard';

export const WorkoutHistoryScreen: React.FC = () => {
  const { workoutHistory, loadWorkoutHistory } = useWorkoutStore();

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  if (workoutHistory.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-white text-2xl font-bold text-center mb-4">
          No workouts yet!
        </Text>
        <Text className="text-gray-400 text-center">
          Start your first workout to see your progress here.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlashList
        data={workoutHistory}
        renderItem={({ item, index }) => (
          <AnimatedWorkoutCard 
            workout={item} 
            index={index}
            onPress={() => {/* Navigate to detail */}}
          />
        )}
        estimatedItemSize={140}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};
```

### **Phase 7: Integration & Background Tasks (Day 7-8)**

#### Background Task Setup (`src/services/backgroundService.ts`)
```typescript
import BackgroundActions from 'react-native-background-actions';
import { useWorkoutStore } from '../store/workoutStore';
import { DistanceCalculator } from '../utils/distanceCalculator';

export class BackgroundWorkoutService {
  private static updateInterval: NodeJS.Timeout | null = null;

  static async startBackgroundTracking() {
    const veryImportantTask = async (taskDataArguments) => {
      const { delay } = taskDataArguments;
      
      await new Promise(async (resolve) => {
        for (let i = 0; BackgroundActions.isRunning(); i++) {
          await this.backgroundTick();
          await BackgroundActions.sleep(delay);
        }
      });
    };

    const options = {
      taskName: 'WorkoutTracking',
      taskTitle: 'Tracking your workout...',
      taskDesc: 'Recording distance and route',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      parameters: {
        delay: 8000,
      },
    };

    await BackgroundActions.start(veryImportantTask, options);
  }

  static stopBackgroundTracking() {
    BackgroundActions.stop();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private static async backgroundTick() {
    try {
      // Update workout duration
      const store = useWorkoutStore.getState();
      const { currentWorkout, updateWorkoutData } = store;
      
      if (currentWorkout && currentWorkout.isActive) {
        const now = new Date();
        const duration = Math.floor((now.getTime() - new Date(currentWorkout.startTime).getTime()) / 1000);
        
        // Calculate updated stats
        const totalDistance = DistanceCalculator.calculateTotalDistance(currentWorkout.gpsPoints);
        const avgPace = DistanceCalculator.calculatePace(totalDistance, duration);
        
        updateWorkoutData({
          duration,
          distance: totalDistance,
          avgPace,
        });
      }
    } catch (error) {
      console.error('Background tick error:', error);
    }
  }
}
```

#### Custom Hooks (`src/hooks/`)

**useWorkoutTracking.ts**:
```typescript
import { useState, useCallback } from 'react';
import { GPSService } from '../services/gpsService';
import { BackgroundWorkoutService } from '../services/backgroundService';
import { useWorkoutStore } from '../store/workoutStore';
import { DistanceCalculator } from '../utils/distanceCalculator';

export const useWorkoutTracking = () => {
  const [gpsService] = useState(() => new GPSService(handleLocationUpdate));
  const { currentWorkout, updateWorkoutData } = useWorkoutStore();

  const handleLocationUpdate = useCallback((location: GpsPoint) => {
    if (!currentWorkout || !currentWorkout.isActive) return;

    const updatedGpsPoints = [...currentWorkout.gpsPoints, location];
    const totalDistance = DistanceCalculator.calculateTotalDistance(updatedGpsPoints);
    const duration = Math.floor((new Date().getTime() - new Date(currentWorkout.startTime).getTime()) / 1000);
    const avgPace = DistanceCalculator.calculatePace(totalDistance, duration);

    // Calculate max speed
    let maxSpeed = currentWorkout.maxSpeed;
    if (updatedGpsPoints.length >= 2) {
      const lastTwoPoints = updatedGpsPoints.slice(-2);
      const distance = DistanceCalculator.calculateDistance(lastTwoPoints[0], lastTwoPoints[1]);
      const timeDiff = (lastTwoPoints[1].timestamp.getTime() - lastTwoPoints[0].timestamp.getTime()) / 1000;
      const currentSpeed = distance / timeDiff;
      maxSpeed = Math.max(maxSpeed, currentSpeed);
    }

    updateWorkoutData({
      gpsPoints: updatedGpsPoints,
      distance: totalDistance,
      duration,
      avgPace,
      maxSpeed,
    });
  }, [currentWorkout, updateWorkoutData]);

  const startTracking = useCallback(async () => {
    try {
      await gpsService.startTracking();
      await BackgroundWorkoutService.startBackgroundTracking();
    } catch (error) {
      console.error('Failed to start tracking:', error);
      throw error;
    }
  }, [gpsService]);

  const stopTracking = useCallback(() => {
    gpsService.stopTracking();
    BackgroundWorkoutService.stopBackgroundTracking();
  }, [gpsService]);

  return {
    startTracking,
    stopTracking,
    currentWorkout,
  };
};
```

**useAnimatedWorkout.ts**:
```typescript
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export const useAnimatedWorkout = (workout: Workout, index: number) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scale.value) },
      { translateY: withSpring(translateY.value) }
    ],
    opacity: withTiming(opacity.value, { duration: 300 }),
  }));

  useEffect(() => {
    // Staggered entrance animation
    const delay = index * 100;
    setTimeout(() => {
      scale.value = 1;
      opacity.value = 1;
      translateY.value = 0;
    }, delay);
  }, [index]);

  const handlePressIn = () => {
    scale.value = 0.95;
  };

  const handlePressOut = () => {
    scale.value = 1;
  };

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
};
```

### **Phase 8: Polish & Performance (Day 8-9)**

#### Performance Optimizations (`src/components/workout/AnimatedWorkoutCard.tsx`)
```typescript
import React, { memo } from 'react';
import { Pressable, View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAnimatedWorkout } from '../../hooks/useAnimatedWorkout';
import { Workout, ActivityType } from '../../types';

interface AnimatedWorkoutCardProps {
  workout: Workout;
  index: number;
  onPress: () => void;
}

export const AnimatedWorkoutCard = memo<AnimatedWorkoutCardProps>(({ 
  workout, 
  index, 
  onPress 
}) => {
  const { animatedStyle, handlePressIn, handlePressOut } = useAnimatedWorkout(workout, index);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'walk': return 'directions-walk';
      case 'run': return 'directions-run';
      case 'bike': return 'directions-bike';
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'walk': return '#00D4AA';
      case 'run': return '#FF6B35';
      case 'bike': return '#C724B1';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatPace = (paceInSeconds: number) => {
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = Math.floor(paceInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Pressable 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut} 
      onPress={onPress}
    >
      <Animated.View 
        style={animatedStyle}
        className="bg-surface rounded-3xl p-6 mx-4 mb-4 border-4 border-gray-600 shadow-2xl"
      >
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View 
              className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: `${getActivityColor(workout.type)}20` }}
            >
              <Icon 
                name={getActivityIcon(workout.type)} 
                size={32} 
                color={getActivityColor(workout.type)} 
              />
            </View>
            <View>
              <Text className="text-xl font-bold text-white capitalize">
                {workout.type}
              </Text>
              <Text className="text-gray-400 font-medium">
                {formatDate(workout.startTime)}
              </Text>
            </View>
          </View>
          <Text className="text-3xl font-black" style={{ color: getActivityColor(workout.type) }}>
            {(workout.distance / 1000).toFixed(2)}
          </Text>
        </View>
        
        <View className="flex-row justify-between">
          <StatItem 
            label="Duration" 
            value={formatDuration(workout.duration)} 
          />
          <StatItem 
            label="Avg Pace" 
            value={formatPace(workout.avgPace)} 
          />
          <StatItem 
            label="Max Speed" 
            value={`${(workout.maxSpeed * 3.6).toFixed(1)} km/h`} 
          />
        </View>
      </Animated.View>
    </Pressable>
  );
});

const StatItem: React.FC<{ label: string; value: string }> = memo(({ label, value }) => (
  <View className="items-center">
    <Text className="text-white text-lg font-bold">
      {value}
    </Text>
    <Text className="text-gray-400 text-sm font-medium">
      {label}
    </Text>
  </View>
));
```

### **Phase 9: Testing & Platform Setup (Day 9-10)**

#### Platform Configuration

**iOS Setup (`ios/FitTracker/Info.plist`)**:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to track your workouts.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs location access to track your workouts even when in the background.</string>
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
    <string>background-processing</string>
</array>
```

**Android Setup (`android/app/src/main/AndroidManifest.xml`)**:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

<service android:name="com.swmansion.backgroundtasks.BackgroundTasksService" />
```

#### Final Integration (`App.tsx`)
```typescript
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HomeScreen } from './src/screens/HomeScreen';
import { ActiveWorkoutScreen } from './src/screens/ActiveWorkoutScreen';
import { WorkoutHistoryScreen } from './src/screens/WorkoutHistoryScreen';
import { useWorkoutStore } from './src/store/workoutStore';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  const { loadWorkoutHistory } = useWorkoutStore();

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: { backgroundColor: '#1A1A2E' },
              headerTintColor: '#FF6B35',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'FitTracker' }}
            />
            <Stack.Screen 
              name="ActiveWorkout" 
              component={ActiveWorkoutScreen}
              options={{ 
                title: 'Active Workout',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen 
              name="WorkoutHistory" 
              component={WorkoutHistoryScreen}
              options={{ title: 'Workout History' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
```

## **Claude Code Integration Points**

### **Ideal Cascading Development Workflow:**

1. **Start with store and types** - Get the data architecture right first
2. **Build GPS service** - Core functionality foundation  
3. **Create base UI components** - Reusable WarioWare elements
4. **Implement 3D character** - Most complex visual element
5. **Assemble screens** - Combine all components
6. **Add background tasks** - Platform-specific functionality
7. **Polish and optimize** - Performance and user experience

### **Claude Code Prompts for Each Phase:**

```bash
# Phase 1: Setup
"Set up React Native TypeScript project with the exact dependencies from the implementation plan"

# Phase 2: Architecture  
"Create Zustand store for workout tracking with MMKV persistence as specified"

# Phase 3: Core Services
"Implement GPS service with debounced location updates and permission handling"

# Phase 4: UI Components
"Build WarioWare-style button component with Reanimated spring animations"

# Phase 5: 3D Character
"Create Three.js running character with speed-synced animation using @react-three/fiber"

# Phase 6: Screens
"Build active workout screen with split layout - map on top, 3D character on bottom"

# Phase 7: Background Tasks
"Implement background workout tracking service using react-native-background-actions"

# Phase 8: Polish
"Add WarioWare-style animations and micro-interactions throughout the app"
```

### **Testing Checklist:**

**Day 9:**
- [ ] GPS accuracy testing in different environments
- [ ] Background task functionality on both platforms
- [ ] Battery usage profiling with Flipper
- [ ] Memory leak detection during long workouts
- [ ] Animation performance at 60fps
- [ ] MMKV storage persistence across app restarts

**Day 10:**
- [ ] End-to-end workout flow testing
- [ ] Platform-specific permission flows
- [ ] App store compliance review
- [ ] Performance optimization final pass
- [ ] Error boundary implementation
- [ ] Accessibility testing

This comprehensive plan gives you a clear 10-day roadmap with each component building on the previous ones. The cascading approach means you can test each piece individually before integration, making debugging much easier and ensuring a robust WarioWare-inspired fitness tracking experience!