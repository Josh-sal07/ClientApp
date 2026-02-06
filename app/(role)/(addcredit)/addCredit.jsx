import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  StatusBar,
  Dimensions,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import WebView from "react-native-webview";
import { useTheme } from "../../../theme/ThemeContext";

const { width } = Dimensions.get("window");

export default function CashInPage() {
  const router = useRouter();
  const { mode } = useTheme();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(""); // 'pending', 'success', 'failed'

  const systemColorScheme = useColorScheme();
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  // Define colors based on theme (matching your profile page)
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
      inputBackground: "#FFFFFF",
      cardBackground: "#FFFFFF",
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
      inputBackground: "#2D2D2D",
      cardBackground: "#1E1E1E",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  // Check for token on mount
  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    } catch (error) {
    }
  };

  // Predefined amount options
  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

  const handleCashIn = async () => {
    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const storedToken = await AsyncStorage.getItem("token");

      if (!storedToken) {
        Alert.alert("Login Required", "Please login again");
        setLoading(false);
        return;
      }

      const cashInAmount = parseFloat(amount);

      // Use GET method as specified
      const endpoint = `https://staging.kazibufastnet.com/api/app/add_credits?amount=${cashInAmount}`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          Accept: "application/json",
        },
      });

      // Get the response text first
      const responseText = await response.text();

      if (!response.ok) {
        Alert.alert("Error", `Failed to initiate payment: ${response.status}`);
        return;
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        Alert.alert("Error", "Invalid response from server");
        return;
      }
      // Check for different possible response formats
      if (result.payment_url) {
        setPaymentUrl(result.payment_url);
        setShowWebView(true);
        setPaymentStatus("pending");
      } else if (result.url) {
        setPaymentUrl(result.url);
        setShowWebView(true);
        setPaymentStatus("pending");
      } else if (result.redirect_url) {
        setPaymentUrl(result.redirect_url);
        setShowWebView(true);
        setPaymentStatus("pending");
      } else if (result.checkout_url) {
        setPaymentUrl(result.checkout_url);
        setShowWebView(true);
        setPaymentStatus("pending");
      } else if (result.success && result.data?.payment_url) {
        setPaymentUrl(result.data.payment_url);
        setShowWebView(true);
        setPaymentStatus("pending");
      } else {

        // Check if it's a success message but no URL (maybe direct credit add)
        if (result.success && result.message) {
          Alert.alert("Success!", result.message, [
            {
              text: "OK",
              onPress: () => {
                setAmount("");
                router.back();
              },
            },
          ]);
        } else {
          Alert.alert(
            "Payment Failed",
            result.message ||
              "Could not initiate payment. Please check the response format.",
            [{ text: "OK" }],
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Network Error",
        "Unable to connect to payment server. Please check your internet connection.",
        [{ text: "OK" }],
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle WebView navigation state changes
  const handleWebViewNavigationStateChange = (newNavState) => {
    const { url } = newNavState;

    // Check for payment success/failure URLs
    if (url.includes("success") || url.includes("completed")) {
      // Payment completed successfully
      setPaymentStatus("success");
      setTimeout(() => {
        handlePaymentComplete(true);
      }, 2000);
    } else if (
      url.includes("failed") ||
      url.includes("cancel") ||
      url.includes("error")
    ) {
      // Payment failed or cancelled
      setPaymentStatus("failed");
      setTimeout(() => {
        handlePaymentComplete(false);
      }, 2000);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = (success) => {
    setShowWebView(false);

    if (success) {
      Alert.alert(
        "Payment Successful!",
        `₱${parseFloat(amount).toLocaleString()} has been added to your account.`,
        [
          {
            text: "OK",
            onPress: () => {
              setAmount("");
              router.back();
            },
          },
        ],
      );
    } else {
      Alert.alert(
        "Payment Failed",
        "The payment was not completed. Please try again.",
        [{ text: "OK" }],
      );
    }

    setPaymentStatus("");
    setPaymentUrl("");
  };

  // Close WebView manually
  const handleCloseWebView = () => {
    Alert.alert(
      "Cancel Payment?",
      "Are you sure you want to cancel the payment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            setShowWebView(false);
            setPaymentUrl("");
            setPaymentStatus("");
          },
        },
      ],
    );
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  const formatAmount = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + "." + parts[1].substring(0, 2);
    }
    return numericValue;
  };

  // Show loading if checking token
  if (token === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={[styles.authRequiredContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="wallet-outline" size={64} color={colors.primary} style={styles.authIcon} />
        <Text style={[styles.authRequiredText, { color: colors.text }]}>
          Please login to use cash-in
        </Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(auth)/(login)/login")}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={effectiveMode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header matching profile design */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          },
        ]}
      >
        <View style={styles.headerContent}>
          {/* Back button on left */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </TouchableOpacity>

          {/* Center title */}
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.white }]}>
              Cash-In Credit
            </Text>
          </View>

          {/* Empty view to balance the header */}
          <View style={styles.headerRight} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle */}
          <View style={styles.subtitleContainer}>
            <Ionicons name="wallet-outline" size={24} color={colors.textLight} />
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              Add funds to your account
            </Text>
          </View>

          {/* Amount Input Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.success + "90",
                shadowColor: effectiveMode === "dark" ? "transparent" : "#000",
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Enter Amount
            </Text>

            <View style={[styles.amountContainer, { borderBottomColor: colors.primary }]}>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>₱</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amount}
                onChangeText={(text) => setAmount(formatAmount(text))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textLight}
                maxLength={15}
                editable={!loading && !showWebView}
              />
            </View>

            <Text style={[styles.quickAmountLabel, { color: colors.textLight }]}>
              Quick Select:
            </Text>
            <View style={styles.quickAmountContainer}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    { backgroundColor: colors.lightGray },
                    amount === quickAmount.toString() && [
                      styles.quickAmountButtonActive,
                      { backgroundColor: colors.primary },
                    ],
                  ]}
                  onPress={() => handleQuickAmount(quickAmount)}
                  disabled={loading || showWebView}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      { color: colors.text },
                      amount === quickAmount.toString() && [
                        styles.quickAmountTextActive,
                        { color: colors.white },
                      ],
                    ]}
                  >
                    ₱{quickAmount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Summary Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: effectiveMode === "dark" ? "transparent" : "#000",
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Summary
            </Text>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textLight }]}>
                Amount to Add:
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                ₱
                {amount
                  ? parseFloat(amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "0.00"}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total:
              </Text>
              <Text style={[styles.totalValue, { color: colors.success }]}>
                ₱
                {amount
                  ? parseFloat(amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "0.00"}
              </Text>
            </View>
          </View>

          {/* Proceed Button */}
          <TouchableOpacity
            style={[
              styles.cashInButton,
              { backgroundColor: colors.success },
              (!amount || parseFloat(amount) <= 0 || loading || showWebView) && [
                styles.cashInButtonDisabled,
                { backgroundColor: colors.gray },
              ],
            ]}
            onPress={handleCashIn}
            disabled={
              !amount || parseFloat(amount) <= 0 || loading || showWebView
            }
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : showWebView ? (
              <Text style={[styles.cashInButtonText, { color: colors.white }]}>
                Processing Payment...
              </Text>
            ) : (
              <Text style={[styles.cashInButtonText, { color: colors.white }]}>
                Proceed to Pay ₱
                {amount ? parseFloat(amount).toLocaleString() : "0"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textLight} />
            <Text style={[styles.infoText, { color: colors.textLight }]}>
              You will be redirected to a secure payment page to complete the transaction.
            </Text>
          </View>

          {/* Payment Methods Info */}
          <View style={[styles.paymentMethodsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.paymentMethodsTitle, { color: colors.text }]}>
              Supported Payment Methods
            </Text>
            <View style={styles.paymentMethodsRow}>
              <Ionicons name="card-outline" size={20} color={colors.textLight} />
              <Text style={[styles.paymentMethodText, { color: colors.textLight }]}>Credit/Debit Cards</Text>
            </View>
            <View style={styles.paymentMethodsRow}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.textLight} />
              <Text style={[styles.paymentMethodText, { color: colors.textLight }]}>Mobile E-Wallets</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={handleCloseWebView}
        statusBarTranslucent
      >
        <View style={[styles.webViewContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.webViewHeader, { backgroundColor: colors.primary }]}>
            <TouchableOpacity
              onPress={handleCloseWebView}
              style={[styles.closeButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={[styles.webViewTitle, { color: colors.white }]}>
              Secure Payment
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {paymentStatus === "pending" && (
            <View style={[styles.paymentStatus, { backgroundColor: colors.primary + '15' }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.paymentStatusText, { color: colors.primary }]}>
                Processing payment...
              </Text>
            </View>
          )}

          {paymentUrl ? (
            <WebView
              source={{ uri: paymentUrl }}
              style={styles.webView}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={[styles.webViewLoading, { backgroundColor: colors.background }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.webViewLoadingText, { color: colors.text }]}>
                    Loading payment page...
                  </Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                Alert.alert("Error", "Failed to load payment page");
              }}
            />
          ) : (
            <View style={[styles.noUrlContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
              <Text style={[styles.noUrlText, { color: colors.text }]}>
                No payment URL available
              </Text>
            </View>
          )}

          <View style={[styles.webViewFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
            <Text style={[styles.webViewFooterText, { color: colors.textLight }]}>
              Do not close this window until payment is complete
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 10 : 0,
    paddingTop: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 44, // Balance the back button width
  },
  keyboardView: {
    flex: 1,
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
  authRequiredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  authIcon: {
    marginBottom: 20,
  },
  authRequiredText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  loginButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    paddingTop: 10,
  },
  subtitle: {
    fontSize: 16,
    marginLeft: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    marginBottom: 20,
    paddingBottom: 10,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "bold",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "bold",
    paddingVertical: 5,
  },
  quickAmountLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  quickAmountContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickAmountButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "500",
  },
  quickAmountTextActive: {
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cashInButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cashInButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  cashInButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    flex: 1,
  },
  paymentMethodsCard: {
    alignItems:'center',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  paymentMethodsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  paymentMethodsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 13,
    marginLeft: 10,
  },
  // WebView Styles
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  paymentStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  paymentStatusText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  webViewLoadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  noUrlContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noUrlText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  webViewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderTopWidth: 1,
  },
  webViewFooterText: {
    marginLeft: 8,
    fontSize: 12,
    textAlign: "center",
  },
});