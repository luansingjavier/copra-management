import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import LoginScreen from "../../components/LoginScreen";
import PrinterList from "../../components/PrinterList";
import { useState } from "react";
import { Printer } from "../../services/PrinterService";
import PrinterService from "../../services/PrinterServiceFactory";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import Constants from "expo-constants";

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong:</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Text style={styles.errorText}>
        The printer functionality may not be available on this device or
        platform.
      </Text>
    </View>
  );
}

// Define the main component
function ExploreScreen() {
  const { isAuthenticated } = useAuthStore();
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Handle printer selection
  const handlePrinterSelected = (printer: Printer | null) => {
    setSelectedPrinter(printer);
  };

  // When authenticated, show the explore screen content
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Printer</Text>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.content}>
          {selectedPrinter ? (
            <View style={styles.connectedPrinterContainer}>
              <Text style={styles.connectedLabel}>Connected Printer:</Text>
              <Text style={styles.connectedPrinter}>
                {selectedPrinter.name}
              </Text>
              <Text style={styles.connectedAddress}>
                {selectedPrinter.address}
              </Text>
            </View>
          ) : (
            <Text style={styles.subtitle}>Connect to a printer below</Text>
          )}
        </View>

        {/* Printer List with error boundary */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <View style={styles.printerListContainer}>
            <PrinterList onPrinterSelected={handlePrinterSelected} />
          </View>
        </ErrorBoundary>
      </View>
    </SafeAreaView>
  );
}

// Styles
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
    height: 80 + Constants.statusBarHeight,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 40 + Constants.statusBarHeight,
  },
  mainContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 90, // Make sure content doesn't get cut off by tab bar
  },
  content: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 0,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280",
  },
  connectedPrinterContainer: {
    backgroundColor: "#e8f4f2",
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2a9d8f",
  },
  connectedLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2a9d8f",
    marginBottom: 6,
  },
  connectedPrinter: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  connectedAddress: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  printerListContainer: {
    flex: 1,
    minHeight: 300,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 0,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ef4444",
    elevation: 0,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  errorText: {
    fontSize: 14,
    color: "#6b7280",
  },
});

// Export the component
export default ExploreScreen;
