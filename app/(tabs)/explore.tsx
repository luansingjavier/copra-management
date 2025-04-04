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
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1a5653",
    padding: 16,
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  mainContainer: {
    flex: 1,
    padding: 15,
    paddingBottom: 90, // Make sure content doesn't get cut off by tab bar
  },
  content: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
  connectedPrinterContainer: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#4a90e2",
  },
  connectedLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4a90e2",
    marginBottom: 5,
  },
  connectedPrinter: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
  connectedAddress: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  printerListContainer: {
    flex: 1,
    minHeight: 300,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorText: {
    fontSize: 14,
    color: "#555",
  },
});

// Export the component
export default ExploreScreen;
