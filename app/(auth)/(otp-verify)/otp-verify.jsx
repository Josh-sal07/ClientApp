// otp-verify.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./otp-verify.css.js";
import CustomAlert from "../../../components/CustomAlert";
import { useTheme } from "../../../theme/ThemeContext";
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
  useColorScheme,
  StatusBar,
} from "react-native";

export default function OtpVerifyScreen({ route }) {
  const router = useRouter();
  const otpRefs = useRef([]);
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [skipPinSetup, setSkipPinSetup] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  // Determine effective theme mode
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  // Define colors based on theme (matching Home screen)
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
      text: "#136350",
      textLight: "#64748B",
      inputBackground: "#FFFFFF",
      inputText: "#333333",
      placeholder: "#999999",
      helper: "#666666",
      otpFilled: "#FFFFFF",
      // Gradient colors - Matching Home screen
      gradientStart: "#98eced",
      gradientAlt1: "#65f1e8",
      gradientEnd: "#21c7c1",
      gradientAlt: "#1de7e3",
    },
    dark: {
      primary: "#1f6f68",
      secondary: "#00AFA1",
      dark: "#121212",
      white: "#d9f7f6",
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
      inputBackground: "#2A2A2A",
      inputText: "#FFFFFF",
      placeholder: "#666666",
      helper: "#B0B0B0",
      otpFilled: "#FFFFFF",
      // Gradient colors (darker version) - Matching Home screen
      gradientStart: "#000000",
      gradientEnd: "#032829",
      gradientAlt: "#0b1515",
      gradientAlt1: "#032829",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  // Gradient colors for header (bottom to top) - matching Home screen
  const getHeaderGradientColors = () => {
    if (effectiveMode === "dark") {
      return [
        "#121212", // Darker at bottom
        "#1a4a4b", // Medium
        "#2d6c6d", // Lighter at top
      ];
    } else {
      return [
        "#F5F8FA", // Darker at bottom
        "#21C7B9", // Primary color in middle
        "#65f1e8", // Lighter at top
      ];
    }
  };

  /** Load phone from AsyncStorage or route params */
  useEffect(() => {
    const loadPhone = async () => {
      try {
        const routePhone = route?.params?.phone;
        const skipPin = route?.params?.skipPinSetup === "true";
        const storedPhone = await AsyncStorage.getItem("temp_phone");

        setPhoneNumber(routePhone || storedPhone || "");
        setSkipPinSetup(skipPin);
      } catch (error) {}
    };
    loadPhone();
  }, [route?.params?.phone, route?.params?.skipPinSetup]);

  /** Resend countdown */
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  /** Masked phone display */
  const encryptPhoneNumber = (phone) => {
    const clean = phone.replace(/\D/g, "");
    return clean.length === 10
      ? `+63${clean[0]}******${clean.slice(-3)}`
      : "+63";
  };

  const handleOtpChange = (index, value) => {
    const numeric = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = numeric;
    setOtp(newOtp);
    if (numeric && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (index, e) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setAlertConfig({
        visible: true,
        title: "Invalid OTP",
        message: "Enter 6-digit OTP",
        type: "warning",
      });
      return;
    }

    try {
      setOtpLoading(true);

      const clean = phoneNumber.replace(/\D/g, "");

      const response = await fetch(
        "https://tub.kazibufastnet.com/api/app/otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_number: clean,
            otp: otpCode,
          }),
        },
      );

      const data = await response.json();

      if (data.error || data.success === false) {
        throw new Error(data.message || "OTP verification failed");
      }

      // ✅ Save phone number permanently
      await AsyncStorage.setItem("phone", clean);

      // ✅ Clear temporary phone
      await AsyncStorage.removeItem("temp_phone");

      // ✅ Check PIN status from multiple sources
      const backendHasPin = data.hasPin;
      const localPinSet = await AsyncStorage.getItem(`pin_set_${clean}`);
      const localHasPin = localPinSet === "true";
      const skipFromParams = route?.params?.skipPinSetup === "true";

      // Decision: If ANY source says PIN exists, go to login
      const hasPin = backendHasPin || localHasPin || skipFromParams;

      setAlertConfig({
        visible: true,
        title: "Success",
        message: "OTP verified successfully!",
        type: "success",
        onConfirm: () => {
          if (hasPin) {
            router.replace({
              pathname: "/(auth)/(login)/login",
              params: { phone: clean },
            });
          } else {
            router.replace({
              pathname: "/(auth)/(setup-pin)/setup-pin",
              params: { phone: clean },
            });
          }
        },
      });
    } catch (err) {
      setAlertConfig({
        visible: true,
        title: "Verification Failed",
        message: err.message || "OTP verification failed",
        type: "error",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      const clean = phoneNumber.replace(/\D/g, "");

      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      setResendTimer(30);
      setCanResend(false);

      await fetch("https://tub.kazibufastnet.com/api/app/verify_number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: clean }),
      });

      setAlertConfig({
        visible: true,
        title: "OTP Resent",
        message: "A new OTP has been sent.",
        type: "success",
      });
    } catch {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Failed to resend OTP",
        type: "error",
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={effectiveMode === "dark" ? "light-content" : "dark-content"}
      />

      <LinearGradient
        colors={getHeaderGradientColors()}
        start={{ x: 0.5, y: 1 }} // Start at bottom
        end={{ x: 0.5, y: 0 }} // End at top
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[styles.container, { backgroundColor: "transparent" }]}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/images/kazi.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <Text style={[styles.title, { color: colors.white }]}>
                Verify OTP Code
              </Text>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                Enter the 6-digit code sent to{"\n"}
                <Text style={[styles.phoneNumberText, { color: colors.white }]}>
                  {phoneNumber ? encryptPhoneNumber(phoneNumber) : "Loading..."}
                </Text>
              </Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpRefs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.inputText,
                      },
                      digit && {
                        borderColor: colors.primary,
                        backgroundColor: colors.primary + "15",
                        color: colors.text,
                      },
                    ]}
                    value={digit}
                    onChangeText={(val) => handleOtpChange(index, val)}
                    onKeyPress={(e) => handleOtpKeyPress(index, e)}
                    keyboardType="number-pad"
                    maxLength={1}
                    editable={!otpLoading}
                    textAlign="center"
                    autoFocus={index === 0}
                    selectionColor={colors.gray}
                    placeholderTextColor={colors.placeholder}
                  />
                ))}
              </View>

              <View style={styles.resendContainer}>
                <Text style={[styles.resendText, { color: colors.text }]}>
                  Didn't receive the code?{" "}
                </Text>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={!canResend}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      { color: colors.primary },
                      !canResend && { color: colors.gray },
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
                  otpLoading && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
            </View>

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
      </LinearGradient>
    </View>
  );
}

export { OtpVerifyScreen };
