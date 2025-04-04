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
} from "react-native";
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Logged in as: {user}</Text>
      </View>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4a80f5",
    borderRadius: 4,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dangerButton: {
    backgroundColor: "#e53935",
  },
  warning: {
    color: "#e53935",
    fontSize: 14,
    marginTop: 8,
  },
});

export default SettingsScreen;
