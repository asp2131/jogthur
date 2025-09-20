import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  Switch,
  Easing
} from 'react-native';
import { EnhancedWarioWareButton } from '@/src/components/EnhancedWarioWareButton';
import { ScreenTransition, useScreenShake } from '@/src/components/WarioWareAnimations';
import { 
  WarioWareColors, 
  TextStyles, 
  LayoutPresets,
  WarioWareSpacing,
  WarioWareBorderRadius,
  WarioWareShadows
} from '@/src/styles/WarioWareTheme';

interface SettingItemProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  delay: number;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  value,
  onValueChange,
  delay
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 8,
        useNativeDriver: true
      }).start();
    }, delay);
  }, [scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.settingItem,
        {
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: WarioWareColors.neutral.darkGray,
          true: WarioWareColors.primary.green
        }}
        thumbColor={value ? WarioWareColors.primary.yellow : WarioWareColors.neutral.lightGray}
        ios_backgroundColor={WarioWareColors.neutral.darkGray}
      />
    </Animated.View>
  );
};

export default function SettingsScreen() {
  const [screenVisible, setScreenVisible] = useState(true);
  const [settings, setSettings] = useState({
    units: true, // true = metric, false = imperial
    hapticFeedback: true,
    soundEffects: true,
    animations: true,
    backgroundTracking: true,
    autoStart: false
  });

  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Custom hooks
  const { shakeAnim, triggerShake } = useScreenShake();

  // Entry animations
  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleSettingChange = (key: keyof typeof settings) => (value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    triggerShake(2, 100);
  };

  const handleResetSettings = () => {
    triggerShake(8, 400);
    setSettings({
      units: true,
      hapticFeedback: true,
      soundEffects: true,
      animations: true,
      backgroundTracking: true,
      autoStart: false
    });
  };

  return (
    <ScreenTransition isVisible={screenVisible} transitionType="zoom">
      <SafeAreaView style={[styles.container, LayoutPresets.container]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateX: shakeAnim }]
            }
          ]}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerAnim,
                transform: [{
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={[styles.title, { color: WarioWareColors.primary.purple }]}>
              SETTINGS
            </Text>
            <Text style={styles.subtitle}>
              Customize your fitness experience
            </Text>
          </Animated.View>

          {/* Settings Content */}
          <Animated.View
            style={[
              styles.settingsContent,
              { opacity: contentAnim }
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Units Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>UNITS & DISPLAY</Text>
                
                <SettingItem
                  title="Metric Units"
                  description="Use kilometers and celsius (km, °C)"
                  value={settings.units}
                  onValueChange={handleSettingChange('units')}
                  delay={0}
                />
              </View>

              {/* Feedback Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>FEEDBACK & EFFECTS</Text>
                
                <SettingItem
                  title="Haptic Feedback"
                  description="Feel vibrations on button presses"
                  value={settings.hapticFeedback}
                  onValueChange={handleSettingChange('hapticFeedback')}
                  delay={100}
                />
                
                <SettingItem
                  title="Sound Effects"
                  description="Play WarioWare-style sound effects"
                  value={settings.soundEffects}
                  onValueChange={handleSettingChange('soundEffects')}
                  delay={200}
                />
                
                <SettingItem
                  title="Animations"
                  description="Enable bouncy WarioWare animations"
                  value={settings.animations}
                  onValueChange={handleSettingChange('animations')}
                  delay={300}
                />
              </View>

              {/* Tracking Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>WORKOUT TRACKING</Text>
                
                <SettingItem
                  title="Background Tracking"
                  description="Continue tracking when app is minimized"
                  value={settings.backgroundTracking}
                  onValueChange={handleSettingChange('backgroundTracking')}
                  delay={400}
                />
                
                <SettingItem
                  title="Auto-Start Workouts"
                  description="Automatically start tracking when moving"
                  value={settings.autoStart}
                  onValueChange={handleSettingChange('autoStart')}
                  delay={500}
                />
              </View>

              {/* Activity Type Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DEFAULT ACTIVITY</Text>
                
                <View style={styles.activityButtons}>
                  <EnhancedWarioWareButton
                    title="WALK"
                    onPress={() => triggerShake(3, 150)}
                    variant="secondary"
                    size="medium"
                    shakeOnPress={true}
                    style={styles.activityButton}
                  />
                  
                  <EnhancedWarioWareButton
                    title="RUN"
                    onPress={() => triggerShake(3, 150)}
                    variant="primary"
                    size="medium"
                    pulse={true}
                    shakeOnPress={true}
                    style={styles.activityButton}
                  />
                  
                  <EnhancedWarioWareButton
                    title="BIKE"
                    onPress={() => triggerShake(3, 150)}
                    variant="secondary"
                    size="medium"
                    shakeOnPress={true}
                    style={styles.activityButton}
                  />
                </View>
              </View>

              {/* Character Theme Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>CHARACTER THEME</Text>
                
                <View style={styles.themeGrid}>
                  {['🏃', '🤖', '🦸', '🧙'].map((emoji, index) => (
                    <EnhancedWarioWareButton
                      key={index}
                      title={emoji}
                      onPress={() => triggerShake(2, 100)}
                      variant={index === 0 ? 'neon' : 'secondary'}
                      size="medium"
                      pulse={index === 0}
                      shakeOnPress={true}
                      style={styles.themeButton}
                    />
                  ))}
                </View>
              </View>

              {/* Reset Button */}
              <View style={styles.resetSection}>
                <EnhancedWarioWareButton
                  title="RESET TO DEFAULTS"
                  onPress={handleResetSettings}
                  variant="danger"
                  size="large"
                  explode={true}
                  shakeOnPress={true}
                  style={styles.resetButton}
                />
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    padding: WarioWareSpacing.xl,
    paddingTop: WarioWareSpacing.lg
  },
  title: {
    ...TextStyles.title,
    fontSize: 32,
    marginBottom: WarioWareSpacing.sm,
    letterSpacing: 2
  },
  subtitle: {
    ...TextStyles.body,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: WarioWareSpacing.lg
  },
  section: {
    marginBottom: WarioWareSpacing.xl
  },
  sectionTitle: {
    ...TextStyles.subtitle,
    fontSize: 16,
    marginBottom: WarioWareSpacing.md,
    color: WarioWareColors.primary.yellow,
    letterSpacing: 1
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: WarioWareBorderRadius.medium,
    padding: WarioWareSpacing.md,
    marginBottom: WarioWareSpacing.sm,
    ...WarioWareShadows.small
  },
  settingContent: {
    flex: 1,
    marginRight: WarioWareSpacing.md
  },
  settingTitle: {
    ...TextStyles.body,
    fontSize: 16,
    fontWeight: '700',
    color: WarioWareColors.neutral.white,
    marginBottom: 4
  },
  settingDescription: {
    ...TextStyles.label,
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16
  },
  activityButtons: {
    flexDirection: 'row',
    gap: WarioWareSpacing.sm
  },
  activityButton: {
    flex: 1
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: WarioWareSpacing.sm
  },
  themeButton: {
    width: '22%',
    aspectRatio: 1
  },
  resetSection: {
    alignItems: 'center',
    paddingVertical: WarioWareSpacing.xl
  },
  resetButton: {
    minWidth: 200
  }
});
