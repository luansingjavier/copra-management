import { StyleSheet } from "react-native";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Image,
} from "react-native";
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
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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
    setShowReceiptModal(true);
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

  // Generate receipt number
  const receiptNumber = useMemo(() => {
    return `RCT-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
  }, [showPrintPreview]);

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
                        {currentDate}
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
                  onPress={() => {
                    Alert.alert("Printing", "Sending receipt to printer...");
                    setShowPrintPreview(false);
                    setShowReceiptModal(false);
                  }}
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
    textAlign: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  receiptContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 15,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  receiptDate: {
    fontSize: 14,
    color: "#555",
  },
  receiptDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginVertical: 10,
  },
  customerInfo: {
    marginBottom: 10,
  },
  receiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  receiptLabel: {
    fontSize: 14,
    color: "#555",
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  receiptTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  totalReceiptLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalReceiptValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a90e2",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  printReceiptButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
  },
  closeButtonText: {
    color: "#333",
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
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    width: "95%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  printPreviewHeader: {
    backgroundColor: "#4a90e2",
    padding: 15,
    alignItems: "center",
  },
  printPreviewTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  printReceiptScroll: {
    padding: 15,
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
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
});
