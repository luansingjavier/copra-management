import { StyleSheet } from "react-native";
import { Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import LoginScreen from "../../components/LoginScreen";
import { useEffect, useState, useMemo } from "react";
import { getDefaultSettings } from "../../database/database";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

// Form validation schema
const receiptFormSchema = yup.object().shape({
  customer: yup.string().required("Customer name is required"),
  address: yup.string().required("Address is required"),
  copraPrice: yup
    .string()
    .required("Copra price is required")
    .test(
      "is-positive-number",
      "Price must be a positive number",
      (value) => value !== undefined && value !== "" && parseFloat(value) > 0
    ),
  totalCopra: yup
    .string()
    .required("Total copra is required")
    .test(
      "is-positive-number",
      "Total copra must be a positive number",
      (value) => value !== undefined && value !== "" && parseFloat(value) > 0
    ),
  totalDeduction: yup
    .string()
    .required("Total deduction is required")
    .test(
      "is-non-negative",
      "Deduction cannot be negative",
      (value) => value !== undefined && value !== "" && parseFloat(value) >= 0
    ),
  transportationFee: yup
    .string()
    .required("Transportation fee is required")
    .test(
      "is-non-negative",
      "Fee cannot be negative",
      (value) => value !== undefined && value !== "" && parseFloat(value) >= 0
    ),
});

// Form data type
type ReceiptFormData = {
  customer: string;
  address: string;
  copraPrice: string;
  totalCopra: string;
  totalDeduction: string;
  transportationFee: string;
};

export default function HomeScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReceiptFormData>({
    resolver: yupResolver(receiptFormSchema) as any,
    defaultValues: {
      customer: "",
      address: "",
      copraPrice: "0",
      totalCopra: "0",
      totalDeduction: "0",
      transportationFee: "0",
    },
  });

  // Watch form fields for calculations
  const watchedCopraPrice = watch("copraPrice");
  const watchedTotalCopra = watch("totalCopra");
  const watchedTotalDeduction = watch("totalDeduction");
  const watchedTransportationFee = watch("transportationFee");

  // Load default values from database when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDefaultValues();
    }
  }, [isAuthenticated]);

  // Load default values from the database
  const loadDefaultValues = async () => {
    setIsLoadingDefaults(true);
    try {
      const defaults = await getDefaultSettings();
      console.log("Loaded default values:", defaults);

      setValue("copraPrice", defaults.copraPrice);
      setValue("transportationFee", defaults.transportationFee);
    } catch (error) {
      console.error("Error loading default values:", error);
    } finally {
      setIsLoadingDefaults(false);
    }
  };

  // Calculate total price automatically based on other fields
  const totalPrice = useMemo(() => {
    try {
      const price = parseFloat(watchedCopraPrice) || 0;
      const copra = parseFloat(watchedTotalCopra) || 0;
      const deduction = parseFloat(watchedTotalDeduction) || 0;
      const fee = parseFloat(watchedTransportationFee) || 0;

      // Calculate: (Total Copra - Deduction) * Price per kg + Transportation Fee
      const netCopra = copra - deduction;
      const total = netCopra * price + fee;

      return total.toFixed(2);
    } catch (error) {
      return "0.00";
    }
  }, [
    watchedCopraPrice,
    watchedTotalCopra,
    watchedTotalDeduction,
    watchedTransportationFee,
  ]);

  // For debugging
  useEffect(() => {
    console.log(`Home screen rendered. Auth state:`, {
      isAuthenticated,
      user,
    });
  }, [isAuthenticated, user]);

  // Force re-render on authentication change
  useEffect(() => {
    console.log(
      `HomeScreen: Authentication state changed to ${isAuthenticated}`
    );
  }, [isAuthenticated]);

  const onSubmit = handleSubmit((data: ReceiptFormData) => {
    Alert.alert(
      "Print Receipt",
      `Receipt for ${data.customer} will be printed with total amount of $${totalPrice}.`,
      [{ text: "OK" }]
    );
  });

  // When not authenticated, show login screen
  if (!isAuthenticated) {
    console.log("HomeScreen: Rendering LoginScreen");
    return <LoginScreen />;
  }

  // When authenticated, show home screen content
  console.log("HomeScreen: Rendering home content for user:", user);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <View style={[styles.fieldRow, styles.customerRow]}>
            <Text style={styles.customerLabel}>Customer:</Text>
            <Controller
              control={control}
              name="customer"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.customerInput,
                    errors.customer && styles.inputError,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter customer name"
                />
              )}
            />
          </View>
          {errors.customer && (
            <Text style={styles.errorText}>{errors.customer.message}</Text>
          )}

          <View style={[styles.fieldRow, styles.addressRow]}>
            <Text style={styles.customerLabel}>Address:</Text>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.addressInput,
                    errors.address && styles.inputError,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter complete address"
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />
          </View>
          {errors.address && (
            <Text style={styles.errorText}>{errors.address.message}</Text>
          )}

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Copra price/kl:</Text>
            <Controller
              control={control}
              name="copraPrice"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.fieldInput,
                    errors.copraPrice && styles.inputError,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
          {errors.copraPrice && (
            <Text style={styles.errorText}>{errors.copraPrice.message}</Text>
          )}

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Total Copra (kgs):</Text>
            <Controller
              control={control}
              name="totalCopra"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.fieldInput,
                    errors.totalCopra && styles.inputError,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
          {errors.totalCopra && (
            <Text style={styles.errorText}>{errors.totalCopra.message}</Text>
          )}

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Total Deduction (kgs):</Text>
            <Controller
              control={control}
              name="totalDeduction"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.fieldInput,
                    errors.totalDeduction && styles.inputError,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
          {errors.totalDeduction && (
            <Text style={styles.errorText}>
              {errors.totalDeduction.message}
            </Text>
          )}

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Transportation Fee:</Text>
            <Controller
              control={control}
              name="transportationFee"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.fieldInput,
                    errors.transportationFee && styles.inputError,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
          {errors.transportationFee && (
            <Text style={styles.errorText}>
              {errors.transportationFee.message}
            </Text>
          )}

          <View style={[styles.fieldRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Price:</Text>
            <TextInput
              style={styles.totalInput}
              value={totalPrice}
              editable={false}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.printButton} onPress={onSubmit}>
          <Text style={styles.buttonText}>Print Receipt</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 15, // Reduced from 80 since SafeAreaView handles bottom safe area
    alignItems: "center",
    justifyContent: "center", // Center content vertically
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerRow: {
    backgroundColor: "#f0f7ff",
    borderLeftWidth: 4,
    borderLeftColor: "#4a90e2",
  },
  addressRow: {
    alignItems: "flex-start",
    paddingVertical: 10,
    backgroundColor: "#f0f7ff",
    borderLeftWidth: 4,
    borderLeftColor: "#4a90e2",
  },
  totalRow: {
    backgroundColor: "#f8f9ff",
    borderWidth: 1,
    borderColor: "#4a90e2",
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  customerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  fieldInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: "#fafafa",
    textAlign: "right",
  },
  customerInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#b6d4fe",
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: "white",
    textAlign: "left",
    fontSize: 16,
  },
  addressInput: {
    flex: 1,
    height: 80,
    borderWidth: 1,
    borderColor: "#b6d4fe",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "white",
    textAlign: "left",
  },
  totalInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f0f8ff",
    textAlign: "right",
    fontSize: 18,
    fontWeight: "700",
    color: "#4a90e2",
  },
  printButton: {
    position: "absolute",
    bottom: 15, // Adjusted from 90 since SafeAreaView handles bottom safe area
    left: 20,
    right: 20,
    backgroundColor: "#4a90e2",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#e74c3c",
    marginBottom: 5,
    marginTop: -5,
    marginLeft: 10,
    textAlign: "left",
    fontSize: 12,
  },
  inputError: {
    borderColor: "#e74c3c",
  },
});
