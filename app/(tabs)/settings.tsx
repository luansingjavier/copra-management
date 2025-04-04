import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import LoginScreen from "../../components/LoginScreen";
import SettingsScreen from "../../components/SettingsScreen";

function Settings() {
  const { isAuthenticated } = useAuthStore();

  console.log("Settings screen rendered, isAuthenticated:", isAuthenticated);

  // When not authenticated, show login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // When authenticated, show settings screen wrapped in SafeAreaView
  return (
    <SafeAreaView style={styles.safeArea}>
      <SettingsScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default Settings;
