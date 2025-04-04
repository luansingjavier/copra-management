declare module "react-native-bluetooth-escpos-printer" {
  export interface DeviceMap {
    [address: string]: string; // address -> device name mapping
  }

  export const BluetoothManager: {
    EVENT_DEVICE_ALREADY_PAIRED: string;
    EVENT_DEVICE_FOUND: string;
    EVENT_CONNECTION_LOST: string;
    EVENT_BLUETOOTH_NOT_SUPPORT: string;
    isBluetoothEnabled(): Promise<boolean>;
    enableBluetooth(): Promise<any>;
    disableBluetooth(): Promise<any>;
    scanDevices(): Promise<DeviceMap>;
    getDeviceList(): Promise<DeviceMap>;
    connect(address: string): Promise<any>;
    disconnect(): Promise<any>;
  };

  export const BluetoothEscposPrinter: {
    ALIGN: {
      LEFT: number;
      CENTER: number;
      RIGHT: number;
    };
    BARCODETYPE: {
      UPC_A: number;
      UPC_E: number;
      JAN13: number;
      JAN8: number;
      CODE39: number;
      ITF: number;
      CODABAR: number;
      CODE93: number;
      CODE128: number;
    };
    ERROR_CORRECTION: {
      L: number;
      M: number;
      Q: number;
      H: number;
    };
    ROTATION: {
      OFF: number;
      ON: number;
    };
    printText(text: string): Promise<any>;
    printColumn(
      columnWidths: number[],
      columnAlignments: number[],
      columnTexts: string[],
      options: any
    ): Promise<any>;
    printBarCode(
      str: string,
      type: number,
      width: number,
      height: number,
      position: number
    ): Promise<any>;
    printQRCode(str: string, size: number, correction: number): Promise<any>;
    printImage(base64: string): Promise<any>;
  };

  export const BluetoothTscPrinter: {
    DIRECTION: {
      FORWARD: number;
      BACKWARD: number;
    };
    DENSITY: {
      DNESITY0: number;
      DNESITY1: number;
      DNESITY2: number;
      DNESITY3: number;
      DNESITY4: number;
      DNESITY5: number;
      DNESITY6: number;
      DNESITY7: number;
      DNESITY8: number;
      DNESITY9: number;
      DNESITY10: number;
      DNESITY11: number;
      DNESITY12: number;
      DNESITY13: number;
      DNESITY14: number;
      DNESITY15: number;
    };
    BARCODETYPE: {
      CODE128: string;
      CODE128M: string;
      EAN128: string;
      ITF25: string;
      ITF25C: string;
      CODE39: string;
      CODE39C: string;
      CODE39S: string;
      CODE93: string;
      EAN13: string;
      EAN13_2: string;
      EAN13_5: string;
      EAN8: string;
      EAN8_2: string;
      EAN8_5: string;
      CODABAR: string;
      POST: string;
      UPCA: string;
      UPCA_2: string;
      UPCA_5: string;
      UPCE: string;
      UPCE_2: string;
      UPCE_5: string;
      CPOST: string;
      MSI: string;
      MSIC: string;
      PLESSEY: string;
      ITF14: string;
      EAN14: string;
    };
  };
}
