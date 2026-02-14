import React, { useState, useEffect } from "react";
import { useUserStore } from "../../../store/user";
import { Asset } from "expo-asset";
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
  Dimensions,
  Modal,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { useColorScheme } from "react-native";
import * as Print from "expo-print";
import { FileSystem } from "expo-file-system";
import * as Sharing from "expo-sharing";

const { width, height } = Dimensions.get("window");

const CreditsPointsPayment = () => {
  const user = useUserStore((state) => state.user);
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
      surface: "#FFFFFF",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
      inputBg: "#FFFFFF",
      discount: "#10B981",
      penalty: "#EF4444",
      receiptBg: "#FFFFFF",
      receiptBorder: "#E2E8F0",
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
      inputBg: "#2D2D2D",
      discount: "#10B981",
      penalty: "#EF4444",
      receiptBg: "#1E1E1E",
      receiptBorder: "#333333",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  const [amount, setAmount] = useState("");
  const [availableCredits, setAvailableCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState(false);

  // Get parameters from navigation
  const billingId = params.billingId;
  const billDetailsParam = params.billDetails;

  useEffect(() => {
    console.log("Component mounted with params:", {
      billingId,
      hasBillDetails: !!billDetailsParam,
      userExists: !!user,
      userCreditPoints: user?.credit_points,
      branchExists: !!user?.branch,
      subdomain: user?.branch?.subdomain,
      domain: user?.branch?.domain,
    });

    // First, try to use bill details from params immediately
    if (billDetailsParam) {
      try {
        const parsedBill = JSON.parse(billDetailsParam);
        console.log("Successfully parsed bill from params");
        setSelectedBill(parsedBill);

        // Get credits from user store if available
        if (user?.credit_points !== undefined) {
          console.log("Using credits from user store:", user.credit_points);
          setAvailableCredits(parseFloat(user.credit_points) || 0);
        } else {
          console.log("No credits found in user store, fetching from API");
          fetchCredits();
        }

        setLoading(false);
      } catch (error) {
        console.error("Error parsing bill details from params:", error);
        // If parsing fails, try to fetch from API
        fetchAllData();
      }
    } else {
      fetchAllData();
    }
  }, []);

  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return token;
    } catch (err) {
      return null;
    }
  };

  // Get the subdomain from user branch
  const getSubdomain = () => {
    if (!user || !user.branch) {
      console.log("User or branch is null");
      return "staging"; // Fallback to staging
    }

    // Try different possible field names
    const subdomain = user.branch.subdomain || user.branch.domain || "staging";
    console.log("Using subdomain:", subdomain);
    return subdomain;
  };

  // Fetch credits from user store or API
  const fetchCredits = async () => {
    try {
      const token = await getToken();

      if (!token) {
        console.log("No token found");
        return;
      }

      const subdomain = getSubdomain();
      const url = `https://${subdomain}.kazibufastnet.com/api/app/credit_points`;

      console.log("Fetching credits from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Credits response:", data);

        let credits = 0;
        if (data.credit_points !== undefined) {
          credits = parseFloat(data.credit_points) || 0;
        } else if (data.credits_balance !== undefined) {
          credits = parseFloat(data.credits_balance) || 0;
        } else if (data.credits !== undefined) {
          credits = parseFloat(data.credits) || 0;
        } else if (data.balance !== undefined) {
          credits = parseFloat(data.balance) || 0;
        } else if (data.data?.credit_points !== undefined) {
          credits = parseFloat(data.data.credit_points) || 0;
        }

        console.log("Setting available credits:", credits);
        setAvailableCredits(credits);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  // Fetch all data
const fetchAllData = async () => {
  console.log("Starting to fetch all data...");

  try {
    const token = await getToken();

    if (!token) {
      console.log("No token found");
      setLoading(false);
      Alert.alert("Error", "Please log in to continue.");
      return;
    }

    const subdomain = getSubdomain();
    if (!subdomain) {
      console.log("No subdomain found, using staging");
      setLoading(false);
      Alert.alert("Error", "Unable to determine server location.");
      return;
    }

    if (!billingId) {
      console.log("No billing ID provided");
      setLoading(false);
      Alert.alert("Error", "Billing ID is required.");
      return;
    }

    const url = `https://${subdomain}.kazibufastnet.com/api/app/billings/pay-with-credits/${billingId}`;
    console.log("Fetching bill details from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error response:", errorText);
      throw new Error(
        `HTTP ${response.status}: Failed to fetch bill details`,
      );
    }

    const responseText = await response.text();
    console.log("Response received");

    const data = JSON.parse(responseText);
    console.log("Parsed response data:", data);

    // Extract bill data from response
    let billData = null;

    if (data.billing) {
      billData = data.billing;
    } else if (data.data) {
      billData = data.data;
    } else if (data) {
      billData = data;
    }

    // EXTRACT ADDRESS AND CONTACT FROM THE RESPONSE STRUCTURE
    let address = "Address not available";
    let contactNumber = "Contact not available";
    
    // Address is in data.address.value
    if (data.address && data.address.value) {
      address = data.address.value;
      console.log("Found address in data.address.value:", address);
    }
    
    // Contact number is in data.contactNumber.value
    if (data.contactNumber && data.contactNumber.value) {
      contactNumber = data.contactNumber.value;
      console.log("Found contact in data.contactNumber.value:", contactNumber);
    }
    
    // Fallback: check if address/contact are directly in data
    if (data.address && typeof data.address === 'string') {
      address = data.address;
    }
    if (data.contactNumber && typeof data.contactNumber === 'string') {
      contactNumber = data.contactNumber;
    }
    
    // Fallback: user's address if available
    if (address === "Address not available" && data.user?.address) {
      address = data.user.address;
    }
    if (contactNumber === "Contact not available" && data.user?.mobile_number) {
      contactNumber = data.user.mobile_number;
    }

    // Add the address and contact to billData
    if (billData) {
      billData.address = address;
      billData.contactNumber = contactNumber;
      console.log("Added address/contact to billData:", {
        address: billData.address,
        contactNumber: billData.contactNumber
      });
    } else {
      // Create billData if none exists
      billData = {
        address: address,
        contactNumber: contactNumber
      };
    }

    // Extract available credits from response
    let credits = 0;
    if (data.credit_points !== undefined) {
      credits = parseFloat(data.credit_points) || 0;
    } else if (data.credits_balance !== undefined) {
      credits = parseFloat(data.credits_balance) || 0;
    } else if (data.credits !== undefined) {
      credits = parseFloat(data.credits) || 0;
    } else if (data.balance !== undefined) {
      credits = parseFloat(data.balance) || 0;
    } else if (data.data?.credit_points !== undefined) {
      credits = parseFloat(data.data.credit_points) || 0;
    } else if (user?.credit_points !== undefined) {
      credits = parseFloat(user.credit_points) || 0;
    }

    console.log("Setting bill data and credits:", {
      address: billData.address,
      contactNumber: billData.contactNumber,
      credits: credits
    });
    
    setSelectedBill(billData);
    setAvailableCredits(credits);
    
  } catch (error) {
    console.error("Error in fetchAllData:", error);

    // If we have billDetailsParam as fallback, use it
    if (billDetailsParam) {
      try {
        const parsedBill = JSON.parse(billDetailsParam);
        console.log("Using fallback bill data from params");
        
        // Check if address/contact are in the parsed bill
        if (!parsedBill.address && parsedBill.addressObject?.value) {
          parsedBill.address = parsedBill.addressObject.value;
        }
        if (!parsedBill.contactNumber && parsedBill.contactNumberObject?.value) {
          parsedBill.contactNumber = parsedBill.contactNumberObject.value;
        }
        
        setSelectedBill(parsedBill);

        // Try to get credits from user store
        if (user?.credit_points !== undefined) {
          setAvailableCredits(parseFloat(user.credit_points) || 0);
        }
      } catch (parseError) {
        console.error("Could not parse fallback bill details:", parseError);
      }
    }

    Alert.alert(
      "Warning",
      "Could not fetch latest bill details. Using cached data.",
    );
  } finally {
    console.log("Setting loading to false");
    setLoading(false);
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
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

  const getMinPaymentAmount = () => {
    if (!selectedBill) return 0;

    const totalDue = calculateTotalAmountDue();
    const penalty = parseFloat(selectedBill.penalty || 0);
    const discount = parseFloat(selectedBill.discount || 0);

    return parseFloat((totalDue + penalty - discount).toFixed(2));
  };

  const getMaxPaymentAmount = () => {
    if (!selectedBill) {
      return 0;
    }

    const totalDue = calculateTotalAmountDue();
    const penalty = parseFloat(selectedBill.penalty || 0);
    const discount = parseFloat(selectedBill.discount || 0);
    const available = parseFloat(availableCredits) || 0;

    const maxBillAmount = parseFloat(
      (totalDue + penalty - discount).toFixed(2),
    );
    const maxByCredits = available;

    return Math.min(maxBillAmount, maxByCredits);
  };

  const calculateTotalAmountDue = () => {
    if (!selectedBill) return 0;

    if (
      selectedBill.amount_due !== undefined &&
      selectedBill.amount_due !== null
    ) {
      return parseFloat(selectedBill.amount_due) || 0;
    }

    const previousBalance = parseFloat(
      selectedBill.previous_balance || selectedBill.prev_balance || 0,
    );
    const currentCharges = parseFloat(
      selectedBill.current_charges ||
        selectedBill.amount ||
        selectedBill.original_amount ||
        0,
    );
    const penalty = parseFloat(selectedBill.penalty || 0);
    const discount = parseFloat(selectedBill.discount || 0);

    const calculatedTotal =
      previousBalance + currentCharges + penalty - discount;

    return Math.max(calculatedTotal, 0);
  };

  const handleAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, "");

    if (cleanedText === "") {
      setAmount("");
      setPaymentError("");
      return;
    }

    const parts = cleanedText.split(".");
    if (parts.length > 2) {
      return;
    }

    if (parts[1] && parts[1].length > 2) {
      const truncatedText = parts[0] + "." + parts[1].substring(0, 2);
      setAmount(truncatedText);
      validateAmount(truncatedText);
      return;
    }

    setAmount(cleanedText);
    validateAmount(cleanedText);
  };

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
  };

  const handleUseFullAmount = () => {
    const maxAmount = Number(getMaxPaymentAmount() || 0);

    if (maxAmount > 0) {
      setAmount(maxAmount.toFixed(2));
      setPaymentError("");
    } else {
      setPaymentError("No amount available to pay");
    }
  };

  // Generate receipt data
