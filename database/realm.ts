import Realm, { ObjectSchema } from "realm";
import * as Crypto from "expo-crypto";

// Define Realm schemas
export class User extends Realm.Object<User> {
  _id!: Realm.BSON.ObjectId;
  username!: string;
  password!: string;
  createdAt!: Date;

  static schema: ObjectSchema = {
    name: "User",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      username: "string",
      password: "string",
      createdAt: "date",
    },
  };
}

export class Setting extends Realm.Object<Setting> {
  _id!: Realm.BSON.ObjectId;
  key!: string;
  value!: string;

  static schema: ObjectSchema = {
    name: "Setting",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      key: "string",
      value: "string",
    },
  };
}

// Default users for the app
const DEFAULT_USERS = [
  { username: "luansingjavier", password: "thgirb11" },
  { username: "admin", password: "admin123" },
];

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

// Class to manage Realm database operations
class RealmDatabase {
  private realm: Realm | null = null;
  private initialized: boolean = false;
  private initializing: boolean = false;

  constructor() {
    // Don't auto-initialize; let it be called explicitly
  }

  // Initialize Realm and open the database
  private async initRealm() {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    try {
      this.realm = await Realm.open({
        schema: [User, Setting],
        schemaVersion: 1,
      });
      console.log("Realm database opened successfully");
      this.initialized = true;

      await this.initializeDefaultData();
    } catch (error) {
      console.error("Failed to open Realm database:", error);
      // Reset state so future calls can retry
      this.realm = null;
    } finally {
      this.initializing = false;
    }
  }

  // Initialize default data if database is empty
  private async initializeDefaultData() {
    if (!this.realm) {
      console.error("Realm not initialized - cannot add default data");
      return;
    }

    // Check if users exist
    const userCount = this.realm.objects(User).length;
    if (userCount === 0) {
      console.log("No users found, adding default users");

      try {
        this.realm.write(() => {
          DEFAULT_USERS.forEach((user) => {
            this.realm?.create(User, {
              _id: new Realm.BSON.ObjectId(),
              username: user.username,
              password: user.password, // Should be encrypted in production
              createdAt: new Date(),
            });
          });
        });
        console.log("Default users added successfully");
      } catch (error) {
        console.error("Error adding default users:", error);
      }
    }

    // Check if settings exist and add default settings
    const settingsCount = this.realm.objects(Setting).length;
    if (settingsCount === 0) {
      console.log("No settings found, adding default settings");

      try {
        this.realm.write(() => {
          this.realm?.create(Setting, {
            _id: new Realm.BSON.ObjectId(),
            key: "default_copra_price",
            value: DEFAULT_SETTINGS.copraPrice,
          });

          this.realm?.create(Setting, {
            _id: new Realm.BSON.ObjectId(),
            key: "default_transportation_fee",
            value: DEFAULT_SETTINGS.transportationFee,
          });
        });
        console.log("Default settings added successfully");
      } catch (error) {
        console.error("Error adding default settings:", error);
      }
    }
  }

  // Ensure realm is initialized before operations
  private async ensureRealm(): Promise<boolean> {
    if (!this.realm) {
      await this.initRealm();
    }

    return !!this.realm;
  }

  // Public methods

