import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import styles from "./otp-verify.css.js";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function OtpVerifyScreen({ route }) {
  const router = useRouter();
  const otpRefs = useRef([]);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  /** Load phone from AsyncStorage or route params */
  useEffect(() => {
    const loadPhone = async () => {
      const routePhone = route?.params?.phone;
      const storedPhone = await AsyncStorage.getItem("temp_phone");
      setPhoneNumber(routePhone || storedPhone || "");
    };
    loadPhone();
  }, [route?.params?.phone]);

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

  const normalizePhone = (phone) => {
    const clean = phone.replace(/\D/g, "");
    return clean.startsWith("9") ? `+63${clean}` : clean;
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Enter 6-digit OTP");
      return;
    }

    try {
      setOtpLoading(true);

      const clean = phoneNumber.replace(/\D/g, "");

      const response = await fetch(
        "https://staging.kazibufastnet.com/api/app/otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_number: clean,
            otp: otpCode,
          }),
        }
      );

      const data = await response.json();

      if (data.error || data.success === false) {
        throw new Error(data.message || "OTP verification failed");
      }

      // 🔐 Save authenticated phone
      await AsyncStorage.setItem("phone", clean);

      // 🔐 Check LOCAL pin state (per phone)
      const localPinSet = await AsyncStorage.getItem(`pin_set_${clean}`);

      // 🔐 If backend confirms PIN → persist locally
      if (data.pin_set === true) {
        await AsyncStorage.setItem(`pin_set_${clean}`, "true");
      }

      // ✅ FINAL DECISION (LOCAL FIRST)
      const hasPin = data.hasPin;

      if (hasPin) {
        router.replace("/(auth)/(login)/login");
      } else {
        router.replace("/(auth)/(setup-pin)/setup-pin");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const cleanPhone = (phone) => phone.replace(/\D/g, "");

    if (!canResend) return;

    try {
      const clean = cleanPhone(phoneNumber);

      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      setResendTimer(30);
      setCanResend(false);

      await fetch("https://staging.kazibufastnet.com/api/app/verify_number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: clean }),
      });

      Alert.alert("OTP Resent", "A new OTP has been sent.");
    } catch {
      Alert.alert("Error", "Failed to resend OTP");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/images/kazi.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Verify OTP Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.phoneNumberText}>
              {phoneNumber ? encryptPhoneNumber(phoneNumber) : "Loading..."}
            </Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpRefs.current[index] = ref)}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(val) => handleOtpChange(index, val)}
                onKeyPress={(e) => handleOtpKeyPress(index, e)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!otpLoading}
                textAlign="center"
                autoFocus={index === 0}
              />
            ))}
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResendOtp} disabled={!canResend}>
              <Text
                style={[
                  styles.resendLink,
                  !canResend && styles.resendLinkDisabled,
                ]}
              >
                {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, otpLoading && styles.buttonDisabled]}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export { OtpVerifyScreen };
