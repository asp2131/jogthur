import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WarioWareColors, TextStyles } from '@/src/styles/WarioWareTheme';

// This tab is no longer used - keeping for compatibility
export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This tab is no longer used</Text>
      <Text style={styles.subtitle}>Please use the new tab structure</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WarioWareColors.neutral.background,
  },
  title: {
    ...TextStyles.title,
    color: WarioWareColors.neutral.white,
  },
  subtitle: {
    ...TextStyles.body,
    color: WarioWareColors.neutral.lightGray,
    marginTop: 16,
  },
});
