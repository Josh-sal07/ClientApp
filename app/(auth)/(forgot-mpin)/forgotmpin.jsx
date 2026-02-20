import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme/ThemeContext";
import { useColorScheme } from "react-native";
import { useUserStore } from "../../../store/user";
import CustomAlert from "../../../components/CustomAlert";

const { width, height } = Dimensions.get("window");

export default function ForgotMpinScreen() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  // Determine effective theme mode
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  // Define colors based on theme - Matching design system
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
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
      surface: "#FFFFFF",
      // Gradient colors - Matching Security/About screens
      gradientStart: "#98eced",
      gradientAlt1: "#65f1e8",
      gradientEnd: "#21c7c1",
      gradientAlt: "#1de7e3",
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
      background: "#121212",
      text: "#FFFFFF",
      textLight: "#B0B0B0",
      surface: "#1E1E1E",
      // Gradient colors (darker version)
      gradientStart: "#000000",
      gradientEnd: "#032829",
      gradientAlt: "#0b1515",
      gradientAlt1: "#032829",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  // State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New PIN
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Refs for auto-focus
  const otpRefs = useRef([]);
  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  const normalizePhone = (number) => {
    const clean = number.replace(/\D/g, "");
    return clean.slice(-10); // ensures EXACTLY 10 digits
  };

  // Animate on step change
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // Format phone while typing
  const formatPhone = (value) => {
    const clean = value.replace(/\D/g, "").slice(0, 10);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  };

  // Masked display
  const maskPhone = (value) => {
    const clean = value.replace(/\D/g, "");
    return clean.length === 10
      ? `+63${clean[0]}******${clean.slice(-3)}`
      : "+63";
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    const numeric = value.replace(/\D/g, "");
    if (numeric.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = numeric;
    setOtp(newOtp);

    // Auto-focus next input
    if (numeric && index < 5) {
      setTimeout(() => otpRefs.current[index + 1]?.focus(), 10);
    }
  };

  // Handle PIN input
  const handlePinChange = (pinArray, setPinArray, index, value) => {
    const numeric = value.replace(/\D/g, "");
    if (numeric.length > 1) return;

    const newPinArray = [...pinArray];
    newPinArray[index] = numeric;
    setPinArray(newPinArray);

    // Auto-focus next input
    if (numeric && index < 5) {
      if (setPinArray === setNewPin) {
        setTimeout(() => newPinRefs.current[index + 1]?.focus(), 10);
      } else {
        setTimeout(() => confirmPinRefs.current[index + 1]?.focus(), 10);
      }
    }
  };

  // Step 1: Send OTP to verify phone
  const handleSendOtp = async () => {
    try {
      const phoneNormalized = normalizePhone(phone);

      if (phoneNormalized.length !== 10 || !phoneNormalized.startsWith("9")) {
        setAlertConfig({
          visible: true,
          title: "Invalid Phone",
          message: "Invalid phone number",
          type: "warning",
        });
        return;
      }

      if (!user?.branch?.subdomain) {
        setAlertConfig({
          visible: true,
          title: "Service Unavailable",
          message: "Service unavailable",
          type: "error",
        });
        return;
      }

      setLoading(true);

      const endpoint = `https://${user.branch.subdomain}.kazibufastnet.com/api/app/verify_number`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          mobile_number: phoneNormalized,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to send OTP");
      }

      await AsyncStorage.setItem("reset_phone", phoneNormalized);

      setAlertConfig({
        visible: true,
        title: "OTP Sent",
        message: "Please check your phone",
        type: "success",
        onConfirm: () => setStep(2),
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    console.log("VERIFY OTP CLICKED");
    try {
      const otpCode = otp.join("");

      if (otpCode.length !== 6) {
        setAlertConfig({
          visible: true,
          title: "Invalid OTP",
          message: "Enter the 6-digit OTP",
          type: "warning",
        });
        return;
      }

      const storedPhone = await AsyncStorage.getItem("reset_phone");
      if (!storedPhone) {
        setAlertConfig({
          visible: true,
          title: "Session Expired",
          message: "Session expired",
          type: "error",
        });
        return;
      }

      if (!user?.branch?.subdomain) {
        setAlertConfig({
          visible: true,
          title: "Service Unavailable",
          message: "Service unavailable",
          type: "error",
        });
        return;
      }

      setLoading(true);

      const endpoint = `https://${user.branch.subdomain}.kazibufastnet.com/api/app/otp`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          mobile_number: storedPhone,
          otp: otpCode,
        }),
      });

      const data = await response.json();
      console.log("OTP API RESPONSE:", data);

      // ✅ THIS IS THE ONLY VALID SUCCESS CONDITION
      if (!response.ok || data.status !== "verified") {
        throw new Error("Invalid OTP");
      }

      // ✅ OTP VERIFIED
      // OTP VERIFIED
      setAlertConfig({
        visible: true,
        title: "OTP Verified",
        message: "You can now set your new MPIN",
        type: "success",
        onConfirm: () => {
          setOtp(["", "", "", "", "", ""]);
          setStep(3);
        },
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Verification Failed",
        message: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      const storedPhone = await AsyncStorage.getItem("reset_phone");
      if (!storedPhone) return;

      if (!user?.branch?.subdomain) return;

      setCanResend(false);
      setResendTimer(30);

      const endpoint = `https://${user.branch.subdomain}.kazibufastnet.com/api/app/verify_number`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_number: storedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error("Failed to resend OTP");
      }

      setAlertConfig({
        visible: true,
        title: "OTP Resent",
        message: "Check your phone",
        type: "success",
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message,
        type: "error",
      });

      setCanResend(true);
    }
  };

  // Step 3: Reset MPIN
  const handleResetMpin = async () => {
    const pinString = newPin.join("");
    const confirmPinString = confirmPin.join("");

    // Validation
    if (pinString.length !== 6) {
      setAlertConfig({
        visible: true,
        title: "Invalid MPIN",
        message: "Please enter a 6-digit MPIN",
        type: "warning",
      });
      return;
    }

    if (confirmPinString.length !== 6) {
      setAlertConfig({
        visible: true,
        title: "Invalid MPIN",
        message: "Please confirm your 6-digit MPIN",
        type: "warning",
      });
      return;
    }

    if (pinString !== confirmPinString) {
      setAlertConfig({
        visible: true,
        title: "Mismatch",
        message: "MPINs do not match",
        type: "warning",
      });
      return;
    }

    const storedPhone = await AsyncStorage.getItem("reset_phone");
    if (!storedPhone) {
      setAlertConfig({
        visible: true,
        title: "Session Expired",
        message: "Session expired. Please start again.",
        type: "error",
      });
      return;
    }

    // Check if user exists
    if (!user) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "User information not available. Please log in again.",
        type: "error",
      });
      return;
    }

    // Check if branch and subdomain exist
    if (!user.branch || !user.branch.subdomain) {
      setAlertConfig({
        visible: true,
        title: "Service Error",
        message:
          "Unable to determine your service domain. Please contact support.",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const subdomain = user.branch.subdomain;
      const response = await fetch(
        `https://${subdomain}.kazibufastnet.com/api/app/setup_pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_number: storedPhone,
            pin: pinString,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to reset MPIN");
      }

      await AsyncStorage.removeItem("reset_phone");
      await AsyncStorage.setItem("pin_set", "true");
      await AsyncStorage.setItem("temp_phone", storedPhone);

      setAlertConfig({
        visible: true,
        title: "Success",
        message: "MPIN reset successfully!",
        type: "success",
        onConfirm: () => {
          router.replace("/(auth)/(login)/login");
        },
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message || "Failed to reset MPIN",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend timer effect
  useEffect(() => {
    let timer;
    if (step === 2 && resendTimer > 0 && !canResend) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer, canResend]);

  // Render step indicators with connectors
  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((stepNum, index) => (
            <React.Fragment key={stepNum}>
              <View
                style={[
                  styles.step,
                  { backgroundColor: colors.lightGray },
                  step === stepNum && [
                    styles.stepActive,
                    { backgroundColor: colors.primary },
                  ],
                  step > stepNum && [
                    styles.stepCompleted,
                    { backgroundColor: colors.success },
                  ],
                ]}
              >
                <Text style={styles.stepText}>
                  {step > stepNum ? "✓" : stepNum}
                </Text>
              </View>
              {index < 2 && (
                <View
                  style={[
                    styles.stepConnector,
                    { backgroundColor: colors.lightGray },
                    step > stepNum && [
                      styles.stepConnectorActive,
                      { backgroundColor: colors.primary },
                    ],
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.stepLabelContainer}>
          <Text
            style={[
              styles.stepLabel,
              { color: colors.textLight },
              step === 1 && [styles.stepLabelActive, { color: colors.primary }],
            ]}
          >
            Verify Phone
          </Text>
          <Text
            style={[
              styles.stepLabel,
              { color: colors.textLight },
              step === 2 && [styles.stepLabelActive, { color: colors.primary }],
            ]}
          >
            Enter OTP
          </Text>
          <Text
            style={[
              styles.stepLabel,
              { color: colors.textLight },
              step === 3 && [styles.stepLabelActive, { color: colors.primary }],
            ]}
          >
            New MPIN
          </Text>
        </View>
      </View>
    );
  };

  // Step 1: Phone Input
  const renderPhoneStep = () => {
    return (
      <Animated.View
        style={[
          styles.formContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Phone Number
          </Text>
          <View
            style={[
              styles.phoneInputWrapper,
              {
                backgroundColor: colors.white,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.countryCodeBox,
                {
                  backgroundColor: colors.primary + "10",
                  borderRightColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.countryCodeText, { color: colors.dark }]}>
                +63
              </Text>
            </View>
            <TextInput
              style={[styles.phoneInput, { color: colors.dark }]}
              placeholder="912 345 6789"
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
              value={formatPhone(phone)}
              onChangeText={(text) => {
                const clean = text.replace(/\D/g, "").slice(0, 10);
                setPhone(clean);
              }}
              maxLength={13}
              editable={!loading}
              autoFocus
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textLight }]}>
            Enter your 10-digit phone number starting with 9
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            (loading || phone.length !== 10) && styles.buttonDisabled,
          ]}
          onPress={handleSendOtp}
          disabled={loading || phone.length !== 10}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Step 2: OTP Input
  const renderOtpStep = () => {
    return (
      <Animated.View
        style={[
          styles.formContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.subtitle,
            { marginBottom: 24, color: colors.textLight },
          ]}
        >
          Enter the 6-digit OTP sent to{"\n"}
          <Text style={{ fontWeight: "700", color: colors.primary }}>
            {maskPhone(phone)}
          </Text>
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Verification Code
          </Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  digit && [
                    styles.otpInputFilled,
                    {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + "05",
                    },
                  ],
                ]}
                value={digit}
                onChangeText={(val) => handleOtpChange(index, val)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!loading}
                textAlign="center"
                autoFocus={index === 0}
              />
            ))}
          </View>
        </View>

        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: colors.textLight }]}>
            Didn't receive the code?
          </Text>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOtp}
            disabled={!canResend || loading}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.resendButtonText,
                { color: colors.primary },
                !canResend && [
                  styles.resendButtonTextDisabled,
                  { color: colors.textLight },
                ],
              ]}
            >
              {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            (loading || otp.join("").length !== 6) && styles.buttonDisabled,
          ]}
          onPress={handleVerifyOtp}
          disabled={loading || otp.join("").length !== 6}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Step 3: New PIN Input
  const renderNewPinStep = () => {
    const isPinComplete = newPin.join("").length === 6;
    const isConfirmPinComplete = confirmPin.join("").length === 6;
    const doPinsMatch = newPin.join("") === confirmPin.join("");

    return (
      <Animated.View
        style={[
          styles.formContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.subtitle,
            { marginBottom: 24, color: colors.textLight },
          ]}
        >
          Create a new 6-digit MPIN for your account
        </Text>

        <View style={styles.pinSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            New MPIN
          </Text>
          <View style={styles.pinInputsContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextInput
                key={`new-${index}`}
                ref={(ref) => (newPinRefs.current[index] = ref)}
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  newPin[index] && [
                    styles.pinInputFilled,
                    {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + "05",
                    },
                  ],
                ]}
                value={newPin[index] ? "•" : ""}
                onChangeText={(value) =>
                  handlePinChange(newPin, setNewPin, index, value)
                }
                keyboardType="number-pad"
                maxLength={1}
                editable={!loading}
                secureTextEntry
                textAlign="center"
                autoFocus={index === 0 && !newPin[0]}
              />
            ))}
          </View>
        </View>

        <View style={styles.pinSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Confirm MPIN
          </Text>
          <View style={styles.pinInputsContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextInput
                key={`confirm-${index}`}
                ref={(ref) => (confirmPinRefs.current[index] = ref)}
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  confirmPin[index] && [
                    styles.pinInputFilled,
                    {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + "05",
                    },
                  ],
                  isConfirmPinComplete &&
                    doPinsMatch && [
                      styles.pinInputMatched,
                      {
                        borderColor: colors.success,
                        backgroundColor: colors.success + "10",
                      },
                    ],
                ]}
                value={confirmPin[index] ? "•" : ""}
                onChangeText={(value) =>
                  handlePinChange(confirmPin, setConfirmPin, index, value)
                }
                keyboardType="number-pad"
                maxLength={1}
                editable={!loading}
                secureTextEntry
                textAlign="center"
              />
            ))}
          </View>
        </View>

        <View
          style={[
            styles.statusContainer,
            {
              backgroundColor: colors.lightGray,
              borderColor: colors.border,
            },
          ]}
        >
          {isPinComplete && isConfirmPinComplete ? (
            doPinsMatch ? (
              <Text
                style={[styles.statusTextSuccess, { color: colors.success }]}
              >
                ✓ PINs match. You're good to go!
              </Text>
            ) : (
              <Text style={[styles.statusTextError, { color: colors.danger }]}>
                ✗ PINs don't match. Please check again.
              </Text>
            )
          ) : (
            <Text style={[styles.statusText, { color: colors.textLight }]}>
              Enter 6-digit PIN in both fields
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            (loading ||
              !isPinComplete ||
              !isConfirmPinComplete ||
              !doPinsMatch) &&
              styles.buttonDisabled,
          ]}
          onPress={handleResetMpin}
          disabled={
            loading || !isPinComplete || !isConfirmPinComplete || !doPinsMatch
          }
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Reset MPIN</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Gradient Header - Different gradients for light/dark mode */}
      <LinearGradient
        colors={
          effectiveMode === "dark"
            ? [colors.gradientEnd, colors.gradientEnd]
            : [colors.gradientEnd, colors.gradientEnd]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientHeader}
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset MPIN</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.logoWrapper,
                {
                  backgroundColor: colors.primary + "10",
                  borderColor: colors.primary + "20",
                },
              ]}
            >
              <Image
                source={require("../../../assets/images/kazi.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>
              KAZIBUFAST
            </Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Reset Your MPIN
            </Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              Follow these simple steps to reset your MPIN
            </Text>
          </View>

          {/* Step Indicators */}
          {renderStepIndicator()}

          {/* Form Steps */}
          {step === 1 && renderPhoneStep()}
          {step === 2 && renderOtpStep()}
          {step === 3 && renderNewPinStep()}

          <View style={styles.bottomSpacer} />
          <CustomAlert
            visible={alertConfig.visible}
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            confirmText="OK"
            onConfirm={() => {
              alertConfig.onConfirm?.();
              setAlertConfig((prev) => ({ ...prev, visible: false }));
            }}
            onClose={() =>
              setAlertConfig((prev) => ({ ...prev, visible: false }))
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Gradient Header Styles
  gradientHeader: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 50 : 0,

    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  headerRightPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
  },
  logo: {
    width: 50,
    height: 50,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 1,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "90%",
  },
  stepIndicatorContainer: {
    marginBottom: 30,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  stepActive: {
    borderColor: "#FFFFFF",
  },
  stepCompleted: {
    // Empty, color is set inline
  },
  stepText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#FFFFFF",
  },
  stepConnector: {
    width: 40,
    height: 3,
    marginHorizontal: 4,
  },
  stepConnectorActive: {
    // Empty, color is set inline
  },
  stepLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 10,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
  stepLabelActive: {
    fontWeight: "700",
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    paddingLeft: 4,
    textAlign: "center",
  },
  phoneInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  countryCodeBox: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRightWidth: 1,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  otpInputFilled: {
    // Styles applied inline
  },
  pinSection: {
    marginBottom: 24,
  },
  pinInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pinInput: {
    width: 46,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  pinInputFilled: {
    // Styles applied inline
  },
  pinInputMatched: {
    // Styles applied inline
  },
  statusContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    textAlign: "center",
  },
  statusTextSuccess: {
    fontWeight: "600",
  },
  statusTextError: {
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
  },
  resendButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  resendButtonTextDisabled: {
    opacity: 0.5,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#21C7B9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  helperText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});
