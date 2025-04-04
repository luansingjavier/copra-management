import { Printer } from "./PrinterService";

class MockPrinterService {
  private static instance: MockPrinterService;
  private connectedPrinter: Printer | null = null;
  private mockPrinters: Printer[] = [
    {
      name: "Mock Printer 1",
      address: "11:22:33:44:55:66",
      paired: true,
      connected: false,
    },
    {
      name: "Mock Printer 2",
      address: "66:55:44:33:22:11",
      paired: true,
      connected: false,
    },
  ];

  private constructor() {
    console.log("MockPrinterService initialized");
  }

  public static getInstance(): MockPrinterService {
    if (!MockPrinterService.instance) {
      MockPrinterService.instance = new MockPrinterService();
    }
    return MockPrinterService.instance;
  }

  public async isBluetoothEnabled(): Promise<boolean> {
    return true;
  }

  public async enableBluetooth(): Promise<boolean> {
    return true;
  }

  public async scanForDevices(): Promise<Printer[]> {
    console.log("Scanning for mock devices...");
    // Simulate scan delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return this.mockPrinters;
  }

  public async getPairedDevices(): Promise<Printer[]> {
    return this.mockPrinters.map((printer) => ({
      ...printer,
      connected: this.connectedPrinter?.address === printer.address,
    }));
  }

  public async connectToPrinter(printerAddress: string): Promise<boolean> {
    // Find the printer in our mock list
    const printer = this.mockPrinters.find((p) => p.address === printerAddress);

    if (printer) {
      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.connectedPrinter = {
        ...printer,
        connected: true,
      };

      // Update mock printers list
      this.mockPrinters = this.mockPrinters.map((p) => ({
        ...p,
        connected: p.address === printerAddress,
      }));

      return true;
    }

    return false;
  }

  public async disconnectPrinter(): Promise<boolean> {
    if (!this.connectedPrinter) return false;

    // Simulate disconnection delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.mockPrinters = this.mockPrinters.map((p) => ({
      ...p,
      connected: false,
    }));

    this.connectedPrinter = null;
    return true;
  }

  public getConnectedPrinter(): Printer | null {
    return this.connectedPrinter;
  }

  public async printReceipt(receipt: string): Promise<boolean> {
    if (!this.connectedPrinter) {
      throw new Error("No printer connected");
    }

    console.log("Mock printing receipt:", receipt);
    // Simulate printing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return true;
  }
}

export default MockPrinterService.getInstance();