// Generate receipt data
const generateReceiptData = async (paymentResult, paymentAmount) => {
  const now = new Date();

  const receiptNumber = `RCP-${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${Math.floor(
    Math.random() * 10000
  )
    .toString()
    .padStart(4, "0")}`;

  const base64Logo = await getBase64Logo();

  // Get address and contact
  let address = "Address not available";
  let contactNumber = "Contact not available";
  
  console.log("generateReceiptData - Checking data sources...");
  
  // Priority 1: Check selectedBill (which now has address/contact from fetchAllData)
  if (selectedBill?.address && selectedBill.address !== "Address not available") {
    address = selectedBill.address;
    console.log("Found address in selectedBill.address:", address);
  }
  
  if (selectedBill?.contactNumber && selectedBill.contactNumber !== "Contact not available") {
    contactNumber = selectedBill.contactNumber;
    console.log("Found contact in selectedBill.contactNumber:", contactNumber);
  }
  
  // Priority 2: Check paymentResult (API response after payment)
  if (paymentResult) {
    if (paymentResult.address?.value && address === "Address not available") {
      address = paymentResult.address.value;
    } else if (paymentResult.address && typeof paymentResult.address === 'string' && address === "Address not available") {
      address = paymentResult.address;
    }
    
    if (paymentResult.contactNumber?.value && contactNumber === "Contact not available") {
      contactNumber = paymentResult.contactNumber.value;
    } else if (paymentResult.contactNumber && typeof paymentResult.contactNumber === 'string' && contactNumber === "Contact not available") {
      contactNumber = paymentResult.contactNumber;
    }
  }
  
  // Priority 3: User data as fallback
  if (address === "Address not available" && user?.address) {
    address = user.address;
  }
  if (contactNumber === "Contact not available" && user?.mobile_number) {
    contactNumber = user.mobile_number;
  }
  
  // Hardcoded fallback
  if (address === "Address not available") {
    address = "Purok 6 Brgy. Guiwanon, Tubigon";
  }
  if (contactNumber === "Contact not available") {
    contactNumber = "09505358971";
  }

  console.log("Receipt generation - Final values:", {
    address,
    contactNumber,
    hasSelectedBill: !!selectedBill
  });

  const receipt = {
    receiptNumber: receiptNumber,
    date: now.toISOString(),
    paymentDate: formatDate(now.toISOString()),
    transactionDate: formatDate(now.toISOString()),
    accountNumber: selectedBill?.reference_number || selectedBill?.id || "N/A",
    customerName: user?.name || "N/A",
    plan: selectedBill?.plan?.name || "N/A",
    dueDate: formatDate(selectedBill?.due_date || "N/A"),
    paymentMethod: "Credits Points",
    previousBalance: selectedBill?.previous_balance || selectedBill?.prev_balance || 0,
    currentCharges: selectedBill?.current_charges ||
                    selectedBill?.original_amount ||
                    selectedBill?.amount ||
                    0,
    totalDue: selectedBill?.amount_due || 0,
    discount: selectedBill?.discount || 0,
    penalty: selectedBill?.penalty || 0,
    paymentAmount: paymentAmount,
    paymentStatus: "PAID",
    companyName: "KAZIBUFAST NETWORKS",
    companyAddress: address,
    companyPhone: contactNumber,
    logo: base64Logo,
  };

  return receipt;
};

  const getBase64Logo = async () => {
    try {
      const asset = Asset.fromModule(
        require("../../../assets/images/logo.png"),
      );
      await asset.downloadAsync();

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading logo:", error);
      return "";
    }
  };

  // Generate HTML for receipt
  const generateReceiptHTML = (receipt, base64Logo) => {
    const formatCurrency = (amount) => {
      if (amount === undefined || amount === null) return "0.00";
      return parseFloat(amount).toFixed(2);
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment Receipt - ${receipt.paymentDate || "N/A"}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background-color: #ffffff; color: #000000; padding: 20px; }
        .receipt-container { max-width: 900px; margin: 0 auto; }
        .header { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
        .logo { width: 90px; height: 90px; border-radius: 50%; overflow: hidden; }
        .logo img { width: 100%; height: 100%; object-fit: cover; }
        .company-details { text-align: center; }
        .company-name { font-size: 20px; font-weight: bold; text-transform: uppercase; }
        .company-info { font-size: 14px; color: #333; margin-top: 5px; }
        .title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-transform: capitalize; }
        .table { width: 100%; border-collapse: collapse; }
        .table td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
        .table td:first-child { font-weight: bold; width: 40%; }
        .table td:last-child { text-align: left; width: 60%; }
        .paid-row td { font-weight: bold; font-size: 16px; padding: 12px 8px; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="logo">
            <img src="${base64Logo || receipt.logo || ""}" alt="Logo">
          </div>
          <div class="company-details">
            <div class="company-name">${receipt.companyName || "KAZIBUFAST NETWORKS"}</div>
            <div class="company-info">
              Address: ${receipt.companyAddress || "N/A"}<br>
              Contact No: ${receipt.companyPhone || "N/A"}
            </div>
          </div>
        </div>
        <div class="title">Payment Details</div>
        <table class="table">
          <tr><td>Account Number:</td><td>${receipt.accountNumber}</td></tr>
          <tr><td>Account Name:</td><td>${receipt.customerName}</td></tr>
          <tr><td>Plan:</td><td>${receipt.plan}</td></tr>
          <tr><td>Due Date:</td><td>${receipt.dueDate}</td></tr>
          <tr><td>Payment Mode:</td><td>${receipt.paymentMethod}</td></tr>
          <tr><td>Payment Date:</td><td>${receipt.paymentDate}</td></tr>
          <tr><td>Previous Balance:</td><td>${formatCurrency(receipt.previousBalance)}</td></tr>
          <tr><td>Current Charges:</td><td>${formatCurrency(receipt.currentCharges)}</td></tr>
          <tr><td>Total Amount Due:</td><td>${formatCurrency(receipt.totalDue)}</td></tr>
          <tr><td>Discount:</td><td>${formatCurrency(receipt.discount)}</td></tr>
          <tr><td>Penalty:</td><td>${formatCurrency(receipt.penalty)}</td></tr>
          <tr class="paid-row"><td>Paid Amount:</td><td>${formatCurrency(receipt.paymentAmount)}</td></tr>
        </table>
      </div>
    </body>
    </html>
    `;
  };

  // Save receipt as PDF
  const saveReceiptAsPDF = async (receipt) => {
    try {
      setDownloadingReceipt(true);
      const html = generateReceiptHTML(receipt, receipt.logo);
      const { uri: pdfUri } = await Print.printToFileAsync({ html });

      const fileName = `Receipt_${receipt.receiptNumber}_${new Date().toISOString().split("T")[0]}.pdf`;
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: "application/pdf",
          dialogTitle: `Save Receipt ${receipt.receiptNumber}`,
          UTI: "com.adobe.pdf",
        });
        Alert.alert(
          "Save Receipt",
          "Choose where to save your receipt:\n\n• 'Save to Files' (iOS)\n• 'Save' or 'Download' (Android)",
          [{ text: "OK" }],
        );
      } else {
        const appDir = FileSystem.documentDirectory + fileName;
        await FileSystem.moveAsync({ from: pdfUri, to: appDir });
        Alert.alert(
          "Receipt Saved",
          `File saved in app storage:\n${fileName}\n\nYou can access it via device file manager.`,
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      Alert.alert("Error", "Could not save receipt. Please try again.");
    } finally {
      setDownloadingReceipt(false);
    }
  };

  // Print receipt
  const printReceipt = async (receipt) => {
    try {
      setPrintingReceipt(true);
      const html = generateReceiptHTML(receipt, receipt.logo);
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Error", "Failed to print receipt. Please try again.", [
        { text: "OK", style: "default" },
      ]);
    } finally {
      setPrintingReceipt(false);
    }
  };

  const handlePayWithCredits = async () => {
    if (parseFloat(amount) > availableCredits) {
      setPaymentError("Insufficient credits balance");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setPaymentError("Please enter a valid amount");
      return;
    }

    const paymentAmount = parseFloat(amount);
    const maxAmount = getMaxPaymentAmount();
    const minAmount = getMinPaymentAmount();

    if (paymentAmount > maxAmount) {
      setPaymentError(
        `Payment amount cannot exceed ${formatCurrency(maxAmount)}`,
      );
      return;
    }

    if (paymentAmount < minAmount) {
      setPaymentError(
        `Payment amount cannot be less than ${formatCurrency(minAmount)}`,
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

      if (!token) {
        Alert.alert("Authentication Required", "Please log in to continue.", [
          { text: "Log In", onPress: () => router.replace("/(auth)/login") },
        ]);
        return;
      }

      const subdomain = getSubdomain();
      if (!subdomain) {
        Alert.alert("Error", "Unable to determine server location.");
        return;
      }

      if (!billingId) {
        Alert.alert("Error", "Billing ID not provided.");
        return;
      }

      const url = `https://${subdomain}.kazibufastnet.com/api/app/billings/pay-with-credits/${billingId}`;

      const requestBody = {
        amount: Number(paymentAmount),
        payment_method: "credits_points",
        penalty: Number(selectedBill?.penalty || 0),
        discount: Number(selectedBill?.discount || 0),
      };

      console.log("Processing payment to:", url);
      console.log("Request body:", requestBody);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Handle expired session
      if (response.status === 401) {
        await AsyncStorage.removeItem("token");
        Alert.alert("Session Expired", "Please log in again.", [
          { text: "Log In", onPress: () => router.replace("/(auth)/login") },
        ]);
        return;
      }

      const text = await response.text();
      const result = JSON.parse(text);

      if (!response.ok) {
        throw new Error(result.message || "Payment failed");
      }

      // Payment successful
      const receipt = await generateReceiptData(result, paymentAmount);
      setReceiptData(receipt);

      // Calculate new credit points
      const newCredits = Math.max(0, availableCredits - paymentAmount);

      // Update local state immediately
      setAvailableCredits(newCredits);

      // Update user store if possible
      try {
        // Get current user state
        const userStore = useUserStore.getState();

        if (userStore.user && userStore.user.credit_points !== undefined) {
          const updatedUser = {
            ...userStore.user,
            credit_points: newCredits,
          };

          // Try different store update methods
          if (typeof userStore.setUser === "function") {
            userStore.setUser(updatedUser);
          } else if (typeof userStore.updateUser === "function") {
            userStore.updateUser(updatedUser);
          } else if (typeof userStore.updateUserCredits === "function") {
            userStore.updateUserCredits(newCredits);
          }

          console.log("Updated user credits in store:", {
            old: availableCredits,
            paid: paymentAmount,
            new: newCredits,
          });
        }
      } catch (storeError) {
        console.log("Could not update user store:", storeError.message);
        // This is okay - we still updated the local state
      }

      // Show success message with updated credits
      Alert.alert(
        "✅ Payment Successful",
        `Your payment of ${formatCurrency(paymentAmount)} has been processed.\n\nRemaining credits: ${formatCurrency(newCredits)}`,
        [{ text: "View Receipt", onPress: () => setShowReceipt(true) }],
      );

      // Also update the success alert in the receipt modal to show new balance
      setTimeout(() => {
        // Refresh data to get updated bill status from server
        fetchAllData();
      }, 1000);
    } catch (error) {
      console.log("Payment error:", error.message);

      if (error.message.includes("Network request failed")) {
        Alert.alert(
          "Connection Error",
          "Unable to connect to the server. Please check your internet connection and try again.",
          [{ text: "OK" }],
        );
        return;
      }

      Alert.alert(
        "Payment Failed",
        error.message || "Something went wrong. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setProcessing(false);
    }
  };
  // Render Receipt Modal
  const renderReceiptModal = () => {
    if (!receiptData) return null;

    return (
      <Modal visible={showReceipt} animationType="slide">
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowReceipt(false);
              router.push(`/(role)/(clienttabs)/subscriptions`);
            }}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.content1}>
            <Text style={styles.companyHeader}>
              {receiptData.companyName || "KAZIBUFAST NETWORKS"}
            </Text>

            <View style={styles.companyInfoContainer}>
              <Text style={styles.companyInfo}>
                {receiptData.companyAddress}
              </Text>
              <Text style={styles.companyInfo}>{receiptData.companyPhone}</Text>
            </View>

            <Text style={styles.title}>Payment Details</Text>

            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderTextLeft}>Account Number</Text>
                <Text style={styles.tableHeaderTextRight}>
                  {receiptData.accountNumber}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Account Name</Text>
                <Text style={styles.tableValue}>
                  {receiptData.customerName}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Plan</Text>
                <Text style={styles.tableValue}>{receiptData.plan}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Due Date</Text>
                <Text style={styles.tableValue}>{receiptData.dueDate}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Payment Mode</Text>
                <Text style={styles.tableValue}>
                  {receiptData.paymentMethod}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Payment Date</Text>
                <Text style={styles.tableValue}>{receiptData.paymentDate}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Previous Balance</Text>
                <Text style={styles.tableValue}>
                  {formatCurrency(receiptData.previousBalance)}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Current Charges</Text>
                <Text style={styles.tableValue}>
                  {formatCurrency(receiptData.currentCharges)}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Total Amount Due</Text>
                <Text style={styles.tableValue}>
                  {formatCurrency(receiptData.totalDue)}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Discount</Text>
                <Text style={styles.tableValue}>
                  {formatCurrency(receiptData.discount)}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Penalty</Text>
                <Text style={styles.tableValue}>
                  {formatCurrency(receiptData.penalty)}
                </Text>
              </View>

              <View style={styles.paidAmountRow}>
                <Text style={styles.paidAmountLabel}>Paid Amount</Text>
                <Text style={styles.paidAmountValue}>
                  {formatCurrency(receiptData.paymentAmount)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => saveReceiptAsPDF(receiptData)}
              disabled={downloadingReceipt}
            >
              <Text style={styles.buttonText}>
                {downloadingReceipt ? "Saving..." : "Save as PDF"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.printButton}
              onPress={() => printReceipt(receiptData)}
              disabled={printingReceipt}
            >
              <Text style={styles.buttonText}>
                {printingReceipt ? "Printing..." : "Print"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderInputSection = () => {
    const maxAmount = getMaxPaymentAmount();

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
        ) : null}

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
    if (loading) {
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
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={40} color={colors.danger} />
            <Text
              style={[
                styles.errorText,
                { color: colors.danger, textAlign: "center", marginTop: 10 },
              ]}
            >
              No bill details available
            </Text>
            <Text
              style={[
                styles.errorSubtext,
                { color: colors.textLight, textAlign: "center", marginTop: 5 },
              ]}
            >
              Billing ID: {billingId || "N/A"}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: colors.primary, marginTop: 15 },
              ]}
              onPress={fetchAllData}
            >
              <Text style={[styles.retryButtonText, { color: colors.white }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const previousBalance = parseFloat(
      selectedBill.previous_balance || selectedBill.prev_balance || 0,
    );
    const currentCharges = parseFloat(
      selectedBill.current_charges ||
        selectedBill.original_amount ||
        selectedBill.amount ||
        0,
    );
    const penalty = parseFloat(selectedBill.penalty || 0);
    const discount = parseFloat(selectedBill.discount || 0);
    const totalDue = calculateTotalAmountDue();

    return (
      <View style={[styles.billSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Bill Breakdown
        </Text>

        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Account Number:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {selectedBill?.reference_number || selectedBill?.id || "N/A"}
          </Text>
        </View>
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Account Name:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {user?.name || "N/A"}
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
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Current Charges:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {formatCurrency(currentCharges)}
          </Text>
        </View>
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Previous Balance:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {formatCurrency(previousBalance)}
          </Text>
        </View>
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Penalty:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {formatCurrency(penalty)}
          </Text>
        </View>
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.textLight }]}>
            Discount:
          </Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {formatCurrency(discount)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Total Amount Due */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>
            TOTAL AMOUNT DUE:
          </Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatCurrency(totalDue + penalty - discount)}
          </Text>
        </View>

        {/* Payment Status */}
        {selectedBill.status && (
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
              {selectedBill.status.toUpperCase()}
            </Text>
          </View>
        )}
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
              {selectedBill && availableCredits >= calculateTotalAmountDue()
                ? "✓ You have enough credits to pay this bill"
                : selectedBill
                  ? `You need ${formatCurrency(calculateTotalAmountDue() - availableCredits)} more credits to pay in full`
                  : "Loading bill amount..."}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  if (loading) {
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content */}
          <View style={styles.content}>
            {renderCreditsBalance()}
            {renderBillSummary()}
            {selectedBill && renderInputSection()}
          </View>
        </ScrollView>

        {/* Footer with Pay Button */}
        {selectedBill && (
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
        )}
      </KeyboardAvoidingView>

      {/* Receipt Modal */}
      {renderReceiptModal()}
    </View>
  );
};

// Keep all your existing styles...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
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
    marginTop: 10,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
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
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    height: "100%",
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
  balanceAmount: {
    fontSize: 20,
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
  balanceSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  billLabel: {
    fontSize: 14,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  billSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  billValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
    borderRadius: 12,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1000,
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content1: {
    padding: 20,
    paddingTop: 50,
  },
  companyHeader: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 10,
  },
  companyInfoContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  companyInfo: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 4,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    marginRight: 8,
  },
  divider: {
    height: 0,
    marginVertical: 12,
    backgroundColor: "#E0E0E0",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorSubtext: {
    fontSize: 12,
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
  fullLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullLoadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  inputSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  paidAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    borderRadius: 5,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  paidAmountLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  paidAmountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  pdfButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  printButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 10,
  },
  tableHeaderTextLeft: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  tableHeaderTextRight: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  tableLabel: {
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  tableValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
    textDecorationLine: "underline",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    fontSize: 14,
    fontWeight: "600",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    fontSize: 14,
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
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 10,
    gap: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default CreditsPointsPayment;
