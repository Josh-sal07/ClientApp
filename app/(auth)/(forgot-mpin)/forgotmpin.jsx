import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
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
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Modern gradient background colors
const GRADIENT_COLORS = {
  primary: "#0C1824",      // Dark blue
  secondary: "#1A2A3A",    // Lighter dark blue
  accent: "#00AFA1",       // Teal accent
  light: "#2A3A4A",        // Light background
  white: "#FFFFFF",
  textLight: "#E6E6E6",
  textDark: "#333333",
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRADIENT_COLORS.primary,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  backgroundWrapper: {
    flex: 1,
    position: 'relative',
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.05,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.05,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 175, 161, 0.2)',
    shadowColor: GRADIENT_COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 70,
    height: 70,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: GRADIENT_COLORS.white,
    letterSpacing: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: GRADIENT_COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: GRADIENT_COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    maxWidth: '80%',
  },
  stepIndicatorContainer: {
    marginBottom: 32,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GRADIENT_COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepActive: {
    backgroundColor: GRADIENT_COLORS.accent,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ scale: 1.1 }],
  },
  stepCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepText: {
    color: GRADIENT_COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  stepConnector: {
    width: 40,
    height: 2,
    backgroundColor: GRADIENT_COLORS.light,
    marginHorizontal: 4,
  },
  stepConnectorActive: {
    backgroundColor: GRADIENT_COLORS.accent,
  },
  stepLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  stepLabel: {
    fontSize: 12,
    color: GRADIENT_COLORS.textLight,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  stepLabelActive: {
    color: GRADIENT_COLORS.accent,
    fontWeight: '700',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GRADIENT_COLORS.textLight,
    marginBottom: 12,
    paddingLeft: 4,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRADIENT_COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countryCodeBox: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 175, 161, 0.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: GRADIENT_COLORS.textDark,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: GRADIENT_COLORS.textDark,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    fontSize: 24,
    color: GRADIENT_COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: GRADIENT_COLORS.accent,
    backgroundColor: 'rgba(0, 175, 161, 0.1)',
    transform: [{ scale: 1.05 }],
  },
  pinSection: {
    marginBottom: 20,
  },
  pinInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pinInput: {
    width: 48,
    height: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    fontSize: 24,
    color: GRADIENT_COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  pinInputFilled: {
    borderColor: GRADIENT_COLORS.accent,
    backgroundColor: 'rgba(0, 175, 161, 0.1)',
  },
  pinInputMatched: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusText: {
    fontSize: 14,
    color: GRADIENT_COLORS.textLight,
    textAlign: 'center',
    opacity: 0.9,
  },
  statusTextSuccess: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusTextError: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: GRADIENT_COLORS.textLight,
    opacity: 0.8,
  },
  resendButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resendButtonText: {
    fontSize: 14,
    color: GRADIENT_COLORS.accent,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: GRADIENT_COLORS.textLight,
    opacity: 0.5,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: GRADIENT_COLORS.accent,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: GRADIENT_COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(0, 175, 161, 0.5)',
    shadowOpacity: 0.1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: GRADIENT_COLORS.white,
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 10,
    color: GRADIENT_COLORS.textLight,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  // Animated background elements
  floatingShape1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 175, 161, 0.05)',
    top: '10%',
    right: '-10%',
  },
  floatingShape2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: '20%',
    left: '-5%',
  },
});

