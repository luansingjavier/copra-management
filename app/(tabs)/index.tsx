import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useAuthStore } from "../../store/authStore";
import {
  getDefaultSettings,
  generateUniqueReceiptNumber,
  saveReceipt,
} from "../../database/database";
import PrinterService from "../../services/PrinterServiceFactory";
import LoginScreen from "../../components/LoginScreen";
import { router } from "expo-router";
import { Snackbar } from "react-native-paper";
import Constants from "expo-constants";

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
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

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
      fetchReceiptNumber();
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

  // Fetch a unique receipt number from the database
  const fetchReceiptNumber = async () => {
    try {
      const uniqueReceiptNumber = await generateUniqueReceiptNumber();
      setReceiptNumber(uniqueReceiptNumber);
      console.log(`Generated receipt number: ${uniqueReceiptNumber}`);
    } catch (error) {
      console.error("Error generating receipt number:", error);
      // Fallback to random number generation if database method fails
      setReceiptNumber(
        `RCT-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`
      );
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

  const onSubmit = handleSubmit(async (data: ReceiptFormData) => {
    try {
      // Save receipt data to database
      await saveReceipt(
        receiptNumber,
        data.customer,
        data.address,
        data.copraPrice,
        data.totalCopra,
        data.totalDeduction,
        data.transportationFee,
        totalPrice
      );

      // Generate a new receipt number for next use
      await fetchReceiptNumber();

      // Set snackbar message and show it
      setSnackbarMessage("Receipt data saved successfully");
      setSnackbarVisible(true);

      // Show receipt modal after a short delay to ensure Snackbar is visible
      setTimeout(() => {
        setShowReceiptModal(true);
      }, 1000);
    } catch (error: any) {
      console.error("Error saving receipt data:", error);
      // Show error in snackbar instead of alert
      setSnackbarMessage(
        `Failed to save receipt: ${error.message || "Unknown error"}`
      );
      setSnackbarVisible(true);
    }
  });

  // Format the current date
  const currentDate = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Format the current date and time for display
  const currentDateTime = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, []);

  // Add the receipt generation function
  const generateReceiptText = () => {
    // Calculate gross amount (total copra * price)
    const calculateGrossAmount = () => {
      const copra = parseFloat(watch("totalCopra")) || 0;
      const price = parseFloat(watch("copraPrice")) || 0;
      return copra * price;
    };

    // Calculate final amount
    const calculateTotalAmount = () => {
      const copra = parseFloat(watch("totalCopra")) || 0;
      const price = parseFloat(watch("copraPrice")) || 0;
      const deduction = parseFloat(watch("totalDeduction")) || 0;
      const fee = parseFloat(watch("transportationFee")) || 0;

      // Calculate: (Total Copra - Deduction) * Price per kg + Transportation Fee
      const netCopra = copra - deduction;
      return netCopra * price + fee;
    };

    const totalAmount = calculateTotalAmount();
    const formattedDate = format(new Date(), "MM/dd/yyyy HH:mm:ss");

    // Format the receipt for a thermal printer
    return `
LUANSING RICE MILL
#10 Odicon, Pasacao, Camarines Sur
Naga City, Philippines
Cell: 09292800067

RECEIPT #: ${receiptNumber}
DATE: ${formattedDate}

CUSTOMER: ${watch("customer")}
ADDRESS: ${watch("address")}

COPRA PRICE/KG: ₱${watch("copraPrice")}
TOTAL COPRA: ${watch("totalCopra")} kg
TOTAL: ₱${calculateGrossAmount().toFixed(2)}

DEDUCTION: ₱${watch("totalDeduction")}
TRANSPORTATION: ₱${watch("transportationFee")}

NET AMOUNT: ₱${totalAmount.toFixed(2)}

Thank you for your business!
* This serves as your official receipt *
`;
  };

  // Add a function to handle printing
  const handlePrint = async () => {
    try {
      // Check if a printer is connected
      const connectedPrinter = PrinterService.getConnectedPrinter();

      if (!connectedPrinter) {
        setSnackbarMessage(
          "No printer connected. Please connect a printer first."
        );
        setSnackbarVisible(true);

        // Close the receipt preview modal
        setShowPrintPreview(false);

        // Navigate to printer tab after a short delay
        setTimeout(() => {
          setShowReceiptModal(false);
          router.push("/(tabs)/explore");
        }, 1500);
        return;
      }

      // Close the print preview modal
      setShowPrintPreview(false);

      // Show printing message
      setSnackbarMessage(`Sending receipt to ${connectedPrinter.name}...`);
      setSnackbarVisible(true);

      // Generate receipt text
      const receiptText = generateReceiptText();

      // Print the receipt
      const success = await PrinterService.printReceipt(receiptText);

      if (success) {
        // Save the used receipt number to the database if not already saved
        await saveReceipt(
          receiptNumber,
          watch("customer"),
          watch("address"),
          watch("copraPrice"),
          watch("totalCopra"),
          watch("totalDeduction"),
          watch("transportationFee"),
          totalPrice
        );

        // Generate a new receipt number for next time
        fetchReceiptNumber();

        // Show success message using Snackbar
        setSnackbarMessage("Receipt printed successfully");
        setSnackbarVisible(true);

        // Close the receipt modal after a short delay
        setTimeout(() => {
          setShowReceiptModal(false);
        }, 1500);
      } else {
        // Show error message using Snackbar
        setSnackbarMessage("Failed to print receipt. Please try again.");
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      // Show error message using Snackbar
      setSnackbarMessage(
        "Error printing receipt. Please check printer connection."
      );
      setSnackbarVisible(true);
    }
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Receipt</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.cardContainer}>
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

            <Text style={styles.sectionTitle}>Transaction Details</Text>

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
                value={`₱ ${totalPrice}`}
                editable={false}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={onSubmit}>
            <Text style={styles.buttonText}>Save Receipt</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer}></View>

        {/* Receipt Preview Modal */}
        <Modal
          visible={showReceiptModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowReceiptModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.receiptContainer}>
              <ScrollView>
                <View style={styles.receiptHeader}>
                  <Text style={styles.companyName}>Luansing Rice Mill</Text>
                  <Text style={styles.receiptDate}>{currentDate}</Text>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.customerInfo}>
                  <Text style={styles.receiptLabel}>Customer:</Text>
                  <Text style={styles.receiptValue}>{watch("customer")}</Text>

                  <Text style={styles.receiptLabel}>Address:</Text>
                  <Text style={styles.receiptValue}>{watch("address")}</Text>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptItem}>
                  <Text style={styles.receiptLabel}>Copra Price/kg:</Text>
                  <Text style={styles.receiptValue}>
                    ₱{watch("copraPrice")}
                  </Text>
                </View>

                <View style={styles.receiptItem}>
                  <Text style={styles.receiptLabel}>Total Copra:</Text>
                  <Text style={styles.receiptValue}>
                    {watch("totalCopra")} kg
                  </Text>
                </View>

                <View style={styles.receiptItem}>
                  <Text style={styles.receiptLabel}>Deduction:</Text>
                  <Text style={styles.receiptValue}>
                    {watch("totalDeduction")} kg
                  </Text>
                </View>

                <View style={styles.receiptItem}>
                  <Text style={styles.receiptLabel}>Net Copra:</Text>
                  <Text style={styles.receiptValue}>
                    {(
                      parseFloat(watch("totalCopra")) -
                      parseFloat(watch("totalDeduction"))
                    ).toFixed(2)}{" "}
                    kg
                  </Text>
                </View>

                <View style={styles.receiptItem}>
                  <Text style={styles.receiptLabel}>Transportation Fee:</Text>
                  <Text style={styles.receiptValue}>
                    ₱{watch("transportationFee")}
                  </Text>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptTotal}>
                  <Text style={styles.totalReceiptLabel}>TOTAL AMOUNT:</Text>
                  <Text style={styles.totalReceiptValue}>₱{totalPrice}</Text>
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.printReceiptButton}
                  onPress={() => {
                    setShowReceiptModal(false);
                    // Small delay to ensure first modal is closed before second opens
                    setTimeout(() => {
                      setShowPrintPreview(true);
                    }, 300);
                  }}
                >
                  <Text style={styles.buttonText}>Print</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowReceiptModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Final Print Preview Modal */}
        <Modal
          visible={showPrintPreview}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPrintPreview(false)}
        >
          <View style={styles.printPreviewOverlay}>
            <View style={styles.printPreviewContainer}>
              <View style={styles.printPreviewHeader}>
                <Text style={styles.printPreviewTitle}>Print Preview</Text>
              </View>

              <ScrollView style={styles.printReceiptScroll}>
                <View style={styles.actualReceipt}>
                  {/* Company Header */}
                  <View style={styles.actualReceiptHeader}>
                    <Text style={styles.actualCompanyName}>
                      LUANSING RICE MILL
                    </Text>
                    <Text style={styles.actualCompanyAddress}>
                      #10 Odicon, Pasacao, Camarines Sur, Naga City, Philippines
                    </Text>
                    <Text style={styles.actualCompanyContact}>
                      Cell: 09292800067
                    </Text>
                  </View>

                  <View style={styles.actualReceiptDivider} />

                  {/* Receipt Info */}
                  <View style={styles.actualReceiptInfo}>
                    <View style={styles.actualReceiptRow}>
                      <Text style={styles.actualReceiptLabel}>RECEIPT NO:</Text>
                      <Text style={styles.actualReceiptValue}>
                        {receiptNumber}
                      </Text>
                    </View>
                    <View style={styles.actualReceiptRow}>
                      <Text style={styles.actualReceiptLabel}>DATE:</Text>
                      <Text style={styles.actualReceiptValue}>
                        {currentDateTime}
                      </Text>
                    </View>
                  </View>

                  {/* Customer Info */}
                  <View style={styles.actualCustomerInfo}>
                    <View style={styles.actualReceiptRow}>
                      <Text style={styles.actualReceiptLabel}>CUSTOMER:</Text>
                      <Text style={styles.actualReceiptValue}>
                        {watch("customer")}
                      </Text>
                    </View>
                    <View style={styles.actualReceiptRow}>
                      <Text style={styles.actualReceiptLabel}>ADDRESS:</Text>
                      <Text style={styles.actualReceiptValue}>
                        {watch("address")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actualReceiptDivider} />

                  {/* Items */}
                  <View style={styles.actualReceiptItems}>
                    <View style={styles.actualReceiptItemHeader}>
                      <Text style={styles.actualItemHeaderText}>ITEM</Text>
                      <Text style={styles.actualItemHeaderText}>AMOUNT</Text>
                    </View>

                    <View style={styles.actualReceiptItem}>
                      <View style={styles.actualItemDescription}>
                        <Text style={styles.actualItemName}>Copra</Text>
                        <Text style={styles.actualItemDetail}>
                          {watch("totalCopra")} kg @ ₱{watch("copraPrice")}/kg
                        </Text>
                        <Text style={styles.actualItemDetail}>
                          Less: {watch("totalDeduction")} kg deduction
                        </Text>
                      </View>
                      <Text style={styles.actualItemAmount}>
                        ₱
                        {(
                          (parseFloat(watch("totalCopra")) -
                            parseFloat(watch("totalDeduction"))) *
                          parseFloat(watch("copraPrice"))
                        ).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.actualReceiptItem}>
                      <View style={styles.actualItemDescription}>
                        <Text style={styles.actualItemName}>
                          Transportation Fee
                        </Text>
                      </View>
                      <Text style={styles.actualItemAmount}>
                        ₱{watch("transportationFee")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actualReceiptDivider} />

                  {/* Total */}
                  <View style={styles.actualReceiptTotal}>
                    <Text style={styles.actualTotalLabel}>TOTAL AMOUNT:</Text>
                    <Text style={styles.actualTotalValue}>₱{totalPrice}</Text>
                  </View>

                  <View style={styles.actualReceiptFooter}>
                    <Text style={styles.actualFooterText}>
                      Thank you for your business!
                    </Text>
                    <Text style={styles.actualFooterText}>
                      * This serves as your official receipt *
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.printPreviewButtons}>
                <TouchableOpacity
                  style={styles.confirmPrintButton}
                  onPress={handlePrint}
                >
                  <Text style={styles.buttonText}>Confirm Print</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowPrintPreview(false)}
                >
                  <Text style={styles.closeButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingBottom: 80,
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
    zIndex: 10000,
    position: "relative",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 40 + Constants.statusBarHeight,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  formContainer: {
    width: "100%",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a5653",
    marginVertical: 12,
    paddingHorizontal: 10,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  customerRow: {
    borderLeftWidth: 3,
    borderLeftColor: "#1a5653",
    backgroundColor: "#f9fafb",
  },
  addressRow: {
    alignItems: "flex-start",
    paddingVertical: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#1a5653",
    backgroundColor: "#f9fafb",
  },
  totalRow: {
    backgroundColor: "#f0f9f6",
    borderWidth: 1,
    borderColor: "#1a5653",
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  customerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a5653",
    flex: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a5653",
    flex: 1,
  },
  fieldInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    textAlign: "right",
    fontSize: 15,
  },
  customerInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: "white",
    textAlign: "left",
    fontSize: 15,
  },
  addressInput: {
    flex: 1,
    height: 80,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
    textAlign: "left",
    fontSize: 15,
  },
  totalInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#1a5653",
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: "white",
    textAlign: "right",
    fontSize: 18,
    fontWeight: "700",
    color: "#1a5653",
  },
  saveButton: {
    backgroundColor: "#2a9d8f",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    color: "#e53e3e",
    marginBottom: 8,
    marginTop: -5,
    marginLeft: 10,
    textAlign: "left",
    fontSize: 12,
  },
  inputError: {
    borderColor: "#e53e3e",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  receiptContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 15,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1a5653",
  },
  receiptDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  receiptDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 12,
  },
  customerInfo: {
    marginBottom: 12,
  },
  receiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  receiptLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  receiptTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalReceiptLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a5653",
  },
  totalReceiptValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a5653",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  printReceiptButton: {
    backgroundColor: "#2a9d8f",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
    elevation: 0,
  },
  closeButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 0,
  },
  closeButtonText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  printPreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  printPreviewContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "95%",
    maxHeight: "90%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  printPreviewHeader: {
    backgroundColor: "#2a9d8f",
    padding: 16,
    alignItems: "center",
  },
  printPreviewTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  printReceiptScroll: {
    padding: 16,
    maxHeight: "75%",
  },
  actualReceipt: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  actualReceiptHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  actualCompanyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  actualCompanyAddress: {
    fontSize: 12,
    marginBottom: 2,
    textAlign: "center",
  },
  actualCompanyContact: {
    fontSize: 12,
    textAlign: "center",
  },
  actualReceiptDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.2)",
    marginVertical: 10,
  },
  actualReceiptInfo: {
    marginBottom: 10,
  },
  actualCustomerInfo: {
    marginBottom: 10,
  },
  actualReceiptRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  actualReceiptLabel: {
    fontSize: 12,
    fontWeight: "bold",
    width: 80,
  },
  actualReceiptValue: {
    fontSize: 12,
    flex: 1,
  },
  actualReceiptItems: {
    marginBottom: 10,
  },
  actualReceiptItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
  },
  actualItemHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  actualReceiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  actualItemDescription: {
    flex: 2,
  },
  actualItemName: {
    fontSize: 12,
    fontWeight: "500",
  },
  actualItemDetail: {
    fontSize: 10,
    color: "#555",
  },
  actualItemAmount: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  actualReceiptTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  actualTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  actualTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  actualReceiptFooter: {
    marginTop: 20,
    alignItems: "center",
  },
  actualFooterText: {
    fontSize: 10,
    color: "#555",
    marginBottom: 2,
  },
  printPreviewButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  confirmPrintButton: {
    backgroundColor: "#2a9d8f",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  snackbar: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: "#2a9d8f",
    borderRadius: 6,
    elevation: 6,
    zIndex: 1000,
  },
  spacer: {
    height: 30,
  },
});
