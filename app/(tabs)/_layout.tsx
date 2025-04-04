import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthStore } from "../../store/authStore";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuthStore();

  // Define the primary color for our tab bar
  const primaryColor = "#2a9d8f";
  // Define header background color (same as primary for consistency)
  const headerBgColor = primaryColor;

  // For debugging
  useEffect(() => {
    console.log(`Tab layout rendered. isAuthenticated: ${isAuthenticated}`);
  }, [isAuthenticated]);

  // Use a consistent screen setup regardless of auth state,
  // but configure tab bar visibility based on authentication
  return (
    <>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: Constants.statusBarHeight,
          backgroundColor: headerBgColor,
          zIndex: 9999,
        }}
      />
      <StatusBar style="light" backgroundColor={headerBgColor} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: primaryColor,
          tabBarInactiveTintColor: "#9ca3af",
          headerShown: false,
          // Only show tab bar when authenticated
          tabBarStyle: isAuthenticated
            ? {
                height: 70,
                paddingVertical: 10,
                backgroundColor: "white",
                borderTopWidth: 1,
                borderTopColor: "#e5e7eb",
                elevation: 0,
                shadowOpacity: 0,
              }
            : { display: "none" },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            paddingBottom: 6,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <IconSymbol name="house" color={color} size={24} />
            ),
            tabBarLabel: "Home",
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Printer",
            tabBarIcon: ({ color, size }) => (
              <IconSymbol name="printer" color={color} size={24} />
            ),
            tabBarLabel: "Printer",
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <IconSymbol name="clock" color={color} size={24} />
            ),
            tabBarLabel: "History",
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <IconSymbol name="gearshape" color={color} size={24} />
            ),
            tabBarLabel: "Settings",
          }}
        />
      </Tabs>
    </>
  );
}
