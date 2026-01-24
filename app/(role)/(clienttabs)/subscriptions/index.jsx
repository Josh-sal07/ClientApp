import React, { useEffect, useState, useRef } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import Overlay from "../../../../components/overlay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../../../store/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useTheme } from "../../../../theme/ThemeContext";
import { useColorScheme } from "react-native";

const { width, height } = Dimensions.get("window");

const SubscriptionScreen = () => {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();

  // Determine effective theme mode
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  // Define colors based on theme
  const COLORS = {
    light: {
      primary: "#21C7B9", // Teal from "KAZIBU FAST"
      secondary: "#00AFA1", // Darker teal
      dark: "#1b2e2c", // Dark teal/gray
      white: "#FFFFFF",
      lightGray: "#F8F9FA",
      gray: "#718096",
      darkGray: "#1A202C",
      border: "#E2E8F0",
      success: "#00AFA1",
      warning: "#FFA726",
      danger: "#FF6B6B",
      facebook: "#1877F2",
      surface: "#FFFFFF",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
    },
    dark: {
      primary: "#1f6f68", // Darker teal for dark mode
      secondary: "#00AFA1",
      dark: "#121212",
      white: "#FFFFFF",
      lightGray: "#1E1E1E",
      gray: "#9E9E9E",
      darkGray: "#121212",
      border: "#333333",
      success: "#00AFA1",
      warning: "#FFA726",
      danger: "#FF6B6B",
      facebook: "#1877F2",
      surface: "#1E1E1E",
      background: "#121212",
      text: "#FFFFFF",
      textLight: "#B0B0B0",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null); // NEW: For detailed view
  const [selectedBill, setSelectedBill] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showBillingHistory, setShowBillingHistory] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false); // NEW: For loading details

  const [creditsPaymentProcessing, setCreditsPaymentProcessing] =
    useState(false); // NEW

  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return token;
    } catch (err) {
      console.error("Error getting token:", err);
      return null;
    }
  };

  const fetchSubscriptionData = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token found. Please login again.");
      if (!user || !user.id) throw new Error("User not found.");

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/subscriptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();
      console.log("API Response RAW:", JSON.stringify(data, null, 2));

      // Debug: Log the structure
      console.log("Data type:", typeof data);
      console.log("Data keys:", Object.keys(data || {}));

      // SIMPLIFIED FIX: Handle the nested structure from your JSON
      if (data && data.subscription) {
        // If we have a subscription object (from your JSON example)
        const subscriptionData = data.subscription;

        // Check if it's an array or single object
        if (Array.isArray(subscriptionData)) {
          // Multiple subscriptions
          setSubscriptions(subscriptionData);
          console.log(
            `Set ${subscriptionData.length} subscriptions from data.subscription array`,
          );

          // Debug each subscription
          subscriptionData.forEach((sub, index) => {
            console.log(`Subscription ${index} plan:`, sub?.plan?.name);
          });
        } else if (subscriptionData.id) {
          // Single subscription object
          setSubscriptions([subscriptionData]);
          console.log("Set 1 subscription from data.subscription object");
          console.log("Plan name:", subscriptionData?.plan?.name);
        } else {
          setSubscriptions([]);
          console.log("No valid subscription in data.subscription");
        }
      } else if (Array.isArray(data)) {
        // Direct array of subscriptions
        setSubscriptions(data);
        console.log(`Set ${data.length} subscriptions (direct array)`);

        // Debug each subscription
        data.forEach((sub, index) => {
          console.log(`Subscription ${index} plan:`, sub?.plan?.name);
        });
      } else {
        setSubscriptions([]);
        console.log("No subscription data found");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // NEW: Fetch subscription details from the view endpoint
  const fetchSubscriptionDetails = async (subscriptionId) => {
    setLoadingDetails(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token found");

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/subscriptions/view/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();
      console.log("Subscription Details Response:", data);

      // Extract the subscription from the response
      setSubscriptionDetails(data.subscription || data);
    } catch (err) {
      console.error("Error fetching subscription details:", err);
      Alert.alert("Error", "Failed to load subscription details");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchSubscriptionData();
    setRefreshing(false);
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₱0.00";
    return `₱${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleCardPress = async (subscription) => {
    setSelectedSubscription(subscription);
    setShowBillingHistory(false);
    setModalVisible(true);

    // Fetch detailed subscription data
    if (subscription.id) {
      await fetchSubscriptionDetails(subscription.id);
    }
  };

  const handleViewBillingHistory = (subscription) => {
    setSelectedSubscription(subscription);
    setShowBillingHistory(true);
    setModalVisible(true);
  };

  // Credits points pay button

  const handlePayWithCreditsPoints = (billingItem) => {
    setSelectedBill(billingItem);

    Alert.alert(
      "Pay with Credits Points",
      `Pay ${formatCurrency(billingItem.amount_due)} using your credits points?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          onPress: () => navigateToCreditsPayment(billingItem),
          style: "default",
        },
      ],
    );
  };

  const navigateToCreditsPayment = (billingItem) => {
    // Navigate to the credits points payment page
    router.push({
      pathname: "/(role)/(payment)/credits-points",
      params: {
        billingId: billingItem.id,
        amountDue: billingItem.amount_due.toString(),
        dueDate: billingItem.due_date,
        subscriptionId: selectedSubscription?.subscription_id || "N/A",
        billDetails: JSON.stringify(billingItem),
      },
    });
  };

  const handlePayNow = (billingItem) => {
    setSelectedBill(billingItem);

    Alert.alert(
      "Confirm Payment",
      `Pay ${formatCurrency(billingItem.amount_due)} for bill due on ${formatDate(
        billingItem.due_date,
      )}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed to Payment",
          onPress: () => initiatePayment(billingItem),
          style: "default",
        },
      ],
    );
  };

  // Initiate payment process
  const initiatePayment = async (bill) => {
    console.log("Initiating payment for bill:", bill);
    setPaymentProcessing(true); // Only set this for E-wallet/Bank payment

    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      console.log(`Calling payment API for bill ID: ${bill.id}`);

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/billings/invoice/${bill.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      const responseText = await response.text();
      console.log("Payment API response status:", response.status);
      console.log("Payment API raw response:", responseText);

      if (!response.ok) {
        console.error("Payment API error:", response.status, responseText);
        throw new Error(
          `Payment failed: ${response.status} - ${responseText.substring(0, 100)}`,
        );
      }

      let paymentData;
      try {
        paymentData = JSON.parse(responseText);
        console.log("Parsed payment data:", paymentData);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        throw new Error("Invalid response from payment server");
      }

      if (paymentData.url) {
        console.log("Payment URL received:", paymentData.url);
        setSelectedBill({
          ...bill,
          payment_url: paymentData.url,
        });
        setShowWebView(true);
      } else {
        console.warn("No URL in payment response:", paymentData);
        Alert.alert(
          "Payment Error",
          "Payment gateway URL not received. Please try again or contact support.",
        );
      }
    } catch (error) {
      console.error("Payment initiation error:", error.message);
      Alert.alert(
        "Payment Error",
        error.message || "Failed to initiate payment. Please try again.",
      );
    } finally {
      setPaymentProcessing(false); // Reset only this loading state
    }
  };

  // Handle webview close
  const handleWebViewClose = (success = false) => {
    setShowWebView(false);
    setSelectedBill(null);

    if (success) {
      fetchSubscriptionData();
      Alert.alert(
        "Payment Successful",
        "Your payment has been processed successfully.",
        [{ text: "OK" }],
      );
    } else {
      fetchSubscriptionData();
    }
  };

  // WebView Modal Component
  const PaymentWebView = () => {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={showWebView}
        onRequestClose={() => handleWebViewClose()}
      >
        <View
          style={[
            styles.webviewContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[styles.webviewHeader, { backgroundColor: colors.primary }]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => handleWebViewClose()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>Payment Gateway</Text>
            <View style={styles.webviewRightPlaceholder} />
          </View>

          {selectedBill?.payment_url ? (
            <WebView
              source={{ uri: selectedBill.payment_url }}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[
                      styles.webviewLoadingText,
                      { color: colors.textLight },
                    ]}
                  >
                    Loading payment gateway...
                  </Text>
                </View>
              )}
              onNavigationStateChange={(navState) => {
                console.log("WebView navigation state:", navState.url);
                if (
                  navState.url.includes("success") ||
                  navState.url.includes("completed") ||
                  navState.url.includes("thank-you")
                ) {
                  handleWebViewClose(true);
                }
                if (
                  navState.url.includes("cancel") ||
                  navState.url.includes("failure") ||
                  navState.url.includes("error")
                ) {
                  handleWebViewClose(false);
                }
              }}
              onError={(error) => {
                console.error("WebView error:", error);
                Alert.alert(
                  "WebView Error",
                  "Failed to load payment page. Please try again.",
                );
                handleWebViewClose(false);
              }}
              onHttpError={(error) => {
                console.error("WebView HTTP error:", error);
              }}
            />
          ) : (
            <View
              style={[
                styles.webviewPlaceholder,
                { backgroundColor: colors.background },
              ]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.webviewPlaceholderText,
                  { color: colors.textLight },
                ]}
              >
                Preparing payment gateway...
              </Text>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  // Get billing history from subscription data
  const getBillingHistory = (subscription) => {
    if (!subscription || !Array.isArray(subscription.billing)) return [];

    return [...subscription.billing].sort(
      (a, b) => new Date(b.due_date || 0) - new Date(a.due_date || 0),
    );
  };

  const renderSubscriptionCard = (subscription) => {
    const billingHistory = getBillingHistory(subscription);
    const currentBilling = billingHistory.length > 0 ? billingHistory[0] : null;
    return (
      <View key={subscription.id} style={styles.subscriptionCardContainer}>
        <TouchableOpacity
          style={[
            styles.subscriptionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary + "90",
            },
          ]}
          onPress={() => handleCardPress(subscription)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.accountNumber, { color: colors.text }]}>
              {subscription.subscription_id || "N/A"}
            </Text>
            <View
              style={[
                styles.statusBadge,
                subscription.status === "active"
                  ? styles.statusBadgeActive
                  : styles.statusBadgeEnded,
                subscription.status === "active"
                  ? { backgroundColor: colors.primary + "15" }
                  : { backgroundColor: colors.danger + "15" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  subscription.status === "active"
                    ? [styles.statusActive, { color: colors.primary }]
                    : [styles.statusEnded, { color: colors.danger }],
                ]}
              >
                {(subscription.status || "unknown").toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardRow}>
              <Ionicons name="wifi-outline" size={16} color={colors.primary} />
              <Text style={[styles.cardLabel, { color: colors.textLight }]}>
                Plan:
              </Text>
              <Text
                style={[styles.cardValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {subscription?.plan?.name ||
                  subscription?.plan?.name ||
                  subscription?.plan_name ||
                  "N/A"}
              </Text>
            </View>

            <View style={styles.cardRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.cardLabel, { color: colors.textLight }]}>
                Transaction Date:
              </Text>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {formatDate(subscription.transaction_date)}
              </Text>
            </View>

            <View style={styles.cardRow}>
              <Ionicons
                name="play-circle-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.cardLabel, { color: colors.textLight }]}>
                Date Started:
              </Text>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {formatDate(subscription.start_date)}
              </Text>
            </View>

            <View style={styles.cardRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.cardLabel, { color: colors.textLight }]}>
                Address:
              </Text>
              <Text
                style={[styles.addressValue, { color: colors.text }]}
                numberOfLines={2}
              >
                {subscription.installation_address || "N/A"}
              </Text>
            </View>

            {/* Current Billing Info */}
            {currentBilling && (
              <View
                style={[
                  styles.currentBillingContainer,
                  {
                    backgroundColor: colors.primary + "08",
                    borderColor: colors.primary + "15",
                  },
                ]}
              >
                <View style={styles.billingInfoRow}>
                  <Text
                    style={[styles.billingLabel, { color: colors.textLight }]}
                  >
                    Current Due:
                  </Text>
                  <Text style={[styles.billingAmount, { color: colors.text }]}>
                    {formatCurrency(currentBilling.amount_due)}
                  </Text>
                </View>
                <View style={styles.billingInfoRow}>
                  <Text
                    style={[styles.billingLabel, { color: colors.textLight }]}
                  >
                    Due Date:
                  </Text>
                  <Text
                    style={[styles.billingDate, { color: colors.textLight }]}
                  >
                    {formatDate(currentBilling.due_date)}
                  </Text>
                </View>
                <View style={styles.billingInfoRow}>
                  <Text
                    style={[styles.billingLabel, { color: colors.textLight }]}
                  >
                    Status:
                  </Text>
                  <Text
                    style={[
                      styles.billingStatus,
                      currentBilling.status === "paid"
                        ? [
                            styles.billingStatusPaid,
                            {
                              backgroundColor: colors.primary + "20",
                              color: colors.primary,
                            },
                          ]
                        : [
                            styles.billingStatusUnpaid,
                            {
                              backgroundColor: colors.danger + "20",
                              color: colors.danger,
                            },
                          ],
                    ]}
                  >
                    {currentBilling.status?.toUpperCase() || "N/A"}
                  </Text>
                </View>

                {/* Pay via e-wallet/bank Button for Current Unpaid Bill */}
                {currentBilling.status === "unpaid" && (
                  <TouchableOpacity
                    style={[
                      styles.payNowButton,
                      { backgroundColor: colors.primary },
                      paymentProcessing && styles.payNowButtonDisabled,
                    ]}
                    onPress={() => handlePayNow(currentBilling)}
                    disabled={paymentProcessing || creditsPaymentProcessing}
                  >
                    {paymentProcessing ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="card-outline"
                          size={16}
                          color={colors.white}
                          style={styles.payNowIcon}
                        />
                        <Text style={styles.payNowText}>
                          Pay via E-Wallet / Bank
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Pay Via Credits points Button for Current Unpaid Bill */}
                {currentBilling.status === "unpaid" && (
                  <TouchableOpacity
                    style={[
                      styles.payNowButton,
                      { backgroundColor: colors.secondary }, // Different color!
                      (paymentProcessing || creditsPaymentProcessing) &&
                        styles.payNowButtonDisabled,
                    ]}
                    onPress={() => handlePayWithCreditsPoints(currentBilling)}
                    disabled={paymentProcessing || creditsPaymentProcessing}
                  >
                    {creditsPaymentProcessing ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name="wallet-outline" // Different icon!
                          size={16}
                          color={colors.white}
                          style={styles.payNowIcon}
                        />
                        <Text style={styles.payNowText}>
                          Pay With Credits Points
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
              Tap to view details
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.primary}
                style={styles.chevronIcon}
              />
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBillingHistoryItem = ({ item }) => {
    const isUnpaid = item.status && item.status.toLowerCase() !== "paid";

    return (
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
              {item.period
                ? item.period
                : `${formatDate(item.start_date) || "N/A"} - ${
                    formatDate(item.end_date) || "N/A"
                  }`}
            </Text>
          </View>
          <View
            style={[
              styles.billingStatusBadge,
              item.status && item.status.toLowerCase() === "paid"
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
                item.status && item.status.toLowerCase() === "paid"
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
              Payment Mode:
            </Text>
            <Text style={[styles.billingDetailValue, { color: colors.text }]}>
              {item.payment_mode || "N/A"}
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

        {/* Pay Now Button for Unpaid Bills */}
        {isUnpaid && (
          <View style={styles.paymentButtonsContainer}>
            {/* E-Wallet/Bank Button */}
            <TouchableOpacity
              style={[
                styles.payNowButton,
                styles.payNowButtonHistory,
                { backgroundColor: colors.primary, flex: 1, marginRight: 5 },
                paymentProcessing && styles.payNowButtonDisabled,
              ]}
              onPress={() => handlePayNow(item)}
              disabled={paymentProcessing || creditsPaymentProcessing}
            >
              {paymentProcessing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="card-outline"
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.payNowText}>Pay Now</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Credits Points Button */}
            <TouchableOpacity
              style={[
                styles.payNowButton,
                styles.payNowButtonHistory,
                { backgroundColor: colors.secondary, flex: 1, marginLeft: 5 },
                creditsPaymentProcessing && styles.payNowButtonDisabled,
              ]}
              onPress={() => handlePayWithCreditsPoints(item)}
              disabled={paymentProcessing || creditsPaymentProcessing}
            >
              {creditsPaymentProcessing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="wallet-outline"
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.payNowText}>Credits</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderBillingHistoryModal = () => {
    const billingHistory = selectedSubscription
      ? getBillingHistory(selectedSubscription)
      : [];

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible && showBillingHistory}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { backgroundColor: colors.primary }]}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowBillingHistory(false);
                  setModalVisible(false);
                  setSubscriptionDetails(null); // Reset details
                }}
                style={styles.modalBackButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Billing History</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSubscriptionDetails(null); // Reset details
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.modalSubheader,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.modalSubtitle, { color: colors.text }]}>
                Account: {selectedSubscription?.subscription_id || "N/A"}
              </Text>
              <Text style={[styles.billingCount, { color: colors.textLight }]}>
                {billingHistory.length} billing record
                {billingHistory.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
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
                  <Ionicons
                    name="receipt-outline"
                    size={60}
                    color={colors.gray}
                  />
                  <Text
                    style={[styles.noBillingText, { color: colors.textLight }]}
                  >
                    No billing history found
                  </Text>
                  <Text
                    style={[styles.noBillingSubtext, { color: colors.gray }]}
                  >
                    This subscription has no billing records yet
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDetailsModal = () => {
    const installationAddress =
      selectedSubscription?.installation_address || "N/A";

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible && !showBillingHistory}
        onRequestClose={() => {
          setModalVisible(false);
          setSubscriptionDetails(null); // Reset details
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.modalTitle}>Subscription Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSubscriptionDetails(null); // Reset details
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Loading indicator for details */}
            {loadingDetails && (
              <View
                style={[
                  styles.detailsLoadingContainer,
                  {
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={[
                    styles.detailsLoadingText,
                    { color: colors.textLight },
                  ]}
                >
                  Loading details...
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
            >
              {selectedSubscription && (
                <>
                  {/* Account Details */}
                  <View
                    style={[
                      styles.detailSection,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.primary + "10",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          color: colors.text,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      Account Information
                    </Text>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Account Number:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {selectedSubscription.subscription_id || "N/A"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Account Name:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {user?.name}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Status:
                      </Text>
                      <View
                        style={[
                          styles.detailStatusBadge,
                          selectedSubscription.status === "active"
                            ? [
                                styles.detailStatusBadgeActive,
                                { backgroundColor: colors.primary + "15" },
                              ]
                            : [
                                styles.detailStatusBadgeEnded,
                                { backgroundColor: colors.danger + "15" },
                              ],
                        ]}
                      >
                        <Text
                          style={[
                            styles.detailStatusText,
                            selectedSubscription.status === "active"
                              ? [
                                  styles.detailStatusActive,
                                  { color: colors.primary },
                                ]
                              : [
                                  styles.detailStatusEnded,
                                  { color: colors.danger },
                                ],
                          ]}
                        >
                          {selectedSubscription.status?.toUpperCase() || "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Subscription Details */}
                  <View
                    style={[
                      styles.detailSection,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.primary + "10",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          color: colors.text,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      Subscription Details
                    </Text>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Plan:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {subscriptionDetails?.plan?.name ||
                          selectedSubscription?.plan?.name ||
                          selectedSubscription?.plan_name ||
                          "N/A"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Transaction Date:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {formatDate(selectedSubscription.transaction_date)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Date Started:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {formatDate(selectedSubscription.start_date)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Installed Date:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {formatDate(selectedSubscription?.installed_date)}
                      </Text>
                    </View>

                    {selectedSubscription.end_date && (
                      <View
                        style={[
                          styles.detailRow,
                          { borderBottomColor: colors.primary + "05" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.detailLabel,
                            { color: colors.textLight },
                          ]}
                        >
                          End Date:
                        </Text>
                        <Text
                          style={[styles.detailValue, { color: colors.text }]}
                        >
                          {formatDate(selectedSubscription.end_date)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Installation Details */}
                  <View
                    style={[
                      styles.detailSection,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.primary + "10",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          color: colors.text,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      Installation Details
                    </Text>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Installation Address:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {installationAddress}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Installation Fee:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {formatCurrency(selectedSubscription.installation_fee)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.detailRow,
                        { borderBottomColor: colors.primary + "05" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors.textLight },
                        ]}
                      >
                        Payment Mode:
                      </Text>
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {selectedSubscription.installation_fee_payment_mode ||
                          "N/A"}
                      </Text>
                    </View>
                  </View>

                  {/* Current Billing */}
                  {selectedSubscription.billing &&
                    selectedSubscription.billing.length > 0 && (
                      <View
                        style={[
                          styles.detailSection,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.primary + "10",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectionTitle,
                            {
                              color: colors.text,
                              borderBottomColor: colors.border,
                            },
                          ]}
                        >
                          Current Billing
                        </Text>

                        <View
                          style={[
                            styles.detailRow,
                            { borderBottomColor: colors.primary + "05" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.detailLabel,
                              { color: colors.textLight },
                            ]}
                          >
                            Amount Due:
                          </Text>
                          <Text
                            style={[styles.detailValue, { color: colors.text }]}
                          >
                            {formatCurrency(
                              selectedSubscription.billing[0].amount_due,
                            )}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.detailRow,
                            { borderBottomColor: colors.primary + "05" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.detailLabel,
                              { color: colors.textLight },
                            ]}
                          >
                            Due Date:
                          </Text>
                          <Text
                            style={[styles.detailValue, { color: colors.text }]}
                          >
                            {formatDate(
                              selectedSubscription.billing[0].due_date,
                            )}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.detailRow,
                            { borderBottomColor: colors.primary + "05" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.detailLabel,
                              { color: colors.textLight },
                            ]}
                          >
                            Status:
                          </Text>
                          <Text
                            style={[
                              styles.detailValue,
                              selectedSubscription.billing[0].status === "paid"
                                ? { color: colors.primary, fontWeight: "600" }
                                : { color: colors.danger, fontWeight: "600" },
                            ]}
                          >
                            {selectedSubscription.billing[0].status?.toUpperCase() ||
                              "N/A"}
                          </Text>
                        </View>
                      </View>
                    )}

                  {/* View Billing History Button */}
                  {selectedSubscription.billing &&
                    selectedSubscription.billing.length > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.viewBillingHistoryButton,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() =>
                          handleViewBillingHistory(selectedSubscription)
                        }
                      >
                        <Ionicons
                          name="receipt-outline"
                          size={20}
                          color={colors.white}
                        />
                        <Text style={styles.viewBillingHistoryButtonText}>
                          View All Billing History (
                          {selectedSubscription.billing.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Overlay />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>
            Loading subscriptions...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Overlay />
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={60} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchSubscriptionData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        <View style={styles.titleContainer}>
          <Text style={[styles.titleText, { color: colors.text }]}>
            My Subscriptions
          </Text>
          <Text style={[styles.subtitleText, { color: colors.textLight }]}>
            {subscriptions.length} subscription
            {subscriptions.length !== 1 ? "s" : ""} found
          </Text>
        </View>

        {subscriptions.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="receipt-outline" size={60} color={colors.gray} />
            <Text style={[styles.noDataText, { color: colors.textLight }]}>
              No subscriptions found
            </Text>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                {
                  backgroundColor: colors.primary + "10",
                  borderColor: colors.primary + "20",
                },
              ]}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text
                style={[styles.refreshButtonText, { color: colors.primary }]}
              >
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          subscriptions.map(renderSubscriptionCard)
        )}
      </Animated.ScrollView>

      {/* Payment WebView Modal */}
      <PaymentWebView />

      {/* Billing History Modal */}
      {renderDetailsModal()}
      {renderBillingHistoryModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitleText: {
    fontSize: 14,
    marginTop: 4,
  },
  subscriptionCardContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  subscriptionCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
    width: 120,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  addressValue: {
    fontSize: 14,
    flex: 1,
    fontStyle: "italic",
  },
  currentBillingContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  billingInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  billingLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  billingAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  billingDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  billingStatus: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  payNowButtonHistory: {
    marginTop: 16,
  },
  payNowButtonDisabled: {
    opacity: 0.7,
  },
  payNowIcon: {
    marginRight: 8,
  },
  payNowText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  viewDetailsText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  chevronIcon: {
    marginLeft: 4,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  refreshButtonText: {
    marginLeft: 8,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalBackButton: {
    padding: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  modalCloseButton: {
    padding: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  // NEW: Loading details styles
  detailsLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderBottomWidth: 1,
  },
  detailsLoadingText: {
    fontSize: 14,
    marginLeft: 10,
  },
  modalSubheader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  billingCount: {
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  detailSection: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewBillingHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  viewBillingHistoryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  // Billing History Styles
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
  penaltyLabel: {},
  penaltyValue: {
    fontWeight: "600",
  },
  noBillingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noBillingText: {
    fontSize: 16,
    marginTop: 12,
  },
  noBillingSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  // WebView Styles
  webviewContainer: {
    flex: 1,
  },
  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  webviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  webviewRightPlaceholder: {
    width: 40,
  },
  webviewPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  webviewPlaceholderText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  webviewLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webviewLoadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SubscriptionScreen;
