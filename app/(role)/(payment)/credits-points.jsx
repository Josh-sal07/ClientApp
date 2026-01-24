import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { useColorScheme } from "react-native";

const { width, height } = Dimensions.get("window");

const CreditsPointsPayment = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();

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
      facebook: "#1877F2",
      surface: "#FFFFFF",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
      inputBg: "#FFFFFF",
      discount: "#10B981",
      penalty: "#EF4444",
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
      facebook: "#1877F2",
      surface: "#1E1E1E",
      background: "#121212",
      text: "#FFFFFF",
      textLight: "#B0B0B0",
      inputBg: "#2D2D2D",
      discount: "#10B981",
      penalty: "#EF4444",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  const [amount, setAmount] = useState("");
  const [availableCredits, setAvailableCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const billingId = params.billingId;
  const subscriptionId = params.subscriptionId;

  useEffect(() => {
    fetchAvailableCredits();
    fetchSubscriptionDetails();
  }, []);

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return token;
    } catch (err) {
      console.error("Error getting token:", err);
      return null;
    }
  };

  // Fetch subscription details and find the specific bill
  const fetchSubscriptionDetails = async () => {
    try {
      setLoadingDetails(true);
      const token = await getToken();
      if (!token) throw new Error("No token found");

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/billings/view/${billingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();
      console.log("Subscriptions Response:", data);

      if (response.ok) {
        let foundBill = null;
        let foundSubscription = null;

        // Process subscriptions data
        let subscriptions = [];
        if (Array.isArray(data)) {
          subscriptions = data;
        } else if (data.subscription) {
          subscriptions = Array.isArray(data.subscription)
            ? data.subscription
            : [data.subscription];
        } else if (data.data && Array.isArray(data.data)) {
          subscriptions = data.data;
        }

        // Find the bill with matching billingId
        for (const subscription of subscriptions) {
          if (subscription.billing && Array.isArray(subscription.billing)) {
            const bill = subscription.billing.find(
              (b) => b.id == billingId || b.billing_id == billingId,
            );
            if (bill) {
              foundBill = bill;
              foundSubscription = subscription;
              break;
            }
          }
        }

        if (foundBill && foundSubscription) {
          setSelectedBill(foundBill);
          setSubscriptionDetails(foundSubscription);
          console.log("Found bill:", foundBill);
          console.log("Found subscription:", foundSubscription);
        } else {
          console.log(
            "Bill not found. Available subscriptions:",
            subscriptions,
          );
          Alert.alert("Error", "Bill not found in your subscriptions");
        }
      } else {
        throw new Error(data.message || "Failed to load subscriptions");
      }
    } catch (error) {
      console.error("Error fetching subscription details:", error);
      Alert.alert("Error", "Failed to load billing details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch user's available credits
  const fetchAvailableCredits = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("No token found");

      // Try different possible endpoints for credits
      const endpoints = [
        `https://staging.kazibufastnet.com/api/app/user/credits`,
        `https://staging.kazibufastnet.com/api/app/user/balance`,
        `https://staging.kazibufastnet.com/api/app/credits`,
      ];

      let credits = 0;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Credits response from", endpoint, ":", data);

            // Try different response structures
            if (
              data.success &&
              data.data &&
              data.data.credits_balance !== undefined
            ) {
              credits = data.data.credits_balance;
              break;
            } else if (data.credits !== undefined) {
              credits = data.credits;
              break;
            } else if (data.balance !== undefined) {
              credits = data.balance;
              break;
            } else if (data.data && data.data.balance !== undefined) {
              credits = data.data.balance;
              break;
            }
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError);
        }
      }

      setAvailableCredits(credits);
    } catch (error) {
      console.error("Error fetching credits:", error);
      setAvailableCredits(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-PH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === "")
      return "₱0.00";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "₱0.00";
    return `₱${numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

 const getMaxPaymentAmount = () => {
  if (!selectedBill) {
    return 0;
  }
  
  // Calculate total bill amount
  const totalDue = calculateTotalAmountDue();
  
  // Ensure availableCredits is a valid number
  const available = parseFloat(availableCredits) || 0;
  
  // Return the minimum between bill total and available credits
  return Math.min(totalDue, available);
};

const calculateTotalAmountDue = () => {
  if (!selectedBill) return 0;
  
  // Try to get from amount_due first
  if (selectedBill.amount_due !== undefined && selectedBill.amount_due !== null) {
    return parseFloat(selectedBill.amount_due) || 0;
  }
  
  // Calculate from components
  const previousBalance = parseFloat(selectedBill.previous_balance || 0);
  const currentCharges = parseFloat(selectedBill.current_charges || selectedBill.amount || 0);
  const penalty = parseFloat(selectedBill.penalty || 0);
  const discount = parseFloat(selectedBill.discount || 0);
  
  // Total = Previous Balance + Current Charges + Penalty - Discount
  const calculatedTotal = previousBalance + currentCharges + penalty - discount;
  
  // Ensure non-negative
  return Math.max(calculatedTotal, 0);
};

  const handleAmountChange = (text) => {
    // Allow only numbers and decimal point
    const cleanedText = text.replace(/[^0-9.]/g, "");

    // If empty, set empty string
    if (cleanedText === "") {
      setAmount("");
      setPaymentError("");
      return;
    }

    // Ensure only one decimal point
    const parts = cleanedText.split(".");
    if (parts.length > 2) {
      return;
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      // Truncate to 2 decimal places
      const truncatedText = parts[0] + "." + parts[1].substring(0, 2);
      setAmount(truncatedText);
      validateAmount(truncatedText);
      return;
    }

    // Set the amount first
    setAmount(cleanedText);

    // Then validate it
    validateAmount(cleanedText);
  };

  // Separate validation function
  const validateAmount = (amountText) => {
    if (!amountText || amountText === "" || amountText === ".") {
      setPaymentError("");
      return;
    }

    const enteredAmount = parseFloat(amountText);
    if (isNaN(enteredAmount)) {
      setPaymentError("Please enter a valid number");
      return;
    }

    const maxAmount = getMaxPaymentAmount();

    if (enteredAmount > maxAmount) {
      setPaymentError(`Maximum payment amount is ${formatCurrency(maxAmount)}`);
    } else if (enteredAmount <= 0) {
      setPaymentError("Please enter an amount greater than 0");
    } else {
      setPaymentError("");
    }
  };

  const handleUseFullAmount = () => {
    const maxAmount = getMaxPaymentAmount();
    if (maxAmount > 0) {
      setAmount(maxAmount.toFixed(2));
      setPaymentError("");
    } else {
      setPaymentError("No amount available to pay");
    }
  };

  const handlePayWithCredits = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setPaymentError("Please enter a valid amount");
      return;
    }

    const paymentAmount = parseFloat(amount);
    const maxAmount = getMaxPaymentAmount();

    if (paymentAmount > maxAmount) {
      setPaymentError(
        `Payment amount cannot exceed ${formatCurrency(maxAmount)}`,
      );
      return;
    }

    Alert.alert(
      "Confirm Payment",
      `Pay ${formatCurrency(paymentAmount)} using your credits points?\n\nYou will have ${formatCurrency(availableCredits - paymentAmount)} credits remaining.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Payment",
          onPress: () => processPayment(paymentAmount),
          style: "default",
        },
      ],
    );
  };

  const processPayment = async (paymentAmount) => {
    try {
      setProcessing(true);
      const token = await getToken();
      if (!token) throw new Error("No token found");

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/billings/pay-with-credits`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            billing_id: billingId,
            amount: paymentAmount,
            payment_method: "credits_points",
          }),
        },
      );

      const responseText = await response.text();
      console.log("Payment response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Invalid server response");
      }

      if (response.ok && result.success) {
        Alert.alert(
          "Payment Successful",
          `Payment of ${formatCurrency(paymentAmount)} has been processed successfully.`,
          [
            {
              text: "OK",
              onPress: () => {
                router.replace({
                  pathname: "/(role)/(subscription)",
                });
              },
            },
          ],
        );
      } else {
        throw new Error(result.message || "Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Payment Error",
        error.message || "Failed to process payment. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const renderInputSection = () => {
    const maxAmount = getMaxPaymentAmount();
    const billAmount = selectedBill?.amount_due || calculateTotalAmountDue();

    return (
      <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Enter Amount to Pay
        </Text>

        <View
          style={[
            styles.amountInputContainer,
            {
              backgroundColor: colors.inputBg,
              borderColor: paymentError ? colors.danger : colors.border,
            },
          ]}
        >
          <Text style={[styles.currencySymbol, { color: colors.text }]}>₱</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0.00"
            placeholderTextColor={colors.textLight}
            keyboardType="decimal-pad"
            autoFocus
            maxLength={15}
          />
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: colors.lightGray }]}
            onPress={() => setAmount("")}
          >
            <Ionicons name="close-circle" size={20} color={colors.gray} />
          </TouchableOpacity>
        </View>

        {paymentError ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {paymentError}
          </Text>
        ) : (
          <View>
            <Text style={[styles.inputHelper, { color: colors.textLight }]}>
              Bill Amount: {formatCurrency(billAmount)}
            </Text>
            <Text style={[styles.inputHelper, { color: colors.textLight }]}>
              Maximum You Can Pay: {formatCurrency(maxAmount)}
            </Text>
            <Text style={[styles.inputHelper, { color: colors.textLight }]}>
              Available Credits: {formatCurrency(availableCredits)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.fullAmountButton,
            {
              backgroundColor: colors.primary + "15",
              borderColor: colors.primary + "30",
            },
          ]}
          onPress={handleUseFullAmount}
          disabled={maxAmount <= 0}
        >
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          <Text style={[styles.fullAmountText, { color: colors.primary }]}>
            Use maximum amount ({formatCurrency(maxAmount)})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBillSummary = () => {
    if (loadingDetails) {
      return (
        <View style={[styles.billSection, { backgroundColor: colors.surface }]}>
          <View style={styles.loadingBillContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingBillText, { color: colors.textLight }]}>
              Loading bill details...
            </Text>
          </View>
        </View>
      );
    }

    if (!selectedBill) {
      return (
        <View style={[styles.billSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Bill Summary
          </Text>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            No bill details available
          </Text>
        </View>
      );
    }

    // Calculate bill breakdown
    const previousBalance = parseFloat(selectedBill.previous_balance ?? 0);
    const currentCharges = parseFloat(
      selectedBill.current_charges || selectedBill.amount || 0,
    );
    const penalty = parseFloat(selectedBill.penalty || 0);
    const discount = parseFloat(selectedBill.discount || 0);
    const totalDue = calculateTotalAmountDue();
    const amountDue = selectedBill.amount_due || totalDue;

    return (
      <View style={[styles.billSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Bill Breakdown
        </Text>

        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Account:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {subscriptionDetails?.subscription_id || "N/A"}
          </Text>
        </View>

        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Due Date:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {formatDate(selectedBill.due_date)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Previous Balance */}
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Previous Balance:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {formatCurrency(previousBalance)}
          </Text>
        </View>

        {/* Current Charges */}
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Current Charges:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {formatCurrency(currentCharges)}
          </Text>
        </View>

        {/* Subtotal */}
        <View style={styles.billRow}>
          <Text
            style={[
              styles.billLabel,
              { color: colors.textLight, fontWeight: "600" },
            ]}
          >
            Subtotal:
          </Text>
          <Text
            style={[
              styles.billValue,
              { color: colors.text, fontWeight: "600" },
            ]}
          >
            {formatCurrency(previousBalance + currentCharges)}
          </Text>
        </View>

        {/* Penalty - if any */}
        {penalty > 0 && (
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.penalty }]}>
              Penalty:
            </Text>
            <Text
              style={[
                styles.billValue,
                { color: colors.penalty, fontWeight: "600" },
              ]}
            >
              + {formatCurrency(penalty)}
            </Text>
          </View>
        )}

        {/* Discount - if any */}
        {discount > 0 && (
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.discount }]}>
              Discount:
            </Text>
            <Text
              style={[
                styles.billValue,
                { color: colors.discount, fontWeight: "600" },
              ]}
            >
              - {formatCurrency(discount)}
            </Text>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Total Amount Due */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>
            TOTAL AMOUNT DUE:
          </Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatCurrency(amountDue)}
          </Text>
        </View>

        {/* Payment Status */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                selectedBill.status === "paid"
                  ? colors.success + "20"
                  : colors.danger + "20",
              alignSelf: "flex-start",
              marginTop: 12,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  selectedBill.status === "paid"
                    ? colors.success
                    : colors.danger,
              },
            ]}
          >
            {selectedBill.status ? selectedBill.status.toUpperCase() : "UNPAID"}
          </Text>
        </View>
      </View>
    );
  };

  const renderCreditsBalance = () => (
    <View style={[styles.balanceSection, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Your Credits Points
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <Text style={[styles.balanceAmount, { color: colors.primary }]}>
            {formatCurrency(availableCredits)}
          </Text>

          <View
            style={[
              styles.balanceInfo,
              { backgroundColor: colors.primary + "08" },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.balanceInfoText, { color: colors.textLight }]}>
              {selectedBill &&
              availableCredits >=
                (selectedBill.amount_due || calculateTotalAmountDue())
                ? "✓ You have enough credits to pay this bill"
                : selectedBill
                  ? `You need ${formatCurrency((selectedBill.amount_due || calculateTotalAmountDue()) - availableCredits)} more credits to pay in full`
                  : "Loading bill amount..."}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const calculateRemainingBalance = () => {
    const paymentAmount = parseFloat(amount) || 0;
    const billAmount = selectedBill?.amount_due || calculateTotalAmountDue();
    return billAmount - paymentAmount;
  };

  const calculateRemainingCredits = () => {
    const paymentAmount = parseFloat(amount) || 0;
    return availableCredits - paymentAmount;
  };

  if (loading && loadingDetails) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.fullLoadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.fullLoadingText, { color: colors.textLight }]}>
            Loading payment details...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pay with Credits Points</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {renderCreditsBalance()}
            {renderBillSummary()}
            {renderInputSection()}

            {/* Payment Summary - Only show if amount entered */}
            {amount && parseFloat(amount) > 0 && (
              <View
                style={[
                  styles.summarySection,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Payment Summary
                </Text>

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: colors.textLight }]}
                  >
                    Bill Total:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formatCurrency(
                      selectedBill?.amount_due || calculateTotalAmountDue(),
                    )}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: colors.textLight }]}
                  >
                    Payment Amount:
                  </Text>
                  <Text
                    style={[styles.summaryValue, { color: colors.primary }]}
                  >
                    {formatCurrency(parseFloat(amount) || 0)}
                  </Text>
                </View>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>
                    Remaining Balance After Payment:
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        color:
                          calculateRemainingBalance() > 0
                            ? colors.danger
                            : colors.success,
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {formatCurrency(calculateRemainingBalance())}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>
                    Credits After Payment:
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        color:
                          calculateRemainingCredits() >= 0
                            ? colors.primary
                            : colors.danger,
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {formatCurrency(calculateRemainingCredits())}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer with Pay Button */}
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.payButton,
              {
                backgroundColor:
                  !amount || parseFloat(amount) <= 0 || processing
                    ? colors.gray
                    : colors.primary,
              },
            ]}
            onPress={handlePayWithCredits}
            disabled={!amount || parseFloat(amount) <= 0 || processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons
                  name="wallet-outline"
                  size={20}
                  color={colors.white}
                />
                <Text style={styles.payButtonText}>
                  {amount
                    ? `Pay ${formatCurrency(parseFloat(amount))}`
                    : "Enter Amount"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  fullLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullLoadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  loadingBillContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingBillText: {
    fontSize: 14,
    marginLeft: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  headerPlaceholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  balanceSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  billSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  inputSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summarySection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 8,
  },
  balanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
  },
  balanceInfoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    textAlign: "center",
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  billLabel: {
    fontSize: 14,
  },
  billValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    height: "100%",
  },
  clearButton: {
    padding: 4,
    borderRadius: 12,
  },
  inputHelper: {
    fontSize: 12,
    marginBottom: 4,
    color: "#64748B",
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
    color: "#EF4444",
    fontWeight: "500",
  },
  fullAmountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  fullAmountText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 12,
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default CreditsPointsPayment;
