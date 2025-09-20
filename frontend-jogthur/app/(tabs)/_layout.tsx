import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { WarioWareColors } from '@/src/styles/WarioWareTheme';

// WarioWare-style tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: WarioWareColors.primary.yellow,
        tabBarInactiveTintColor: WarioWareColors.neutral.lightGray,
        tabBarStyle: {
          backgroundColor: WarioWareColors.neutral.surface,
          borderTopWidth: 3,
          borderTopColor: WarioWareColors.primary.yellow,
          height: 90,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1,
        },
        headerShown: false, // We'll handle headers in individual screens
      }}>
      
      {/* Home Tab - Quick access to start workouts */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      
      {/* Active Workout Tab - Real-time tracking */}
      <Tabs.Screen
        name="workout"
        options={{
          title: 'WORKOUT',
          tabBarIcon: ({ color }) => <TabBarIcon name="play-circle" color={color} />,
        }}
      />
      
      {/* History Tab - Past workouts */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'HISTORY',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      
      {/* Settings Tab - User preferences */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'SETTINGS',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
