import React, { useEffect, useState, useRef } from "react";
import { WebView } from "react-native-webview";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import Header from "../components/header";
import Overlay from "../components/overlay";
import { useUserStore } from "../store/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FancyBackground from "../styles/FancyBackground";
import { Ionicons } from "@expo/vector-icons";

// Helper to get token
const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return token;
  } catch (err) {
    console.error("Error getting token:", err);
    return null;
  }
};

const Billing = () => {
  const user = useUserStore((state) => state.user);
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedBill, setSelectedBill] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Refs for animations
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch billing data function
  const fetchBillingData = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("No token found");

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/billings/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch: ${response.status} - ${text}`);
      }

      const data = await response.json();

      // Sort by due date descending
      const sortedData = data.sort(
        (a, b) => new Date(b.due_date) - new Date(a.due_date)
      );
      setBillingData(sortedData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [user]);

  // Pull to refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchBillingData();
      setRefreshing(false);
    } catch (error) {
      console.error("Refresh error:", error);
      setRefreshing(false);
    }
  }, [user]);

  // Manual refresh function
  const handleManualRefresh = () => {
    if (refreshing) return;

    // Scroll to top if needed
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });

    // Trigger refresh
    onRefresh();
  };

  // Handle Pay Now button click
  const handlePayNow = (bill) => {
    setSelectedBill(bill);

    // For now, show alert. Replace with your webview logic
    Alert.alert(
      "Confirm Payment",
      `Pay ${formatCurrency(bill.amount_due)} for bill due on ${formatDate(
        bill.due_date
      )}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed to Payment",
          onPress: () => initiatePayment(bill),
          style: "default",
        },
      ]
    );
  };

  // Initiate payment process
  const initiatePayment = async (bill) => {
    setPaymentProcessing(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/billings/invoice/${bill.id}`,
        {
          method: "GET", // ✅ backend requires GET
          headers: {
            Authorization: `Bearer ${token}`, // ✅ REQUIRED
            Accept: "application/json",
          },
        }
      );

      const responseText = await response.text();
      console.log("Payment API raw response:", responseText);

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${responseText}`);
      }

      const paymentData = JSON.parse(responseText);

      if (paymentData.url) {
        setSelectedBill({
          ...bill,
          payment_url: paymentData.url,
        });
        setShowWebView(true);
      } else {
        Alert.alert(
          "Payment Initiated",
          "Your payment has been initiated. Please follow the instructions provided."
        );
      }
    } catch (error) {
      console.error("Payment initiation error:", error.message);
      Alert.alert(
        "Payment Error",
        error.message || "Failed to initiate payment. Please try again."
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Handle webview close
  const handleWebViewClose = (success = false) => {
    setShowWebView(false);
    setSelectedBill(null);

    if (success) {
      // Refresh billing data after successful payment
      fetchBillingData();
      Alert.alert(
        "Payment Successful",
        "Your payment has been processed successfully.",
        [{ text: "OK" }]
      );
    }
  };

  // WebView Modal Component
  const PaymentWebView = () => {
    // This is where you'll implement your WebView component
    // For now, it's a placeholder

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={showWebView}
        onRequestClose={() => handleWebViewClose()}
      >
        <View style={styles.webviewContainer}>
          <View style={styles.webviewHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => handleWebViewClose()}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>Payment Gateway</Text>
            <View style={styles.closeButtonPlaceholder} />
          </View>

          {/* WebView will go here */}
          <WebView
            source={{ uri: selectedBill?.payment_url }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator size="large" color="#00afa1ff" />
            )}
            onNavigationStateChange={(navState) => {
              if (navState.url.includes("success")) {
                handleWebViewClose(true);
              }
              if (
                navState.url.includes("cancel") ||
                navState.url.includes("failure")
              ) {
                handleWebViewClose(false);
              }
            }}
          />
        </View>
      </Modal>
    );
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₱0.00";
    return `₱${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Utility function to format date into words
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    // Options for long date format
    const options = { year: "numeric", month: "long", day: "numeric" };

    return date.toLocaleDateString("en-US", options);
  };

  // Scroll to top function
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header />
        <Overlay />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00afa1ff" />
          <Text style={styles.loadingText}>Loading billing data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <Overlay />

      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00afa1ff"]}
            tintColor="#00afa1ff"
            title="Pull to refresh billing"
            titleColor="#00afa1ff"
            progressBackgroundColor="#fff"
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Billing</Text>
          {refreshing && (
            <View style={styles.refreshingIndicator}>
              <Ionicons
                name="sync"
                size={16}
                color="#00afa1ff"
                style={styles.refreshingSpinner}
              />
              <Text style={styles.refreshingText}>
                Updating billing data...
              </Text>
            </View>
          )}
        </View>

        {billingData.length > 0 ? (
          billingData.map((item) => (
            <View
              key={item.id}
              style={[
                styles.historyCardContainer,
                refreshing && styles.historyCardRefreshing,
              ]}
            >
              <TouchableOpacity
                onPress={() => setSelectedBill(item)}
                style={styles.cardTouchable}
                activeOpacity={0.7}
              >
                <View style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      Due: {formatDate(item.due_date)}
                    </Text>
                    <Text
                      style={[
                        styles.statusText,
                        item.status.toLowerCase() === "paid"
                          ? styles.statusPaid
                          : styles.statusUnpaid,
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.amountContainer}>
                    <View style={styles.amountColumn}>
                      <Text style={styles.amountLabel}>Amount Due:</Text>
                      <Text style={styles.historyAmount}>
                        {formatCurrency(item.amount_due)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount Paid:</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(item.amount_paid)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment Mode:</Text>
                      <Text style={styles.detailValue}>
                        {item.payment_mode ?? "N/A"}
                      </Text>
                    </View>
                    {item.penalty > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, styles.penaltyLabel]}>
                          Penalty:
                        </Text>
                        <Text style={[styles.detailValue, styles.penaltyValue]}>
                          {formatCurrency(item.penalty)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.noDataText}>No billing data available</Text>
            <TouchableOpacity
              style={styles.refreshEmptyButton}
              onPress={handleManualRefresh}
              disabled={refreshing}
            >
              <Ionicons name="refresh" size={18} color="#00afa1ff" />
              <Text style={styles.refreshEmptyButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pull to refresh hint */}
        {!refreshing && billingData.length > 0 && (
          <View style={styles.pullHint}>
            <Ionicons name="arrow-down" size={16} color="#999" />
            <Text style={styles.pullHintText}>Pull down to refresh</Text>
          </View>
        )}

        {/* Scroll to top button */}
        <Animated.View
          style={[
            styles.scrollToTopButton,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 100, 200],
                outputRange: [0, 0.5, 1],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [0, 100],
                    outputRange: [50, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.scrollToTopTouchable}
            onPress={scrollToTop}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-up" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>

      {/* Payment WebView Modal */}
      <PaymentWebView />
      {/* Billing Details Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={!!selectedBill && !showWebView}
        onRequestClose={() => setSelectedBill(null)}
      >
        <View style={styles.webviewContainer}>
          <View style={styles.webviewHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedBill(null)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>BILLING DETAILS</Text>
            <View style={styles.closeButtonPlaceholder} />
          </View>

          <ScrollView
            contentContainerStyle={styles.billingDetailsContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedBill && (
              <View style={styles.billingDetailsCard}>
                {/* Reference Number */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference Number:</Text>
                  <Text style={[styles.detailValue, styles.referenceNumber]}>
                    {selectedBill.reference_number || "N/A"}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      selectedBill.status.toLowerCase() === "paid"
                        ? styles.statusBadgePaid
                        : styles.statusBadgeUnpaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        selectedBill.status.toLowerCase() === "paid"
                          ? styles.statusPaid
                          : styles.statusUnpaid,
                      ]}
                    >
                      {selectedBill.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Due Date */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedBill.due_date)}
                  </Text>
                </View>

                {/* Amount Due */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount Due:</Text>
                  <Text style={[styles.detailValue, styles.amountHighlight]}>
                    {formatCurrency(selectedBill.amount_due)}
                  </Text>
                </View>

                {/* Amount Paid */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount Paid:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(selectedBill.amount_paid)}
                  </Text>
                </View>

                {/* Balance */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      selectedBill.balance > 0
                        ? styles.balanceUnpaid
                        : styles.balancePaid,
                    ]}
                  >
                    {formatCurrency(selectedBill.balance)}
                  </Text>
                </View>

                {/* Payment Mode */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Mode:</Text>
                  <Text style={styles.detailValue}>
                    {selectedBill.payment_mode || "N/A"}
                  </Text>
                </View>

                {/* Penalty */}
                {(() => {
                  if (!selectedBill.due_date) return null;

                  const dueDate = new Date(selectedBill.due_date);
                  const today = new Date();

                  // Calculate difference in days
                  const diffTime = today - dueDate; // milliseconds
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                  // Show penalty if more than 10 days past due date
                  return diffDays > 10 ? (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, styles.penaltyLabel]}>
                        Penalty:
                      </Text>
                      <Text style={[styles.detailValue, styles.penaltyValue]}>
                        {formatCurrency(100)}
                      </Text>
                    </View>
                  ) : null;
                })()}

                {/* Notes */}
                {selectedBill.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesValue}>{selectedBill.notes}</Text>
                  </View>
                )}

                {/* Pay Now Button if unpaid */}
                {selectedBill.status.toLowerCase() === "unpaid" && (
                  <TouchableOpacity
                    style={[
                      styles.payNowButton,
                      styles.payNowButtonLarge,
                      paymentProcessing && styles.payNowButtonDisabled,
                    ]}
                    onPress={() => initiatePayment(selectedBill)}
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="card"
                          size={20}
                          color="#fff"
                          style={styles.payNowIcon}
                        />
                        <Text style={styles.payNowText}>Pay Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeDetailsButton}
                  onPress={() => setSelectedBill(null)}
                >
                  <Text style={styles.closeDetailsButtonText}>
                    Close Details
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  refreshingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  refreshingSpinner: {
    marginRight: 8,
  },
  refreshingText: {
    fontSize: 14,
    color: "#00afa1ff",
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyCardRefreshing: {
    opacity: 0.7,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    color: "#666",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    textAlign: "center",
  },
  statusPaid: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  statusUnpaid: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  amountColumn: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  historyAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  payNowButton: {
    backgroundColor: "#00afa1ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  payNowButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  payNowIcon: {
    marginRight: 10,
  },
  payNowText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  penaltyLabel: {
    color: "#dc3545",
  },
  penaltyValue: {
    color: "#dc3545",
    fontWeight: "600",
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    marginBottom: 20,
  },
  refreshEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  refreshEmptyButtonText: {
    marginLeft: 8,
    color: "#00afa1ff",
    fontWeight: "600",
  },
  pullHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  pullHintText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#999",
  },
  scrollToTopButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#00afa1ff",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollToTopTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  // WebView Styles
  webviewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
  },
  closeButton: {
    padding: 8,
  },
  webviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButtonPlaceholder: {
    width: 40,
  },
  webviewPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  webviewPlaceholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  simulatePaymentButton: {
    marginTop: 30,
    backgroundColor: "#00afa1ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  simulatePaymentButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  // bag o ni
  billingDetailsContent: {
    padding: 20,
  },
  billingDetailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  referenceNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00afa1ff",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  statusBadgePaid: {
    backgroundColor: "#d4edda",
  },
  statusBadgeUnpaid: {
    backgroundColor: "#f8d7da",
  },
  amountHighlight: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  balancePaid: {
    color: "#28a745",
  },
  balanceUnpaid: {
    color: "#dc3545",
    fontWeight: "700",
  },
  penaltyLabel: {
    color: "#dc3545",
  },
  penaltyValue: {
    color: "#dc3545",
    fontWeight: "700",
  },
  notesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  notesValue: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  payNowButtonLarge: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 10,
  },
  closeDetailsButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  closeDetailsButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default Billing;
