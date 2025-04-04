import { NativeEventEmitter, NativeModules, Platform } from "react-native";

// Import the modules using require to match the module's structure with error handling
let BluetoothManager: any = {
  EVENT_DEVICE_ALREADY_PAIRED: "EVENT_DEVICE_ALREADY_PAIRED",
  EVENT_DEVICE_FOUND: "EVENT_DEVICE_FOUND",
  EVENT_CONNECTION_LOST: "EVENT_CONNECTION_LOST",
  EVENT_BLUETOOTH_NOT_SUPPORT: "EVENT_BLUETOOTH_NOT_SUPPORT",
  isBluetoothEnabled: async () => false,
  enableBluetooth: async () => {},
  scanDevices: async () => ({}),
  getDeviceList: async () => ({}),
  connect: async () => {},
  disconnect: async () => {},
};

let BluetoothEscposPrinter: any = {
  printText: async () => {},
};

try {
  const BluetoothPrinter = require("react-native-bluetooth-escpos-printer");
  if (BluetoothPrinter) {
    BluetoothManager = BluetoothPrinter.BluetoothManager || BluetoothManager;
    BluetoothEscposPrinter =
      BluetoothPrinter.BluetoothEscposPrinter || BluetoothEscposPrinter;
  }
} catch (error) {
  console.error("Failed to load Bluetooth printer module:", error);
}

// Define the printer types
export interface Printer {
  name: string;
  address: string;
  paired: boolean;
  connected: boolean;
}

class PrinterService {
  private static instance: PrinterService;
  private bluetoothEnabled: boolean = false;
  private connectedPrinter: Printer | null = null;
  private eventEmitter: NativeEventEmitter | null = null;

  private constructor() {
    // Only initialize event emitter if BluetoothManager native module exists
    if (NativeModules.BluetoothManager) {
      this.eventEmitter = new NativeEventEmitter(
        NativeModules.BluetoothManager
      );

      // Set up event listeners
      this.eventEmitter.addListener(
        BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
        this.onDevicePaired
      );
      this.eventEmitter.addListener(
        BluetoothManager.EVENT_DEVICE_FOUND,
        this.onDeviceFound
      );
      this.eventEmitter.addListener(
        BluetoothManager.EVENT_CONNECTION_LOST,
        this.onConnectionLost
      );
      this.eventEmitter.addListener(
        BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT,
        this.onBluetoothNotSupported
      );
    } else {
      console.warn("BluetoothManager native module not available");
    }
  }

  // Singleton pattern
  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  // Check if Bluetooth is enabled
  public async isBluetoothEnabled(): Promise<boolean> {
    try {
      const available = await BluetoothManager.isBluetoothEnabled();
      this.bluetoothEnabled = available;
      return available;
    } catch (error) {
      console.error("Error checking Bluetooth status:", error);
      this.bluetoothEnabled = false;
      return false;
    }
  }

  // Enable Bluetooth
  public async enableBluetooth(): Promise<boolean> {
    // iOS doesn't support enabling Bluetooth programmatically
    if (Platform.OS === "ios") {
      throw new Error("Cannot enable Bluetooth on iOS programmatically");
    }

    try {
      await BluetoothManager.enableBluetooth();
      this.bluetoothEnabled = true;
      return true;
    } catch (error) {
      console.error("Error enabling Bluetooth:", error);
      return false;
    }
  }

  // Scan for available devices
  public async scanForDevices(): Promise<Printer[]> {
    try {
      const enabled = await this.isBluetoothEnabled();
      if (!enabled) {
        if (Platform.OS === "android") {
          await this.enableBluetooth();
        } else {
          throw new Error("Bluetooth is not enabled");
        }
      }

      // Unpair all devices first
      const pairedDevices = await this.getPairedDevices();

      // Start discovery
      await BluetoothManager.scanDevices();

      const foundDevices = await this.getPairedDevices();
      return foundDevices;
    } catch (error) {
      console.error("Error scanning for devices:", error);
      return [];
    }
  }

  // Get paired devices
  public async getPairedDevices(): Promise<Printer[]> {
    try {
      const devices = await BluetoothManager.getDeviceList();
      return Object.keys(devices).map((address) => ({
        name: devices[address],
        address,
        paired: true,
        connected: this.connectedPrinter?.address === address,
      }));
    } catch (error) {
      console.error("Error getting paired devices:", error);
      return [];
    }
  }

  // Connect to a printer
  public async connectToPrinter(printerAddress: string): Promise<boolean> {
    try {
      await BluetoothManager.connect(printerAddress);

      // Get the printer name from paired devices
      const pairedDevices = await this.getPairedDevices();
      const printer = pairedDevices.find(
        (device) => device.address === printerAddress
      );

      if (printer) {
        this.connectedPrinter = {
          ...printer,
          connected: true,
        };
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error connecting to printer ${printerAddress}:`, error);
      return false;
    }
  }

  // Disconnect from printer
  public async disconnectPrinter(): Promise<boolean> {
    try {
      await BluetoothManager.disconnect();
      this.connectedPrinter = null;
      return true;
    } catch (error) {
      console.error("Error disconnecting printer:", error);
      return false;
    }
  }

  // Get connected printer
  public getConnectedPrinter(): Printer | null {
    return this.connectedPrinter;
  }

  // Print receipt
  public async printReceipt(receipt: string): Promise<boolean> {
    try {
      if (!this.connectedPrinter) {
        throw new Error("No printer connected");
      }

      await BluetoothEscposPrinter.printText(receipt);
      return true;
    } catch (error) {
      console.error("Error printing receipt:", error);
      return false;
    }
  }

  // Event handlers
  private onDevicePaired = (device: any) => {
    console.log("Device already paired:", device);
  };

  private onDeviceFound = (device: any) => {
    console.log("Device found:", device);
  };

  private onConnectionLost = () => {
    console.log("Connection lost");
    this.connectedPrinter = null;
  };

  private onBluetoothNotSupported = () => {
    console.log("Bluetooth not supported");
    this.bluetoothEnabled = false;
  };

  // Remove all event listeners
  public removeListeners() {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners(
        BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED
      );
      this.eventEmitter.removeAllListeners(BluetoothManager.EVENT_DEVICE_FOUND);
      this.eventEmitter.removeAllListeners(
        BluetoothManager.EVENT_CONNECTION_LOST
      );
      this.eventEmitter.removeAllListeners(
        BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT
      );
    }
  }
}

export default PrinterService.getInstance();
