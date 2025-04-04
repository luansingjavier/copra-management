import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { router } from "expo-router";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Constants from "expo-constants";

// Simple localStorage implementation that works without native modules
// This is only for demonstration and doesn't persist across app restarts
const localStorage = {
  _store: {} as Record<string, string>,
  setItem(key: string, value: string) {
    this._store[key] = value;
    return Promise.resolve();
  },
  getItem(key: string) {
    return Promise.resolve(this._store[key] || null);
  },
  removeItem(key: string) {
    delete this._store[key];
    return Promise.resolve();
  },
};

// Storage keys
const USERNAME_KEY = "@LuansingRiceMill:username";
const PASSWORD_KEY = "@LuansingRiceMill:password";
const REMEMBER_ME_KEY = "@LuansingRiceMill:rememberMe";

// Login validation schema
const loginSchema = yup.object().shape({
  username: yup.string().required("Username is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

// Form data type
type LoginFormData = {
  username: string;
  password: string;
};

const LoginScreen = () => {
  const [debugMsg, setDebugMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const hasNavigated = useRef(false);

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Load saved credentials on initial render if remember me was enabled
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        // Check if remember me is enabled
        const rememberMeValue = await localStorage.getItem(REMEMBER_ME_KEY);

        if (rememberMeValue === "true") {
          const savedUsername = await localStorage.getItem(USERNAME_KEY);
          const savedPassword = await localStorage.getItem(PASSWORD_KEY);

          if (savedUsername && savedPassword) {
            setValue("username", savedUsername);
            setValue("password", savedPassword);
            setRememberMe(true);
            console.log("Loaded saved credentials for", savedUsername);
          }
        }
      } catch (error) {
        console.error("Error loading saved credentials:", error);
      }
    };

    loadSavedCredentials();
  }, [setValue]);

  // Reset fields when showing the login screen
  useEffect(() => {
    if (!isAuthenticated) {
      // Don't reset if remember me is enabled
      if (!rememberMe) {
        reset();
      }
      setDebugMsg("");
      // Reset navigation flag when logging out
      hasNavigated.current = false;
    }
  }, [isAuthenticated, reset, rememberMe]);

  // Debug effect for authentication state - only log changes, don't navigate in here
  useEffect(() => {
    console.log("LoginScreen - Auth state:", { isAuthenticated });
  }, [isAuthenticated]);

  // Separate navigation effect to prevent infinite loops
  useEffect(() => {
    // Only navigate once when authenticated
    if (isAuthenticated && !hasNavigated.current) {
      console.log("LoginScreen - Navigation triggered");
      hasNavigated.current = true;

      // Navigate after a brief delay to ensure state is stable
      const timer = setTimeout(() => {
        console.log("Navigating to home route");
        router.replace("/(tabs)");
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const onSubmit = async (data: LoginFormData) => {
    setDebugMsg(`Attempting login with: ${data.username}`);

    try {
      const success = await login(data.username, data.password);

      // Save credentials if remember me is checked
      if (success) {
        if (rememberMe) {
          // Save credentials to localStorage
          await localStorage.setItem(USERNAME_KEY, data.username);
          await localStorage.setItem(PASSWORD_KEY, data.password);
          await localStorage.setItem(REMEMBER_ME_KEY, "true");
          console.log("Credentials saved for", data.username);
        } else {
          // Clear any previously saved credentials
          await localStorage.removeItem(USERNAME_KEY);
          await localStorage.removeItem(PASSWORD_KEY);
          await localStorage.removeItem(REMEMBER_ME_KEY);
          console.log("Saved credentials cleared");
        }
      }

      setDebugMsg(
        success
          ? "Login successful! Redirecting..."
          : "Login failed - invalid credentials"
      );

      // Do not navigate here - let the useEffect handle navigation
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Login error:", errorMsg);
      setDebugMsg(`Login error: ${errorMsg}`);
    }
  };

  // Helper text for testing
  // Commented out for security in production
  // const loginHelp = "Use: luansingjavier / thgirb11";
  const loginHelp = "";

  // Function to toggle remember me state
  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Luansing Rice Mill</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            {/* Replace with actual eagle logo when available */}
            <Text style={styles.logoPlaceholder}>🦅</Text>
          </View>
          <Text style={styles.logoTagline}>Quality Service Since 1975</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Login to Your Account</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      errors.username ? styles.inputError : null,
                    ]}
                    placeholder="Enter your username"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                  />
                  {errors.username && (
                    <Text style={styles.errorText}>
                      {errors.username.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      errors.password ? styles.inputError : null,
                    ]}
                    placeholder="Enter your password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Remember Me Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={toggleRememberMe}
            activeOpacity={0.7}
          >
            <View
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
            >
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Remember Me</Text>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Only show help text if it's not empty */}
          {loginHelp ? <Text style={styles.helpText}>{loginHelp}</Text> : null}

          {debugMsg ? <Text style={styles.debugText}>{debugMsg}</Text> : null}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
    height: 80 + Constants.statusBarHeight,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginTop: 35 + Constants.statusBarHeight,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#2a9d8f",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#4b5563",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 1,
  },
  loginButton: {
    backgroundColor: "#2a9d8f",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#ef4444",
    marginTop: 6,
    fontSize: 14,
  },
  helpText: {
    color: "#6b7280",
    marginVertical: 16,
    textAlign: "center",
    fontStyle: "italic",
    fontSize: 14,
  },
  debugText: {
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(42, 157, 143, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#2a9d8f",
  },
  logoPlaceholder: {
    fontSize: 50,
  },
  logoTagline: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#2a9d8f",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#2a9d8f",
  },
  checkmark: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#4b5563",
  },
});

export default LoginScreen;
