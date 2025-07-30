import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // MODIFICATION START
        // Set the active and inactive icon colors for better contrast on a dark background
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888', // A light gray for inactive icons
        // MODIFICATION END

        headerShown: false,
        tabBarButton: HapticTab,
        //tabBarBackground: TabBarBackground,
        // MODIFICATION START
        // Set the background to the dark green color from your chatbot header/messages
        tabBarStyle: {
          backgroundColor: '#32B568',
          position: 'absolute',
        },
        // MODIFICATION END
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="exclamationmark.bubble.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'Chatbot',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
// This file is part of the Transit Guards app, which provides a tabbed navigation layout
// for the application using Expo Router and React Native components.
// It defines the main tab layout with icons and styles, utilizing custom components for haptic feedback
// and background styling. The color scheme is dynamically applied based on the user's preference.
// The tabs now include Home, Search, Report, Notification, and Chatbot, each with its own icon and title.
// The layout is designed to be responsive across different platforms, with specific styles for iOS.
// The HapticTab component enhances user interaction with tactile feedback, and IconSymbol ensures consistent tab icons.