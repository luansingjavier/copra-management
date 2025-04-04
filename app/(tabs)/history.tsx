import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
} from "react-native";
import { getAllReceipts } from "@/database/database";
import { formatDate } from "@/utils/dateUtils";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";

interface Receipt {
  id: string;
  receiptNumber: string;
  customer: string;
  address: string;
  copraPrice: string;
  totalCopra: string;
  totalDeduction: string;
  transportationFee: string;
  totalPrice: string;
  createdAt: Date;
}

export default function History() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated]);

  // Fetch all receipts from the database
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const allReceipts = await getAllReceipts();
      console.log("Fetched receipts:", allReceipts.length);
      setReceipts(allReceipts);
      setFilteredReceipts(allReceipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch receipts on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchReceipts();
    }
  }, [isAuthenticated]);

  // Filter receipts when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredReceipts(receipts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = receipts.filter(
        (receipt) =>
          receipt.receiptNumber.toLowerCase().includes(query) ||
          receipt.customer.toLowerCase().includes(query) ||
          receipt.address.toLowerCase().includes(query)
      );
      setFilteredReceipts(filtered);
    }
  }, [searchQuery, receipts]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchReceipts();
  };

  // Render each receipt item
  const renderItem = ({ item }: { item: Receipt }) => {
    // Convert string date to Date object if needed
    const date =
      item.createdAt instanceof Date
        ? item.createdAt
        : new Date(item.createdAt);

    return (
      <View style={styles.receiptItem}>
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptNumber}>{item.receiptNumber}</Text>
          <Text style={styles.receiptDate}>{formatDate(date)}</Text>
        </View>

        <View style={styles.receiptDetails}>
          <Text style={styles.customerName}>{item.customer}</Text>
          <Text style={styles.address}>{item.address}</Text>

          <View style={styles.transactionDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Copra Price:</Text>
              <Text style={styles.detailValue}>₱{item.copraPrice}/kg</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Copra:</Text>
              <Text style={styles.detailValue}>{item.totalCopra} kg</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Deduction:</Text>
              <Text style={styles.detailValue}>{item.totalDeduction} kg</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transportation Fee:</Text>
              <Text style={styles.detailValue}>₱{item.transportationFee}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Price:</Text>
              <Text style={styles.totalValue}>₱{item.totalPrice}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by receipt number, customer, or address"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      ) : (
        <>
          {filteredReceipts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {receipts.length === 0
                  ? "No transactions found"
                  : "No matching transactions found"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredReceipts}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1a5653",
    padding: 16,
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#555",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#555",
  },
  receiptItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a5653",
  },
  receiptDate: {
    fontSize: 14,
    color: "#666",
  },
  receiptDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  transactionDetails: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#555",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a5653",
  },
});
