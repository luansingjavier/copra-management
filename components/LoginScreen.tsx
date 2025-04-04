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
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { router } from "expo-router";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

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
  const loginHelp = "Use: luansingjavier / thgirb11";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Luansing Copra Management</Text>

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
                placeholder="Username"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username.message}</Text>
              )}
            </>
          )}
        />

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
                placeholder="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </>
          )}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.helpText}>{loginHelp}</Text>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  formContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  loginButton: {
    backgroundColor: "#4a90e2",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#e74c3c",
    marginBottom: 10,
    textAlign: "left",
    fontSize: 12,
  },
  helpText: {
    color: "#555",
    marginBottom: 10,
    textAlign: "center",
    fontStyle: "italic",
    fontSize: 14,
  },
  debugText: {
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
    fontSize: 12,
  },
});

export default LoginScreen;
