import React, { useEffect } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { router } from "expo-router";
import LoginScreen from "../components/LoginScreen";
import { useAuthStore } from "../store/authStore";

export default function App() {
  const { isAuthenticated } = useAuthStore();

  // If already authenticated, redirect to the tabs
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Root index: Already authenticated, redirecting to tabs");
      router.replace("/(tabs)");
    } else {
      console.log("Root index: Not authenticated, showing login screen");
    }
  }, [isAuthenticated]);

  return (
    <SafeAreaView style={styles.container}>
      <LoginScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
