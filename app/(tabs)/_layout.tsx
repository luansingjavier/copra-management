import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthStore } from "../../store/authStore";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuthStore();

  // For debugging
  useEffect(() => {
    console.log(`Tab layout rendered. isAuthenticated: ${isAuthenticated}`);
  }, [isAuthenticated]);

  // Use a consistent screen setup regardless of auth state,
  // but configure tab bar visibility based on authentication
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        // Only show tab bar when authenticated
        tabBarStyle: isAuthenticated ? undefined : { display: "none" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol name="house" color={color} />,
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Printer",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="printer" color={color} />
          ),
          tabBarLabel: "Printer",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <IconSymbol name="clock" color={color} />,
          tabBarLabel: "History",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="gearshape" color={color} />
          ),
          tabBarLabel: "Settings",
        }}
      />
    </Tabs>
  );
}
