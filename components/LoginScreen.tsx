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
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const hasNavigated = useRef(false);

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Reset fields when showing the login screen
  useEffect(() => {
    if (!isAuthenticated) {
      reset();
      setDebugMsg("");
      // Reset navigation flag when logging out
      hasNavigated.current = false;
    }
  }, [isAuthenticated, reset]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Luansing Rice Mill</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
});

export default LoginScreen;
