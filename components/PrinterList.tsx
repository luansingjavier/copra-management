import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrinterService from "../services/PrinterServiceFactory";
import { Printer } from "../services/PrinterService";

interface PrinterListProps {
  onPrinterSelected?: (printer: Printer | null) => void;
}

const PrinterList = ({ onPrinterSelected }: PrinterListProps) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  // Load initial printers
  useEffect(() => {
    loadPairedPrinters();
  }, []);

  // Load paired printers
  const loadPairedPrinters = async () => {
    setLoading(true);
    try {
      const isEnabled = await PrinterService.isBluetoothEnabled();
      if (!isEnabled) {
        Alert.alert(
          "Bluetooth Disabled",
          "Please enable Bluetooth to connect to printers",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Enable",
              onPress: async () => {
                try {
                  if (Platform.OS === "android") {
                    await PrinterService.enableBluetooth();
                    loadPairedPrinters();
                  }
                } catch (error) {
                  console.error("Error enabling Bluetooth:", error);
                }
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      const pairedDevices = await PrinterService.getPairedDevices();
      setPrinters(pairedDevices);

      // Check if there's a connected printer
      const connectedPrinter = PrinterService.getConnectedPrinter();
      if (connectedPrinter) {
        setSelectedPrinter(connectedPrinter);
      }
    } catch (error) {
      console.error("Error loading paired printers:", error);
      Alert.alert("Error", "Failed to load paired printers");
    } finally {
      setLoading(false);
    }
  };

  // Scan for new printers
  const scanForPrinters = async () => {
    setScanning(true);
    try {
      const foundDevices = await PrinterService.scanForDevices();
      setPrinters(foundDevices);
    } catch (error) {
      console.error("Error scanning for printers:", error);
      Alert.alert("Error", "Failed to scan for printers");
    } finally {
      setScanning(false);
    }
  };

  // Connect to a printer
  const connectToPrinter = async (printer: Printer) => {
    try {
      setLoading(true);
      const success = await PrinterService.connectToPrinter(printer.address);
      if (success) {
        setSelectedPrinter({ ...printer, connected: true });
        setPrinters((prev) =>
          prev.map((p) => ({
            ...p,
            connected: p.address === printer.address,
          }))
        );

        if (onPrinterSelected) {
          onPrinterSelected({ ...printer, connected: true });
        }

        Alert.alert("Success", `Connected to ${printer.name}`);
      } else {
        Alert.alert("Error", `Failed to connect to ${printer.name}`);
      }
    } catch (error) {
      console.error("Error connecting to printer:", error);
      Alert.alert("Error", "Failed to connect to printer");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect from a printer
  const disconnectPrinter = async () => {
    if (!selectedPrinter) return;

    try {
      setLoading(true);
      const success = await PrinterService.disconnectPrinter();
      if (success) {
        setSelectedPrinter(null);
        setPrinters((prev) => prev.map((p) => ({ ...p, connected: false })));

        if (onPrinterSelected) {
          onPrinterSelected(null);
        }

        Alert.alert("Success", "Disconnected from printer");
      } else {
        Alert.alert("Error", "Failed to disconnect from printer");
      }
    } catch (error) {
      console.error("Error disconnecting from printer:", error);
      Alert.alert("Error", "Failed to disconnect from printer");
    } finally {
      setLoading(false);
    }
  };

  // Render individual printer item
  const renderPrinterItem = ({ item }: { item: Printer }) => (
    <View style={styles.printerItem}>
      <View style={styles.printerInfo}>
        <Text style={styles.printerName}>{item.name}</Text>
        <Text style={styles.printerAddress}>{item.address}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.connectButton,
          item.connected ? styles.disconnectButton : null,
        ]}
        onPress={() =>
          item.connected ? disconnectPrinter() : connectToPrinter(item)
        }
        disabled={loading}
      >
        {loading && selectedPrinter?.address === item.address ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {item.connected ? "Disconnect" : "Connect"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading && printers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading printers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Printers</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={scanForPrinters}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator size="small" color="#4a90e2" />
          ) : (
            <Ionicons name="refresh" size={24} color="#4a90e2" />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={printers}
        renderItem={renderPrinterItem}
        keyExtractor={(item) => item.address}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No printers found</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={scanForPrinters}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.scanButtonText}>Scan for Printers</Text>
              )}
            </TouchableOpacity>
          </View>
        }
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    padding: 5,
  },
  list: {
    flex: 1,
  },
  printerItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: "#333",
  },
  printerAddress: {
    fontSize: 12,
    color: "#777",
  },
  connectButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  disconnectButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 15,
  },
  scanButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
  },
  scanButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default PrinterList;
