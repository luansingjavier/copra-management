import { Platform } from "react-native";
import RealPrinterService from "./PrinterService";
import MockPrinterService from "./MockPrinterService";

// Environment detection
const isDevelopment = process.env.NODE_ENV === "development";
const isWeb = Platform.OS === "web";

class PrinterServiceFactory {
  static getService() {
    // In development or web mode, use the mock service
    if (isDevelopment || isWeb) {
      console.log("Using mock printer service");
      return MockPrinterService;
    }

    // Otherwise try to use the real service
    try {
      // Try to access a method to check if native module is working
      RealPrinterService.isBluetoothEnabled();
      console.log("Using real printer service");
      return RealPrinterService;
    } catch (error) {
      console.log(
        "Error initializing real printer service, falling back to mock:",
        error
      );
      return MockPrinterService;
    }
  }
}

export default PrinterServiceFactory.getService();
