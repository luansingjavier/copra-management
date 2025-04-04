import * as Crypto from "expo-crypto";
import realmDB from "./realm";

// Define user type
interface User {
  id: number | string;
  username: string;
  password: string;
}

// Default settings for the app
const DEFAULT_SETTINGS = {
  copraPrice: "0",
  transportationFee: "0",
};

// Encrypt password using SHA-256
const encryptPassword = async (password: string): Promise<string> => {
  const hashedPassword = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return hashedPassword;
};

// Initialize the database
export const initDatabase = async (): Promise<void> => {
  console.log("Initializing Realm database");
  try {
    // Explicitly call initialize on realmDB and wait for it to complete
    await realmDB.initialize();
    console.log("Realm database explicitly initialized");
    return Promise.resolve();
  } catch (error) {
    console.error("Error initializing Realm database:", error);
    // Don't resolve silently, we need to know if this fails
    return Promise.reject(error);
  }
};

// Register a new user with encrypted password
export const registerUser = async (
  username: string,
  password: string
): Promise<void> => {
  // Forward to Realm implementation
  return realmDB.registerUser(username, password);
};

// Login user
export const loginUser = async (
  username: string,
  password: string
): Promise<boolean> => {
  // Forward to Realm implementation
  return realmDB.loginUser(username, password);
};

// For debugging - get all users
export const getAllUsers = async (): Promise<User[]> => {
  // Forward to Realm implementation
  return realmDB.getAllUsers();
};

// Save default settings to the database
export const saveDefaultSettings = async (
  copraPrice: string,
  transportationFee: string
): Promise<void> => {
  // Forward to Realm implementation
  return realmDB.saveDefaultSettings(copraPrice, transportationFee);
};

// Get default settings from the database
export const getDefaultSettings = async (): Promise<{
  copraPrice: string;
  transportationFee: string;
}> => {
  // Forward to Realm implementation
  return realmDB.getDefaultSettings();
};

// Reset the database (for development/testing)
export const resetDatabase = async (): Promise<void> => {
  // Forward to Realm implementation
  return realmDB.resetDatabase();
};

// Generate a unique receipt number
export const generateUniqueReceiptNumber = async (): Promise<string> => {
  // Forward to Realm implementation
  return realmDB.generateUniqueReceiptNumber();
};

// Save a receipt record
export const saveReceipt = async (
  receiptNumber: string,
  customer: string,
  address: string,
  copraPrice: string,
  totalCopra: string,
  totalDeduction: string,
  transportationFee: string,
  totalPrice: string
): Promise<void> => {
  // Forward to Realm implementation
  return realmDB.saveReceipt(
    receiptNumber,
    customer,
    address,
    copraPrice,
    totalCopra,
    totalDeduction,
    transportationFee,
    totalPrice
  );
};

// Get all receipts
export const getAllReceipts = async (): Promise<any[]> => {
  // Forward to Realm implementation
  return realmDB.getAllReceipts();
};

// Initialize the database on import - with proper error handling
console.log("Starting database initialization...");
initDatabase()
  .then(() => console.log("Database initialization successful"))
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    // Consider adding app-level error handling here
  });