export default function ForgotMpinScreen() {
  const router = useRouter();
  
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
  const slideAnim = useState(new Animated.Value(30))[0];

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
    return clean.length === 10 ? `+63${clean[0]}******${clean.slice(-3)}` : "+63";
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
    const clean = phone.replace(/\D/g, "");

    if (!clean) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    
    if (clean.length !== 10) {
      Alert.alert("Error", "Phone number must be 10 digits");
      return;
    }
    
    if (!clean.startsWith("9")) {
      Alert.alert("Error", "Phone number must start with 9");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://staging.kazibufastnet.com/api/app/verify_number",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_number: clean }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Phone number not found in our system");
      }

      await AsyncStorage.setItem("reset_phone", clean);
      
      Alert.alert(
        "OTP Sent",
        `Verification code sent to ${maskPhone(clean)}`,
        [
          {
            text: "OK",
            onPress: () => {
              setStep(2);
              setResendTimer(30);
              setCanResend(false);
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit OTP");
      return;
    }

    const storedPhone = await AsyncStorage.getItem("reset_phone");
    if (!storedPhone) {
      Alert.alert("Error", "Session expired. Please start again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://staging.kazibufastnet.com/api/app/otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_number: storedPhone,
            otp: otpCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.status === "success") {
        throw new Error(data.message || "Invalid OTP");
      }

      Alert.alert(
        "OTP Verified",
        "Please create your new MPIN",
        [
          {
            text: "Continue",
            onPress: () => {
              setStep(3);
              setOtp(["", "", "", "", "", ""]);
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert("Error", error.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset MPIN
  const handleResetMpin = async () => {
    const pinString = newPin.join("");
    const confirmPinString = confirmPin.join("");

    // Validation
    if (pinString.length !== 6) {
      Alert.alert("Error", "Please enter a 6-digit MPIN");
      return;
    }

    if (confirmPinString.length !== 6) {
      Alert.alert("Error", "Please confirm your 6-digit MPIN");
      return;
    }

    if (pinString !== confirmPinString) {
      Alert.alert("Error", "MPINs do not match");
      return;
    }

    const storedPhone = await AsyncStorage.getItem("reset_phone");
    if (!storedPhone) {
      Alert.alert("Error", "Session expired. Please start again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://staging.kazibufastnet.com/api/app/setup_pin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_number: storedPhone,
            pin: pinString,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to reset MPIN");
      }

      await AsyncStorage.removeItem("reset_phone");
      await AsyncStorage.setItem("pin_set", "true");
      await AsyncStorage.setItem("temp_phone", storedPhone);

      Alert.alert(
        "Success",
        "MPIN reset successfully!",
        [
          {
            text: "Login Now",
            onPress: () => {
              router.replace("/(auth)/(login)/login");
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert("Error", error.message || "Failed to reset MPIN");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;

    const storedPhone = await AsyncStorage.getItem("reset_phone");
    if (!storedPhone) {
      Alert.alert("Error", "Phone number not found");
      return;
    }

    try {
      setResendTimer(30);
      setCanResend(false);

      const response = await fetch(
        "https://staging.kazibufastnet.com/api/app/verify_number",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_number: storedPhone }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to resend OTP");
      }

      Alert.alert("OTP Resent", "A new OTP has been sent to your phone.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();

    } catch (error) {
      Alert.alert("Error", error.message || "Failed to resend OTP");
      setCanResend(true);
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
                  step === stepNum && styles.stepActive,
                  step > stepNum && styles.stepCompleted,
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
                    step > stepNum && styles.stepConnectorActive,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
        
        <View style={styles.stepLabelContainer}>
          <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>
            Verify Phone
          </Text>
          <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>
            Enter OTP
          </Text>
          <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>
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
          },
        ]}
      >
        <Text style={styles.subtitle}>
          Enter your registered phone number to receive OTP
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.phoneInputWrapper}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>+63</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="912 345 6789"
              placeholderTextColor="#999"
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
          <Text style={styles.helperText}>
          Enter your 10-digit phone number starting with 9
        </Text>
        </View>
        

        <TouchableOpacity
          style={[
            styles.button,
            (loading || phone.length !== 10) && styles.buttonDisabled,
          ]}
          onPress={handleSendOtp}
          disabled={loading || phone.length !== 10}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
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
          },
        ]}
      >
        <Text style={styles.subtitle}>
          Enter the 6-digit OTP sent to{"\n"}
          <Text style={{ fontWeight: '700', color: GRADIENT_COLORS.accent }}>
            {maskPhone(phone)}
          </Text>
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Verification Code</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpRefs.current[index] = ref)}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
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
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOtp}
            disabled={!canResend || loading}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.resendButtonText,
                !canResend && styles.resendButtonTextDisabled,
              ]}
            >
              {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || otp.join("").length !== 6) && styles.buttonDisabled,
          ]}
          onPress={handleVerifyOtp}
          disabled={loading || otp.join("").length !== 6}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
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
          },
        ]}
      >
        <Text style={styles.subtitle}>
          Create a new 6-digit MPIN for your account
        </Text>
        
        <View style={styles.pinSection}>
          <Text style={styles.inputLabel}>New MPIN</Text>
          <View style={styles.pinInputsContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextInput
                key={`new-${index}`}
                ref={(ref) => (newPinRefs.current[index] = ref)}
                style={[styles.pinInput, newPin[index] && styles.pinInputFilled]}
                value={newPin[index] ? "•" : ""}
                onChangeText={(value) => handlePinChange(newPin, setNewPin, index, value)}
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
          <Text style={styles.inputLabel}>Confirm MPIN</Text>
          <View style={styles.pinInputsContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextInput
                key={`confirm-${index}`}
                ref={(ref) => (confirmPinRefs.current[index] = ref)}
                style={[
                  styles.pinInput,
                  confirmPin[index] && styles.pinInputFilled,
                  isConfirmPinComplete && doPinsMatch && styles.pinInputMatched,
                ]}
                value={confirmPin[index] ? "•" : ""}
                onChangeText={(value) => handlePinChange(confirmPin, setConfirmPin, index, value)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!loading}
                secureTextEntry
                textAlign="center"
              />
            ))}
          </View>
        </View>

        <View style={styles.statusContainer}>
          {isPinComplete && isConfirmPinComplete ? (
            doPinsMatch ? (
              <Text style={styles.statusTextSuccess}>
                ✓ PINs match. You're good to go!
              </Text>
            ) : (
              <Text style={styles.statusTextError}>
                ✗ PINs don't match. Please check again.
              </Text>
            )
          ) : (
            <Text style={styles.statusText}>
              Enter 6-digit PIN in both fields
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || !isPinComplete || !isConfirmPinComplete || !doPinsMatch) &&
              styles.buttonDisabled,
          ]}
          onPress={handleResetMpin}
          disabled={loading || !isPinComplete || !isConfirmPinComplete || !doPinsMatch}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Reset MPIN</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
    <View style={styles.container}>
      {/* Animated Background Elements */}
      <View style={styles.backgroundWrapper}>
        <View style={styles.floatingShape1} />
        <View style={styles.floatingShape2} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.contentContainer}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                router.push("/(auth)/(login)/login");
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={GRADIENT_COLORS.accent} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/images/kazi.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>KAZIBUFAST</Text>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Reset MPIN</Text>
              <Text style={styles.subtitle}>
                Follow these simple steps to reset your MPIN
              </Text>
            </View>

            {/* Step Indicators */}
            {renderStepIndicator()}

            {/* Form Steps */}
            {step === 1 && renderPhoneStep()}
            {step === 2 && renderOtpStep()}
            {step === 3 && renderNewPinStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
    </ScrollView>
  );
}