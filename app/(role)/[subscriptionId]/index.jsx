import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../../store/user";
import { WebView } from "react-native-webview";

const SubscriptionDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useUserStore((state) => state.user);

  const subscription = params.subscription
    ? JSON.parse(params.subscription)
    : null;
  const colors = params.colors ? JSON.parse(params.colors) : null;

  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [creditsPaymentProcessing, setCreditsPaymentProcessing] =
    useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setIsLoading(false);
    }, [])
  );

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

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return token;
    } catch (err) {
      return null;
    }
  };

  // Function to get the upcoming unpaid bill
  const getUpcomingBill = () => {
    if (
      !subscription?.billing ||
      !Array.isArray(subscription.billing) ||
      subscription.billing.length === 0
    ) {
      return null;
    }

    // Sort all bills by due date (earliest to latest)
    const sortedBills = [...subscription.billing].sort((a, b) => {
      const dateA = new Date(a.due_date || 0);
      const dateB = new Date(b.due_date || 0);
      return dateA - dateB; // Earliest first
    });

    // Find the first unpaid bill
    const upcomingUnpaidBill = sortedBills.find(
      (bill) => bill.status && bill.status.toLowerCase() !== "paid",
    );

    return upcomingUnpaidBill;
  };

  // Calculate total amount due including penalties and discount
  const calculateTotalDue = (bill) => {
    if (!bill) return 0;

    let total = bill.amount_due || 0;
    total += bill.penalty || 0;
    total -= bill.discount || 0;
    total += bill.previous_balance || 0;

    return Math.max(0, total); // Ensure non-negative
  };

  // Payment functions
  const handlePayNow = async (billingItem) => {
    setPaymentProcessing(true);
    setSelectedBill(billingItem);

    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const response = await fetch(
        `https://tub.kazibufastnet.com/api/app/billings/invoice/${billingItem.id}`,
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

      if (!response.ok) {
        throw new Error(
          `Payment failed: ${response.status} - ${responseText.substring(0, 100)}`,
        );
      }

      let paymentData;
      try {
        paymentData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid response from payment server");
      }

      if (paymentData.url) {
        setPaymentUrl(paymentData.url);
        setShowWebView(true);
      } else {
        Alert.alert(
          "Payment Error",
          "Payment gateway URL not received. Please try again or contact support.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Payment Error",
        error.message || "Failed to initiate payment. Please try again.",
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayWithCreditsPoints = (billingItem) => {
    router.push({
      pathname: "/(role)/(payment)/credits-points",
      params: {
        billingId: billingItem.id,
        amountDue: billingItem.amount_due.toString(),
        dueDate: billingItem.due_date,
        subscriptionId: subscription.subscription_id || "N/A",
        billDetails: JSON.stringify(billingItem),
      },
    });
  };

  const handleWebViewClose = (success = false) => {
    setShowWebView(false);
    setSelectedBill(null);
    setPaymentUrl("");

    if (success) {
      Alert.alert(
        "Payment Successful",
        "Your payment has been processed successfully. Please refresh to see updated status.",
        [{ text: "OK" }],
      );
    }
  };

  const PaymentWebViewScreen = () => {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={showWebView}
        onRequestClose={() => handleWebViewClose()}
      >
        <SafeAreaView
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
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>Payment Gateway</Text>
            <View style={styles.webviewRightPlaceholder} />
          </View>

          {paymentUrl ? (
            <WebView
              source={{ uri: paymentUrl }}
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
                if (
                  navState.url.includes("success") ||
                  navState.url.includes("completed") ||
                  navState.url.includes("thank-you") ||
                  navState.url.includes("payment-success")
                ) {
                  handleWebViewClose(true);
                }
                if (
                  navState.url.includes("cancel") ||
                  navState.url.includes("failure") ||
                  navState.url.includes("error") ||
                  navState.url.includes("payment-failed")
                ) {
                  handleWebViewClose(false);
                }
              }}
              onError={(error) => {
                Alert.alert(
                  "WebView Error",
                  "Failed to load payment page. Please try again.",
                );
                handleWebViewClose(false);
              }}
              onHttpError={(error) => {
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
        </SafeAreaView>
      </Modal>
    );
  };

  const fetchSubscriptionDetails = async () => {
    if (!subscription?.id) return;

    setLoadingDetails(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token found");
      const subdomain= user.branch.subdomain;

      const response = await fetch(
        `https://${subdomain}.kazibufastnet.com/api/app/subscriptions/view/${subscription.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();
      setSubscriptionDetails(data.subscription || data);
    } catch (err) {
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (!subscription?.id) return;
    fetchSubscriptionDetails();
  }, [subscription?.id]);

  const handleViewBillingHistory = async () => {
    try {
      setIsLoading(true);
      
      // Small delay to ensure UI updates before navigation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      router.push({
        pathname: `/${subscription.id}/billHistory`,
        params: {
          subscription: JSON.stringify(subscription),
          colors: JSON.stringify(colors),
        },
      });
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const installationAddress = subscription?.installation_address || "N/A";
  const upcomingBill = getUpcomingBill();
  const totalDue = calculateTotalDue(upcomingBill);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      

      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Details</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

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
            style={[styles.detailsLoadingText, { color: colors.textLight }]}
          >
            Loading details...
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {subscription && (
          <>
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
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>
                  Account Number:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {subscription.subscription_id || "N/A"}
                </Text>
              </View>

              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: colors.primary + "05" },
                ]}
              >
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>
                  Account Name:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {user?.name}
                </Text>
              </View>

              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: colors.primary + "05" },
                ]}
              >
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>
                  Status:
                </Text>
                <View
                  style={[
                    styles.detailStatusBadge,
                    subscription.status === "active"
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
                      subscription.status === "active"
                        ? [styles.detailStatusActive, { color: colors.primary }]
                        : [styles.detailStatusEnded, { color: colors.danger }],
                    ]}
                  >
                    {subscription.status?.toUpperCase() || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

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
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>
                  Plan:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {subscriptionDetails?.plan?.name ||
                    subscription?.plan?.name ||
                    subscription?.plan_name ||
                    "N/A"}
                </Text>
              </View>

              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: colors.primary + "05" },
                ]}
              >
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>
                  Transaction Date:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(subscription.transaction_date)}
                </Text>
              </View>

              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: colors.primary + "05" },
                ]}
              >
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>
                  Date Started:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(subscription.start_date)}
                </Text>
              </View>

              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: colors.primary + "05" },
                ]}
              >
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>
                  Installed Date:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(subscription?.installed_date)}
                </Text>
              </View>

              {subscription.end_date && (
                <View
                  style={[
                    styles.detailRow,
                    { borderBottomColor: colors.primary + "05" },
                  ]}
                >
                  <Text
                    style={[styles.detailLabel, { color: colors.textLight }]}
                  >
                    End Date:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(subscription.end_date)}
                  </Text>
                </View>
              )}
            </View>

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
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>
                  Installation Address:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {installationAddress}
                </Text>
              </View>

              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: colors.primary + "05" },
                ]}
              >
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>
                  Installation Fee:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatCurrency(subscription.installation_fee)}
                </Text>
              </View>
            </View>

            {/* Upcoming Bill Section */}
            {upcomingBill && (
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
                  Upcoming Bill
                </Text>

                <View
                  style={[
                    styles.detailRow,
                    { borderBottomColor: colors.primary + "05" },
                  ]}
                >
                  <Text
                    style={[styles.detailLabel, { color: colors.textLight }]}
                  >
                    Amount Due:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatCurrency(upcomingBill.amount_due)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.detailRow,
                    { borderBottomColor: colors.primary + "05" },
                  ]}
                >
                  <Text
                    style={[styles.detailLabel, { color: colors.textLight }]}
                  >
                    Due Date:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(upcomingBill.due_date)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.detailRow,
                    { borderBottomColor: colors.primary + "05" },
                  ]}
                >
                  <Text
                    style={[styles.detailLabel, { color: colors.textLight }]}
                  >
                    Status:
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      upcomingBill.status === "paid"
                        ? { color: colors.primary, fontWeight: "600" }
                        : { color: colors.danger, fontWeight: "600" },
                    ]}
                  >
                    {upcomingBill.status?.toUpperCase() || "N/A"}
                  </Text>
                </View>

                {/* Previous Balance */}
                <View
                  style={[
                    styles.detailRow,
                    { borderBottomColor: colors.primary + "05" },
                  ]}
                >
                  <Text
                    style={[styles.detailLabel, { color: colors.textLight }]}
                  >
                    Previous Balance:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatCurrency(upcomingBill.previous_balance || 0)}
                  </Text>
                </View>

                {/* Penalty */}
                {(upcomingBill.penalty || 0) > 0 && (
                  <View
                    style={[
                      styles.detailRow,
                      { borderBottomColor: colors.primary + "05" },
                    ]}
                  >
                    <Text
                      style={[styles.detailLabel, { color: colors.danger }]}
                    >
                      Penalty:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: colors.danger, fontWeight: "600" },
                      ]}
                    >
                      +{formatCurrency(upcomingBill.penalty || 0)}
                    </Text>
                  </View>
                )}

                {/* Discount */}
                {(upcomingBill.discount || 0) > 0 && (
                  <View
                    style={[
                      styles.detailRow,
                      { borderBottomColor: colors.primary + "05" },
                    ]}
                  >
                    <Text
                      style={[styles.detailLabel, { color: colors.success }]}
                    >
                      Discount:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: colors.success, fontWeight: "600" },
                      ]}
                    >
                      -{formatCurrency(upcomingBill.discount || 0)}
                    </Text>
                  </View>
                )}

                {/* Total Amount Due Line */}
                <View
                  style={[
                    styles.totalDueContainer,
                    {
                      backgroundColor: colors.primary + "10",
                      borderColor: colors.primary + "20",
                    },
                  ]}
                >
                  <Text style={[styles.totalDueLabel, { color: colors.text }]}>
                    Total Amount Due:
                  </Text>
                  <Text
                    style={[
                      styles.totalDueValue,
                      { color: colors.primary, fontWeight: "700" },
                    ]}
                  >
                    {formatCurrency(totalDue)}
                  </Text>
                </View>

                {/* Payment Buttons */}
                <View style={styles.paymentButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.payNowButton,
                      styles.payNowButtonHistory,
                      {
                        backgroundColor: colors.primary,
                        flex: 1,
                        marginRight: 5,
                      },
                      paymentProcessing && styles.payNowButtonDisabled,
                    ]}
                    onPress={() => {
                      Alert.alert(
                        "Confirm Payment",
                        `Pay ${formatCurrency(
                          totalDue,
                        )} for bill due on ${formatDate(upcomingBill.due_date)}?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Proceed to Payment",
                            onPress: () => handlePayNow(upcomingBill),
                            style: "default",
                          },
                        ],
                      );
                    }}
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
                        <Text style={styles.payNowText}>
                          Pay via E-Wallet / Bank
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.payNowButton,
                      styles.payNowButtonHistory,
                      {
                        backgroundColor: colors.secondary,
                        flex: 1,
                        marginLeft: 5,
                      },
                      creditsPaymentProcessing && styles.payNowButtonDisabled,
                    ]}
                    onPress={() => {
                      Alert.alert(
                        "Pay with Credits Points",
                        `Pay ${formatCurrency(
                          totalDue,
                        )} using your credits points?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Proceed",
                            onPress: () =>
                              handlePayWithCreditsPoints(upcomingBill),
                            style: "default",
                          },
                        ],
                      );
                    }}
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
                        <Text style={styles.payNowText}>
                          Pay With Credits Points
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {subscription.billing && subscription.billing.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.viewBillingHistoryButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isLoading ? 0.7 : 1,
                  },
                ]}
                onPress={handleViewBillingHistory}
                disabled={isLoading}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.white}
                      style={{ marginRight: 8 }}
                    />
                  ) : (
                    <Ionicons
                      name="receipt-outline"
                      size={20}
                      color={colors.white}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text style={styles.viewBillingHistoryButtonText}>
                    {isLoading ? "Loading..." : "View Paid Bills History"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Payment WebView Modal */}
      <PaymentWebViewScreen />
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
    paddingTop: 40,
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
  detailsLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  detailsLoadingText: {
    fontSize: 14,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  detailSection: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    marginBottom: 12,
    paddingBottom: 12,
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
  totalDueContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  totalDueLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalDueValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  paymentButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  payNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  payNowButtonHistory: {
    marginTop: 0,
  },
  payNowButtonDisabled: {
    opacity: 0.7,
  },
  payNowText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 8,
    marginLeft: 6,
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
  // WebView styles
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
    borderBottomColor: "rgba(0,0,0,0.1)",
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
  detailStatusBadgeActive: {},
  detailStatusBadgeEnded: {},
  detailStatusActive: {},
  detailStatusEnded: {},
});

export default SubscriptionDetailsScreen;