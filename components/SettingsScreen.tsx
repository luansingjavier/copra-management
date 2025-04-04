import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
} from "react-native";
import Constants from "expo-constants";
import { useAuthStore } from "../store/authStore";
import {
  resetDatabase,
  registerUser,
  getAllUsers,
  saveDefaultSettings,
  getDefaultSettings,
} from "../database/database";

const SettingsScreen = () => {
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [defaultCopraPrice, setDefaultCopraPrice] = useState("0");
  const [defaultTransportationFee, setDefaultTransportationFee] = useState("0");
  const [isSaving, setIsSaving] = useState(false);

  // Load current default values when component mounts
  useEffect(() => {
    loadDefaultValues();
  }, []);

  // Load default values from database
  const loadDefaultValues = async () => {
    try {
      const defaults = await getDefaultSettings();
      setDefaultCopraPrice(defaults.copraPrice);
      setDefaultTransportationFee(defaults.transportationFee);
    } catch (error) {
      console.error("Error loading default settings:", error);
    }
  };

  // Save default values to database
  const saveDefaults = async () => {
    setIsSaving(true);

    try {
      await saveDefaultSettings(defaultCopraPrice, defaultTransportationFee);

      Alert.alert("Success", "Default values saved successfully.", [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error saving default values:", error);
      Alert.alert("Error", "Failed to save default values.", [{ text: "OK" }]);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset database and re-add default users
  const handleResetDatabase = async () => {
    // First confirm with the user
    Alert.alert(
      "Reset Database",
      "This will reset all data including users and settings. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              // The resetDatabase function now directly handles default data creation
              await resetDatabase();

              // Refresh the settings after reset
              await loadDefaultValues();

              // Force logout since database was reset
              logout();

              Alert.alert(
                "Success",
                "Database reset complete. You will need to login again.",
                [
                  {
                    text: "OK",
                  },
                ]
              );
            } catch (err) {
              console.error("Error in reset:", err);
              const errorMessage =
                err instanceof Error ? err.message : "Unknown error";
              Alert.alert("Error", `Failed to reset database: ${errorMessage}`);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Values</Text>
          <Text style={styles.label}>Default Copra Price (per kg)</Text>
          <TextInput
            style={styles.input}
            value={defaultCopraPrice}
            onChangeText={setDefaultCopraPrice}
            keyboardType="numeric"
            placeholder="Enter default copra price"
          />

          <Text style={styles.label}>Default Transportation Fee</Text>
          <TextInput
            style={styles.input}
            value={defaultTransportationFee}
            onChangeText={setDefaultTransportationFee}
            keyboardType="numeric"
            placeholder="Enter default transportation fee"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={saveDefaults}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Default Values</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Management</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleResetDatabase}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reset Database</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.warning}>
            Warning: This will reset all data and add default users.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#2a9d8f",
    padding: 16,
    paddingTop: 0,
    marginTop: -Constants.statusBarHeight,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 90 + Constants.statusBarHeight,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 35 + Constants.statusBarHeight,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#4b5563",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  button: {
    backgroundColor: "#2a9d8f",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 8,
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: "#ef4444",
  },
  warning: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
  },
});

export default SettingsScreen;
