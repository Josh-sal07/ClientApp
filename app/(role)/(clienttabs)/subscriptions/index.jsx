import React, { useEffect, useState, useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../../../store/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useTheme } from "../../../../theme/ThemeContext";
import { useColorScheme } from "react-native";
import { sharedScrollY } from "../../../../shared/sharedScroll";

const { width, height } = Dimensions.get("window");

const MySubscriptionsScreen = () => {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();
  const scrollY = sharedScrollY;

  // Determine effective theme mode
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  // Define colors based on theme
  const COLORS = {
    light: {
      primary: "#21C7B9",
      secondary: "#00AFA1",
      dark: "#1b2e2c",
      white: "#FFFFFF",
      lightGray: "#F8F9FA",
      gray: "#718096",
      darkGray: "#1A202C",
      border: "#E2E8F0",
      success: "#00AFA1",
      warning: "#FFA726",
      danger: "#FF6B6B",
      surface: "#FFFFFF",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
    },
    dark: {
      primary: "#1f6f68",
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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [creditsPaymentProcessing, setCreditsPaymentProcessing] =
    useState(false);

  // WebView payment states
  const [showWebView, setShowWebView] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedSubscriptionForPayment, setSelectedSubscriptionForPayment] =
    useState(null);
  const [paymentUrl, setPaymentUrl] = useState("");

  // Loading states for navigation
  const [loadingNavigation, setLoadingNavigation] = useState({
    viewDetails: false,
    billingHistory: false,
    subscriptionId: null,
  });

  const scrollViewRef = useRef(null);

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return token;
    } catch (err) {
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

      if (data && data.subscription) {
        const subscriptionData = data.subscription;
        if (Array.isArray(subscriptionData)) {
          setSubscriptions(subscriptionData);
        } else if (subscriptionData.id) {
          setSubscriptions([subscriptionData]);
        } else {
          setSubscriptions([]);
        }
      } else if (Array.isArray(data)) {
        setSubscriptions(data);
      } else {
        setSubscriptions([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
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

  const handleViewDetails = async (subscription) => {
    try {
      // Set loading state for this specific subscription
      setLoadingNavigation({
        viewDetails: true,
        billingHistory: false,
        subscriptionId: subscription.id,
      });

      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      router.push({
        pathname: `/${subscription.id}`,
        params: {
          subscription: JSON.stringify(subscription),
          colors: JSON.stringify(colors),
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to navigate to subscription details.");
    } finally {
      // Reset loading state after navigation
      setLoadingNavigation({
        viewDetails: false,
        billingHistory: false,
        subscriptionId: null,
      });
    }
  };

  const handleViewBillingHistory = async (subscription) => {
    try {
      // Set loading state for this specific subscription
      setLoadingNavigation({
        viewDetails: false,
        billingHistory: true,
        subscriptionId: subscription.id,
      });

      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      router.push({
        pathname: `/${subscription.id}/billHistory`,
        params: {
          subscription: JSON.stringify(subscription),
          colors: JSON.stringify(colors),
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to navigate to billing history.");
    } finally {
      // Reset loading state after navigation
      setLoadingNavigation({
        viewDetails: false,
        billingHistory: false,
        subscriptionId: null,
      });
    }
  };

  const handlePayNow = async (billingItem, subscription) => {
    setPaymentProcessing(true);
    setSelectedBill(billingItem);
    setSelectedSubscriptionForPayment(subscription);

    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/billings/invoice/${billingItem.id}`,
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

  const handlePayWithCreditsPoints = (billingItem, subscription) => {
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
    setSelectedSubscriptionForPayment(null);
    setPaymentUrl("");

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

  const PaymentWebViewModal = () => {
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
                Alert.alert(
                  "WebView Error",
                  "Failed to load payment page. Please try again.",
                );
                handleWebViewClose(false);
              }}
              onHttpError={(error) => {}}
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

  const getBillingHistory = (subscription) => {
    if (!subscription || !Array.isArray(subscription.billing)) return [];
    return [...subscription.billing].sort(
      (a, b) => new Date(b.due_date || 0) - new Date(a.due_date || 0),
    );
  };

  const renderSubscriptionCard = (subscription) => {
    const billingHistory = getBillingHistory(subscription);
    const currentBilling = billingHistory.length > 0 ? billingHistory[0] : null;

    const isSubscriptionActive = subscription.status === "active";
    const isSubscriptionEnded =
      subscription.status === "ended" ||
      subscription.status === "cancelled" ||
      subscription.status === "terminated";
    const isCurrentBillUnpaid =
      currentBilling && currentBilling.status === "unpaid";
    const shouldShowPaymentButtons =
      isSubscriptionActive && isCurrentBillUnpaid;

    // Check if this subscription is loading for View Details
    const isViewDetailsLoading =
      loadingNavigation.viewDetails &&
      loadingNavigation.subscriptionId === subscription.id;

    // Check if this subscription is loading for Billing History
    const isBillingHistoryLoading =
      loadingNavigation.billingHistory &&
      loadingNavigation.subscriptionId === subscription.id;

    // Determine bill title based on subscription status
    const getBillTitle = () => {
      if (isSubscriptionEnded) {
        return "Final Bill";
      } else if (isSubscriptionActive) {
        return "Current Bill";
      }
      return "Bill Summary";
    };

    // Get appropriate status message
    const getStatusMessage = () => {
      if (isSubscriptionEnded && isCurrentBillUnpaid) {
        return {
          icon: "warning-outline",
          color: colors.warning,
          text: "Unpaid balance on ended subscription. Contact support.",
          type: "warning",
        };
      } else if (isSubscriptionEnded && currentBilling?.status === "paid") {
        return {
          icon: "checkmark-circle-outline",
          color: colors.success,
          text: "Subscription ended. All bills settled.",
          type: "success",
        };
      } else if (isSubscriptionActive && currentBilling?.status === "paid") {
        return {
          icon: "checkmark-circle-outline",
          color: colors.success,
          text: "Payment completed for this billing period",
          type: "success",
        };
      } else if (isSubscriptionActive && isCurrentBillUnpaid) {
        return null; // No message needed as payment buttons will show
      }
      return null;
    };

    const statusMessage = getStatusMessage();

    return (
      <View key={subscription.id} style={styles.subscriptionCardContainer}>
        <View
          style={[
            styles.subscriptionCard,
            {
              backgroundColor: colors.surface,
              borderColor: isSubscriptionEnded
                ? colors.gray + "50"
                : colors.primary + "90",
              shadowColor: effectiveMode === "dark" ? "transparent" : "#000",
              opacity: isSubscriptionEnded ? 0.9 : 1,
            },
          ]}
        >
          {/* Card Header with Status Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.accountInfo}>
              <View
                style={[
                  styles.accountIconContainer,
                  {
                    backgroundColor: isSubscriptionEnded
                      ? colors.gray
                      : colors.primary,
                  },
                ]}
              >
                <MaterialIcons
                  name={isSubscriptionEnded ? "wifi-off" : "wifi"}
                  size={20}
                  color={colors.white}
                />
              </View>
              <View>
                <Text
                  style={[styles.accountLabel, { color: colors.textLight }]}
                >
                  Account Number
                </Text>
                <Text
                  style={[
                    styles.accountNumber,
                    {
                      color: isSubscriptionEnded
                        ? colors.textLight
                        : colors.text,
                    },
                  ]}
                >
                  {subscription.subscription_id || "N/A"}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                isSubscriptionActive
                  ? styles.statusBadgeActive
                  : styles.statusBadgeEnded,
                isSubscriptionActive
                  ? { backgroundColor: colors.primary + "15" }
                  : { backgroundColor: colors.danger + "15" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isSubscriptionActive
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.danger },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isSubscriptionActive
                    ? [styles.statusActive, { color: colors.primary }]
                    : [styles.statusEnded, { color: colors.danger }],
                ]}
              >
                {(subscription.status || "unknown").toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* Plan Info */}
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.infoIcon,
                  {
                    backgroundColor: isSubscriptionEnded
                      ? colors.gray + "10"
                      : colors.primary + "10",
                  },
                ]}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color={isSubscriptionEnded ? colors.gray : colors.primary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textLight }]}>
                  Plan
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: isSubscriptionEnded
                        ? colors.textLight
                        : colors.text,
                    },
                  ]}
                >
                  {subscription?.plan?.name || "N/A"}
                </Text>
              </View>
            </View>

            {/* Current/Final Bill Section */}
            {currentBilling && (
              <View
                style={[
                  styles.currentBillingContainer,
                  {
                    backgroundColor: isSubscriptionEnded
                      ? colors.gray + "05"
                      : colors.primary + "08",
                    borderColor: isSubscriptionEnded
                      ? colors.gray + "20"
                      : colors.primary + "15",
                  },
                ]}
              >
                <View style={styles.billingHeader}>
                  <Text
                    style={[
                      styles.billingTitle,
                      {
                        color: isSubscriptionEnded
                          ? colors.textLight
                          : colors.text,
                      },
                    ]}
                  >
                    {getBillTitle().toUpperCase()}
                  </Text>

                  <View style={styles.billingStatusContainer}>
                    <View
                      style={[
                        styles.billingStatusDot,
                        currentBilling.status === "paid"
                          ? { backgroundColor: colors.success }
                          : { backgroundColor: colors.danger },
                      ]}
                    />
                    <Text
                      style={[
                        styles.billingStatus,
                        currentBilling.status === "paid"
                          ? { color: colors.success }
                          : { color: colors.danger },
                      ]}
                    >
                      {currentBilling.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.billingDetails}>
                  <View style={styles.billingAmountContainer}>
                    <Text
                      style={[styles.billingLabel, { color: colors.textLight }]}
                    >
                      Amount {isCurrentBillUnpaid ? "Due" : "Paid"}
                    </Text>
                    <Text
                      style={[
                        styles.billingAmount,
                        {
                          color: isSubscriptionEnded
                            ? colors.textLight
                            : colors.text,
                        },
                      ]}
                    >
                      {formatCurrency(currentBilling.amount_due)}
                    </Text>
                  </View>
                  <View style={styles.billingDateContainer}>
                    <Text
                      style={[styles.billingLabel, { color: colors.textLight }]}
                    >
                      {isSubscriptionEnded ? "Closed On" : "Due Date"}
                    </Text>
                    <Text
                      style={[styles.billingDate, { color: colors.textLight }]}
                    >
                      {formatDate(currentBilling.due_date)}
                    </Text>
                  </View>
                </View>

                {/* Payment Buttons - Only show for active subscriptions */}
                {shouldShowPaymentButtons && (
                  <View style={styles.paymentButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.paymentButton,
                        { backgroundColor: colors.primary },
                        paymentProcessing && styles.buttonDisabled,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          "Confirm Payment",
                          `Pay ${formatCurrency(currentBilling.amount_due)} for bill due on ${formatDate(
                            currentBilling.due_date,
                          )}?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Proceed to Payment",
                              onPress: () =>
                                handlePayNow(currentBilling, subscription),
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
                            size={18}
                            color={colors.white}
                            style={styles.buttonIcon}
                          />
                          <Text style={styles.buttonText}>
                            Pay via E-Wallet / Bank
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentButton,
                        { backgroundColor: colors.secondary },
                        creditsPaymentProcessing && styles.buttonDisabled,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          "Pay with Credits Points",
                          `Pay ${formatCurrency(currentBilling.amount_due)} using your credits points?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Proceed",
                              onPress: () =>
                                handlePayWithCreditsPoints(
                                  currentBilling,
                                  subscription,
                                ),
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
                            size={18}
                            color={colors.white}
                            style={styles.buttonIcon}
                          />
                          <Text style={styles.buttonText}>
                            Pay With Credits Points
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Status Messages */}
                {statusMessage && (
                  <View style={styles.statusMessageContainer}>
                    <View style={styles.statusMessage}>
                      <Ionicons
                        name={statusMessage.icon}
                        size={18}
                        color={statusMessage.color}
                      />
                      <Text
                        style={[
                          styles.statusMessageText,
                          { color: statusMessage.color },
                        ]}
                      >
                        {statusMessage.text}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Card Footer */}
          <View
            style={[
              styles.cardFooter,
              {
                borderTopColor: isSubscriptionEnded
                  ? colors.border + "40"
                  : colors.border + "80",
              },
            ]}
          >
            {/* View Details Button */}
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => handleViewDetails(subscription)}
              disabled={isViewDetailsLoading || isBillingHistoryLoading}
            >
              <View
                style={[
                  styles.footerIconContainer,
                  {
                    backgroundColor: isSubscriptionEnded
                      ? colors.gray + "10"
                      : colors.primary + "10",
                  },
                ]}
              >
                {isViewDetailsLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={isSubscriptionEnded ? colors.gray : colors.primary}
                  />
                ) : (
                  <Ionicons
                    name="document-text-outline"
                    size={30}
                    color={isSubscriptionEnded ? colors.gray : colors.primary}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.footerButtonText,
                  { color: isSubscriptionEnded ? colors.gray : colors.primary },
                ]}
              >
                {isViewDetailsLoading ? "Loading..." : "View Details"}
              </Text>
            </TouchableOpacity>

            {/* Billing History Button */}
            {subscription.billing && subscription.billing.length > 0 && (
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => handleViewBillingHistory(subscription)}
                disabled={isViewDetailsLoading || isBillingHistoryLoading}
              >
                <View
                  style={[
                    styles.footerIconContainer,
                    {
                      backgroundColor: isSubscriptionEnded
                        ? colors.gray + "10"
                        : colors.primary + "10",
                    },
                  ]}
                >
                  {isBillingHistoryLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={isSubscriptionEnded ? colors.gray : colors.primary}
                    />
                  ) : (
                    <Ionicons
                      name="receipt-outline"
                      size={30}
                      color={isSubscriptionEnded ? colors.gray : colors.primary}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.footerButtonText,
                    {
                      color: isSubscriptionEnded ? colors.gray : colors.primary,
                    },
                  ]}
                >
                  {isBillingHistoryLoading ? "Loading..." : "Billing History"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <View style={styles.errorContainer}>
          <View
            style={[
              styles.errorIconContainer,
              { backgroundColor: colors.danger + "10" },
            ]}
          >
            <Ionicons name="warning-outline" size={40} color={colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorText, { color: colors.textLight }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchSubscriptionData}
          >
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Image Background */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Background Image Container */}
      <View style={styles.imageContainer}>
        <ImageBackground
          source={require("../../../../assets/images/subscriptionbg.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Optional dark overlay for better text readability */}
          <View style={styles.imageOverlay} />
        </ImageBackground>

        {/* Summary Card positioned over the image */}
        <View style={[styles.summaryCard]}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryTitle, { color: colors.white }]}>
                My Subscriptions
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        {/* Subscriptions List */}
        <View style={styles.section}>
          <Text style={[styles.summarySubtitle, { color: colors.text }]}>
            {subscriptions.length} active subscription
            {subscriptions.length !== 1 ? "s" : ""}
          </Text>

          {subscriptions.length === 0 ? (
            <View style={styles.noDataContainer}>
              <View
                style={[
                  styles.noDataIconContainer,
                  { backgroundColor: colors.primary + "10" },
                ]}
              >
                <Ionicons
                  name="receipt-outline"
                  size={40}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.noDataTitle, { color: colors.text }]}>
                No subscriptions found
              </Text>
              <Text style={[styles.noDataText, { color: colors.textLight }]}>
                You don't have any active subscriptions yet.
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
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border + "80" }]}>
          <Text style={[styles.footerText, { color: colors.text }]}>
            Kazibufast Network
          </Text>
          <Text style={[styles.footerRights, { color: colors.gray }]}>
            © 2024 All rights reserved
          </Text>
        </View>
      </Animated.ScrollView>

      {/* Payment WebView Modal */}
      <PaymentWebViewModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Background image container
  imageContainer: {
    height: 260,
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  summaryCard: {
    backgroundColor: "transparent",
    position: "absolute",
    maxWidth: 200,
    top: 205,
    right: 175,
    padding: 20,
    elevation: 8,
    zIndex: 10,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  summarySubtitle: {
    fontSize: 14,
    opacity: 4,
    left: 5,
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginHorizontal: 10,
  },
  scrollView: {
    flex: 1,
    marginTop: 0,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    paddingLeft: 4,
  },
  subscriptionCardContainer: {
    marginBottom: 16,
  },
  subscriptionCard: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#21C7B9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accountLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardBody: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  datesContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dateColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  currentBillingContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  billingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  billingTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  billingStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  billingStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  billingStatus: {
    fontSize: 11,
    fontWeight: "700",
  },
  billingDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  billingAmountContainer: {
    flex: 1,
  },
  billingDateContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  billingLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  billingAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  billingDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  paymentButtonsContainer: {
    gap: 8,
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  statusMessageContainer: {
    marginTop: 12,
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  statusMessageText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  footerButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
    marginTop: 10,
  },
  noDataIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  refreshButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  footerRights: {
    fontSize: 11,
    marginBottom: 4,
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
    padding: 40,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  subscriptionCardEnded: {
    opacity: 0.9,
  },
  accountIconEnded: {
    backgroundColor: "#718096",
  },
  infoIconEnded: {
    backgroundColor: "rgba(113, 128, 150, 0.1)",
  },
  billingContainerEnded: {
    backgroundColor: "rgba(113, 128, 150, 0.05)",
    borderColor: "rgba(113, 128, 150, 0.2)",
  },
});

export default MySubscriptionsScreen;
