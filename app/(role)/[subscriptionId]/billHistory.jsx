import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  SafeAreaView,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../../store/user";
 

const { width, height } = Dimensions.get("window");

const BillingHistoryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useUserStore((state) => state.user);

  const subscription = params.subscription
    ? JSON.parse(params.subscription)
    : null;
  const colors = params.colors ? JSON.parse(params.colors) : null;

  const [selectedBill, setSelectedBill] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₱0.00";
    return `₱${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Helper function to format billing period
  const getBillingPeriod = (item) => {
    // Try different field names for billing period
    if (item.period) return item.period;

    // If we have start_date and end_date
    if (item.start_date && item.end_date) {
      return `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`;
    }

    // If we have billing_date (single date billing)
    if (item.billing_date) {
      return formatDate(item.billing_date);
    }

    // If we have due_date only, use month of due date
    if (item.due_date) {
      const dueDate = new Date(item.due_date);
      const monthYear = dueDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      return `Billing for ${monthYear}`;
    }

    // Fallback: Try to get from created_at or updated_at
    if (item.created_at) {
      const createdDate = new Date(item.created_at);
      const monthYear = createdDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      return `Billing for ${monthYear}`;
    }

    return "Billing Period";
  };

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return token;
    } catch (err) {
      return null;
    }
  };

  // Get only paid bills (history)
  const getBillingHistory = () => {
    if (!subscription || !Array.isArray(subscription.billing)) return [];
    
    // Filter only paid bills
    const paidBills = subscription.billing.filter(bill => 
      bill.status && bill.status.toLowerCase() === 'paid'
    );
    
    // Sort by due date descending (most recent first)
    return [...paidBills].sort(
      (a, b) => new Date(b.due_date || 0) - new Date(a.due_date || 0),
    );
  };

  // FIXED: Updated formatPaymentMethod function to properly show "Credits Points"
  const formatPaymentMethod = (method, billItem = null) => {

    // First, check if this is likely a credits points payment
    // Credits points payments have payment_mode = null but bill is paid
    if (!method && billItem) {
      if (billItem.status && billItem.status.toLowerCase() === "paid") {
        if (billItem.amount_paid && billItem.amount_paid > 0) {
          return "Credits Points";
        }
      }
      return "N/A";
    }

    // Convert to string and trim
    const methodStr = String(method).trim();

    // Special case for null string
    if (methodStr.toLowerCase() === "null") {
      if (
        billItem &&
        billItem.status &&
        billItem.status.toLowerCase() === "paid"
      ) {
        if (billItem.amount_paid && billItem.amount_paid > 0) {
          return "Credits Points";
        }
      }
      return "N/A";
    }

    // Check if it's a valid string
    if (methodStr.length === 0) {
      return "N/A";
    }

    const lowerMethod = methodStr.toLowerCase();

    // Enhanced mapping for common payment methods
    const methodMap = {
      credits_points: "Credits Points",
      credit_points: "Credits Points",
      credits: "Credits",
      points: "Credits Points", // Changed from 'Points' to 'Credits Points'
      cash: "Cash",
      card: "Card",
      credit_card: "Credit Card",
      debit_card: "Debit Card",
      online: "Online",
      bank_transfer: "Bank Transfer",
      bank: "Bank",
      gcash: "GCash",
      paymaya: "PayMaya",
      grabpay: "GrabPay",
      paypal: "PayPal",
      wallet: "E-Wallet",
      ewallet: "E-Wallet",
      digital_wallet: "Digital Wallet",
      manual: "Manual",
      offline: "Offline",
      credit: "Credit",
      debit: "Debit",
      check: "Check",
      money_order: "Money Order",
      wire_transfer: "Wire Transfer",
      paypal_express: "PayPal Express",
      stripe: "Stripe",
      authorize_net: "Authorize.Net",
      square: "Square",
    };

    // Check for exact match first
    if (methodMap[lowerMethod]) {
      return methodMap[lowerMethod];
    }

    // Check for partial matches, but prioritize "credits" related matches
    // First check if it contains "credits" or "points"
    if (lowerMethod.includes("credits") || lowerMethod.includes("credit")) {
      return "Credits Points";
    }

    if (lowerMethod.includes("points")) {
      return "Credits Points";
    }

    // Check other partial matches
    for (const [key, value] of Object.entries(methodMap)) {
      if (lowerMethod.includes(key)) {
        return value;
      }
    }
    return methodStr
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  
  // FIXED: handleCardPressHistory function
  const handleCardPressHistory = async (item) => {

    // Set loading state
    setReceiptLoading(true);
    setSelectedBill(item);

    try {
      const token = await getToken();
      if (token) {
        // Fetch the detailed bill data
        const response = await fetch(
          `https://staging.kazibufastnet.com/api/app/billings/view/${item.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();

          // Extract address and contact
          let address = data.address || "Address not available";
          let contactNumber = data.contactNumber || "Contact not available";

          // Get billing data
          const billingData = data.billing || data.data || item;

          // Get payment method - prefer from detailed data, fallback to item
          const rawPaymentMode = billingData.payment_mode || item.payment_mode;

          // Format the payment method with the bill item for context
          let paymentMethod = formatPaymentMethod(rawPaymentMode, billingData);

          // Create merged bill object
          const mergedBill = {
            ...billingData,
            address,
            contactNumber,
            payment_mode: rawPaymentMode,
          };

          setSelectedBill(mergedBill);

          // Generate receipt data
          const newReceiptData = {
            companyName: "KAZIBUFAST NETWORKS",
            companyAddress: address,
            companyPhone: contactNumber,
            accountNumber:
              mergedBill.reference_number ||
              mergedBill.account_number ||
              item.account_number ||
              "N/A",
            customerName: user?.name || "Customer Name",
            dueDate: formatDate(mergedBill.due_date || item.due_date),
            paymentMethod: paymentMethod,
            paymentDate:
              formatDate(mergedBill.payment_date || item.payment_date) ||
              formatDate(new Date()),
            previousBalance:
              mergedBill.previous_balance || item.previous_balance || 0,
            currentCharges: mergedBill.amount_due || item.amount_due || 0,
            totalDue:
              mergedBill.total_due ||
              mergedBill.amount_due ||
              item.total_due ||
              item.amount_due ||
              0,
            discount: mergedBill.discount || item.discount || 0,
            penalty: mergedBill.penalty || item.penalty || 0,
            paymentAmount: mergedBill.amount_paid || item.amount_paid || 0,
          };
          setReceiptData(newReceiptData);
        } else {
          generateReceiptFromItem(item);
        }
      } else {
        generateReceiptFromItem(item);
      }
    } catch (error) {
      generateReceiptFromItem(item);
    } finally {
      // Hide loading and show receipt after a brief delay for smooth transition
      setTimeout(() => {
        setReceiptLoading(false);
        setShowReceipt(true);
      }, 300);
    }
  };

  // FIXED: Helper function to generate receipt from item data
  const generateReceiptFromItem = (item) => {

    // Extract payment method - item.payment_mode has the data
    const rawPaymentMode = item.payment_mode;

    // Format the payment method with the item for context
    let paymentMethod = formatPaymentMethod(rawPaymentMode, item);

    const receiptPlan = item?.plan?.name || subscription?.plan?.name || "N/A";

    const basicReceiptData = {
      companyName: "KAZIBUFAST NETWORKS",
      companyAddress: "Address not available",
      companyPhone: "Contact not available",
      accountNumber:
        item.account_number ||
        item.reference_number ||
        item.account_id ||
        subscription?.subscription_id ||
        "N/A",
      customerName: user?.name || "Customer Name",
      dueDate: formatDate(item.due_date),
      paymentMethod: paymentMethod,
      paymentDate: formatDate(item.payment_date) || formatDate(new Date()),
      previousBalance: item.previous_balance || 0,
      currentCharges: item.amount_due || 0,
      totalDue: item.total_due || item.amount_due,
      discount: item.discount || 0,
      penalty: item.penalty || 0,
      paymentAmount: item.amount_paid || 0,
    };
    setReceiptData(basicReceiptData);
  };

  const renderReceiptRow = (label, value, isLast = false) => {
    return (
      <View style={[styles.receiptRow, isLast && styles.receiptLastRow]}>
        <Text style={[styles.receiptLabel, { color: colors.textLight }]}>
          {label}:
        </Text>
        <Text style={[styles.receiptValue, { color: colors.text }]}>
          {value}
        </Text>
      </View>
    );
  };

  const ReceiptScreen = () => {
    if (!receiptData) return null;

    const receiptPlan =
      selectedBill?.plan?.name || subscription?.plan?.name || "N/A";

    return (
      <Modal
        visible={showReceipt}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowReceipt(false)}
      >
        <SafeAreaView
          style={[
            styles.receiptContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[styles.receiptHeader, { backgroundColor: colors.primary }]}
          >
            <TouchableOpacity
              onPress={() => setShowReceipt(false)}
              style={styles.receiptBackButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.receiptHeaderTitle}>Payment Receipt</Text>
            <View style={styles.receiptHeaderRightPlaceholder} />
          </View>

          <ScrollView
            style={styles.receiptContent}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.companyHeader,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.companyName, { color: colors.text }]}>
                {receiptData.companyName || "KAZIBUFAST NETWORKS"}
              </Text>
              <Text style={[styles.companyInfo, { color: colors.textLight }]}>
                Address: {receiptData.companyAddress}
              </Text>
              <Text style={[styles.companyInfo, { color: colors.textLight }]}>
                Contact No: {receiptData.companyPhone}
              </Text>
            </View>

            <Text style={[styles.receiptTitle, { color: colors.text }]}>
              Payment Details
            </Text>

            <View
              style={[styles.receiptTable, { backgroundColor: colors.surface }]}
            >
              {renderReceiptRow("Account Number", receiptData.accountNumber)}
              {renderReceiptRow("Account Name", receiptData.customerName)}
              {renderReceiptRow("Plan", receiptPlan)}
              {renderReceiptRow("Due Date", receiptData.dueDate)}
              {renderReceiptRow("Payment Method", receiptData.paymentMethod)}
              {renderReceiptRow("Payment Date", receiptData.paymentDate)}
              {renderReceiptRow(
                "Previous Balance",
                formatCurrency(receiptData.previousBalance),
              )}
              {renderReceiptRow(
                "Current Charges",
                formatCurrency(receiptData.currentCharges),
              )}
              {renderReceiptRow(
                "Total Amount Due",
                formatCurrency(receiptData.totalDue),
              )}
              {renderReceiptRow(
                "Discount",
                formatCurrency(receiptData.discount),
              )}
              {renderReceiptRow("Penalty", formatCurrency(receiptData.penalty))}
              {renderReceiptRow(
                "Paid Amount",
                formatCurrency(receiptData.paymentAmount),
                true,
              )}
            </View>

            <View style={styles.receiptFooter}>
              <Text
                style={[styles.receiptFooterText, { color: colors.textLight }]}
              >
                This is an electronically generated receipt. No signature
                required.
              </Text>
              <Text style={[styles.receiptDate, { color: colors.textLight }]}>
                Generated on: {formatDate(new Date())}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // FIXED: renderBillingHistoryItem function
  const renderBillingHistoryItem = ({ item }) => {

    const isPaid = item.status && item.status.toLowerCase() === "paid";

    // Get formatted billing period
    const billingPeriod = getBillingPeriod(item);

    // FIXED: Get formatted payment method directly from item.payment_mode
    let paymentMethodDisplay = formatPaymentMethod(item.payment_mode, item);

    const CardContent = () => (
      <View
        style={[
          styles.billingHistoryCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primary + "10",
          },
        ]}
      >
        <View style={styles.billingHeader}>
          <View>
            <Text style={[styles.billingPeriod, { color: colors.textLight }]}>
              Billing Period
            </Text>
            <Text style={[styles.billingDateRange, { color: colors.text }]}>
              {billingPeriod}
            </Text>
          </View>
          <View
            style={[
              styles.billingStatusBadge,
              isPaid
                ? [
                    styles.billingStatusPaid,
                    { backgroundColor: colors.primary + "15" },
                  ]
                : [
                    styles.billingStatusUnpaid,
                    { backgroundColor: colors.danger + "15" },
                  ],
            ]}
          >
            <Text
              style={[
                styles.billingStatusText,
                isPaid
                  ? [styles.billingStatusTextPaid, { color: colors.primary }]
                  : [styles.billingStatusTextUnpaid, { color: colors.danger }],
              ]}
            >
              {item.status ? item.status.toUpperCase() : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.billingDetails}>
          <View style={styles.billingRow}>
            <Text
              style={[styles.billingDetailLabel, { color: colors.textLight }]}
            >
              Amount Due:
            </Text>
            <Text style={[styles.billingDetailValue, { color: colors.text }]}>
              {formatCurrency(item.amount_due)}
            </Text>
          </View>
          <View style={styles.billingRow}>
            <Text
              style={[styles.billingDetailLabel, { color: colors.textLight }]}
            >
              Amount Paid:
            </Text>
            <Text style={[styles.billingDetailValue, { color: colors.text }]}>
              {formatCurrency(item.amount_paid)}
            </Text>
          </View>
          <View style={styles.billingRow}>
            <Text
              style={[styles.billingDetailLabel, { color: colors.textLight }]}
            >
              Due Date:
            </Text>
            <Text style={[styles.billingDetailValue, { color: colors.text }]}>
              {formatDate(item.due_date)}
            </Text>
          </View>
          <View style={styles.billingRow}>
            <Text
              style={[styles.billingDetailLabel, { color: colors.textLight }]}
            >
              Payment Method:
            </Text>
            <Text style={[styles.billingDetailValue, { color: colors.text }]}>
              {paymentMethodDisplay}
            </Text>
          </View>
          {item.penalty > 0 && (
            <View style={styles.billingRow}>
              <Text
                style={[
                  styles.billingDetailLabel,
                  styles.penaltyLabel,
                  { color: colors.danger },
                ]}
              >
                Penalty:
              </Text>
              <Text
                style={[
                  styles.billingDetailValue,
                  styles.penaltyValue,
                  { color: colors.danger },
                ]}
              >
                {formatCurrency(item.penalty)}
              </Text>
            </View>
          )}
        </View>

        {/* Receipt indicator for paid bills */}
        {isPaid && (
          <View style={styles.receiptIndicator}>
            <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            <Text style={[styles.receiptText, { color: colors.primary }]}>
              Tap to view receipt
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.primary}
              style={styles.receiptChevron}
            />
          </View>
        )}
      </View>
    );

    return (
      <TouchableOpacity
        onPress={() => handleCardPressHistory(item)}
        activeOpacity={0.7}
      >
        <CardContent />
      </TouchableOpacity>
    );
  };

  const billingHistory = getBillingHistory();

  const handleBack = () => {
    router.back();
  };

  if (!subscription) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={60} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>
            Subscription data not found
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paid Bills History</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Account Info Bar */}
      <View
        style={[styles.accountInfoBar, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.accountNumber, { color: colors.text }]}>
          Account: {subscription?.subscription_id || "N/A"}
        </Text>
        <Text style={[styles.billingCount, { color: colors.textLight }]}>
          {billingHistory.length} paid bill{billingHistory.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Billing History List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {billingHistory.length > 0 ? (
          <FlatList
            data={billingHistory}
            renderItem={renderBillingHistoryItem}
            keyExtractor={(item) =>
              item.id?.toString() || Math.random().toString()
            }
            scrollEnabled={false}
            contentContainerStyle={styles.billingList}
            ItemSeparatorComponent={() => (
              <View
                style={[
                  styles.billingSeparator,
                  { backgroundColor: colors.background },
                ]}
              />
            )}
          />
        ) : (
          <View style={styles.noBillingContainer}>
            <Ionicons name="receipt-outline" size={60} color={colors.gray} />
            <Text style={[styles.noBillingText, { color: colors.textLight }]}>
              No paid bills found
            </Text>
            <Text style={[styles.noBillingSubtext, { color: colors.gray }]}>
              This subscription has no paid billing records yet
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Receipt Screen */}
      <ReceiptScreen />
      {receiptLoading && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={receiptLoading}
          onRequestClose={() => setReceiptLoading(false)}
        >
          <View style={styles.fullScreenLoading}>
            <View
              style={[styles.loadingModal, { backgroundColor: colors.surface }]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    paddingTop:40
  },
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  headerRightPlaceholder: {
    width: 40,
  },
  accountInfoBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  billingCount: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  billingList: {
    paddingBottom: 10,
  },
  billingSeparator: {
    height: 12,
  },
  billingHistoryCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  billingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  billingPeriod: {
    fontSize: 12,
    marginBottom: 2,
  },
  billingDateRange: {
    fontSize: 16,
    fontWeight: "600",
  },
  billingStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  billingStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  billingDetails: {
    marginTop: 12,
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  billingDetailLabel: {
    fontSize: 14,
  },
  billingDetailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  fullScreenLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loadingModal: {
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
  },
  penaltyLabel: {},
  penaltyValue: {
    fontWeight: "600",
  },
  receiptIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  receiptText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
    marginRight: 4,
  },
  receiptChevron: {
    marginLeft: 2,
  },
  noBillingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noBillingText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  noBillingSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  // Receipt Screen styles
  receiptContainer: {
    flex: 1,
  },
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  receiptBackButton: {
    padding: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  receiptHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  receiptHeaderRightPlaceholder: {
    width: 40,
  },
  receiptContent: {
    flex: 1,
    padding: 16,
  },
  companyHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  companyInfo: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  receiptTable: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  receiptLastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  receiptFooter: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  receiptFooterText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 8,
  },
  receiptDate: {
    fontSize: 12,
    fontStyle: "italic",
  },
  receiptButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
  },
  pdfButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginRight: 8,
  },
  printButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Status styles
  billingStatusPaid: {},
  billingStatusUnpaid: {},
  billingStatusTextPaid: {},
  billingStatusTextUnpaid: {},
});

export default BillingHistoryScreen;