  // Login user
  async loginUser(username: string, password: string): Promise<boolean> {
    const hasRealm = await this.ensureRealm();
    if (!hasRealm) {
      console.error("Cannot login - Realm not initialized");
      return false;
    }

    console.log(`Login attempt for: ${username}`);

    try {
      // Find user with matching username and password
      const user = this.realm!.objects(User).filtered(
        "username == $0 AND password == $1",
        username,
        password
      )[0];

      if (user) {
        console.log("Login successful");
        return true;
      } else {
        console.log("Login failed - invalid credentials");
        return false;
      }
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  }

  // Register new user
  async registerUser(username: string, password: string): Promise<void> {
    const hasRealm = await this.ensureRealm();
    if (!hasRealm) {
      console.error("Cannot register user - Realm not initialized");
      return;
    }

    console.log(`Registering user: ${username}`);

    try {
      // Check if username already exists
      const existingUser = this.realm!.objects(User).filtered(
        "username == $0",
        username
      )[0];

      if (existingUser) {
        console.log("Username already exists");
        return;
      }

      // Create new user
      this.realm!.write(() => {
        this.realm!.create(User, {
          _id: new Realm.BSON.ObjectId(),
          username,
          password, // Should encrypt in production
          createdAt: new Date(),
        });
      });
      console.log("User registered successfully");
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }

  // Get all users (for debugging)
  async getAllUsers(): Promise<any[]> {
    const hasRealm = await this.ensureRealm();
    if (!hasRealm) {
      console.error("Cannot get users - Realm not initialized");
      return [];
    }

    console.log("Getting all users");

    try {
      const users = this.realm!.objects(User);
      return Array.from(users).map((user) => ({
        id: user._id.toString(),
        username: user.username,
        password: user.password,
      }));
    } catch (error) {
      console.error("Error getting users:", error);
      return [];
    }
  }

  // Save default settings
  async saveDefaultSettings(
    copraPrice: string,
    transportationFee: string
  ): Promise<void> {
    const hasRealm = await this.ensureRealm();
    if (!hasRealm) {
      console.error("Cannot save settings - Realm not initialized");
      return;
    }

    console.log("Saving default settings:", { copraPrice, transportationFee });

    try {
      // Update copra price
      const copraPriceSetting = this.realm!.objects(Setting).filtered(
        'key == "default_copra_price"'
      )[0];

      this.realm!.write(() => {
        if (copraPriceSetting) {
          copraPriceSetting.value = copraPrice;
        } else {
          this.realm!.create(Setting, {
            _id: new Realm.BSON.ObjectId(),
            key: "default_copra_price",
            value: copraPrice,
          });
        }
      });

      // Update transportation fee
      const transportationFeeSetting = this.realm!.objects(Setting).filtered(
        'key == "default_transportation_fee"'
      )[0];

      this.realm!.write(() => {
        if (transportationFeeSetting) {
          transportationFeeSetting.value = transportationFee;
        } else {
          this.realm!.create(Setting, {
            _id: new Realm.BSON.ObjectId(),
            key: "default_transportation_fee",
            value: transportationFee,
          });
        }
      });

      console.log("Default settings saved successfully");
    } catch (error) {
      console.error("Error saving default settings:", error);
      throw error;
    }
  }

  // Get default settings
  async getDefaultSettings(): Promise<{
    copraPrice: string;
    transportationFee: string;
  }> {
    const hasRealm = await this.ensureRealm();
    if (!hasRealm) {
      console.error("Cannot get settings - Realm not initialized");
      return DEFAULT_SETTINGS;
    }

    console.log("Getting default settings");

    try {
      // Get copra price
      const copraPriceSetting = this.realm!.objects(Setting).filtered(
        'key == "default_copra_price"'
      )[0];

      // Get transportation fee
      const transportationFeeSetting = this.realm!.objects(Setting).filtered(
        'key == "default_transportation_fee"'
      )[0];

      const settings = {
        copraPrice: copraPriceSetting
          ? copraPriceSetting.value
          : DEFAULT_SETTINGS.copraPrice,
        transportationFee: transportationFeeSetting
          ? transportationFeeSetting.value
          : DEFAULT_SETTINGS.transportationFee,
      };

      return settings;
    } catch (error) {
      console.error("Error getting default settings:", error);
      return DEFAULT_SETTINGS;
    }
  }

  // Reset database (for testing/development)
  async resetDatabase(): Promise<void> {
    const hasRealm = await this.ensureRealm();
    if (!hasRealm) {
      console.error("Cannot reset database - Realm not initialized");
      return;
    }

    console.log("Resetting database...");

    try {
      // Delete all records
      this.realm!.write(() => {
        this.realm!.deleteAll();
      });

      // Re-initialize default data
      await this.initializeDefaultData();

      console.log("Database reset complete");
    } catch (error) {
      console.error("Error resetting database:", error);
      throw error;
    }
  }

  // Public method to explicitly initialize the realm
  async initialize(): Promise<void> {
    if (!this.initialized && !this.initializing) {
      await this.initRealm();
    }
  }

  // Close the Realm when app is closed
  closeRealm() {
    if (this.realm) {
      this.realm.close();
      this.realm = null;
      this.initialized = false;
      console.log("Realm database closed");
    }
  }
}

// Create and export singleton instance
const realmDB = new RealmDatabase();
export default realmDB;
