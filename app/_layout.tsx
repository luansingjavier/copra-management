import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuthStore } from "@/store/authStore";
import { initDatabase } from "@/database/database";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database separately from auth checks
  useEffect(() => {
    async function initializeDb() {
      if (loaded && !dbInitialized) {
        try {
          // Initialize the Realm database
          await initDatabase();
          console.log("Database initialized successfully");
          setDbInitialized(true);
        } catch (error) {
          console.error("Error initializing database:", error);
          // Mark as initialized anyway to avoid infinite retry loops
          setDbInitialized(true);
        }
      }
    }

    initializeDb();
  }, [loaded, dbInitialized]);

  // Check auth state and hide splash screen
  useEffect(() => {
    async function prepareApp() {
      if (loaded && dbInitialized) {
        try {
          // Check auth state after DB is initialized
          checkAuth();
        } catch (error) {
          console.error("Error checking auth:", error);
        } finally {
          // Hide splash screen only when everything is ready
          await SplashScreen.hideAsync();
        }
      }
    }

    prepareApp();
  }, [loaded, dbInitialized, checkAuth]);

  if (!loaded || !dbInitialized) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
