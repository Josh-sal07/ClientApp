import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Dimensions,
  useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";

const { width } = Dimensions.get("window");

export default function ChangeMPINPage() {
  const router = useRouter();
  const { mode } = useTheme();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [activeInput, setActiveInput] = useState("pin");
  const pinInputRef = useRef(null);
  const confirmPinInputRef = useRef(null);

  const systemColorScheme = useColorScheme();
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

  useEffect(() => {
    loadPhoneNumber();
  }, []);

  const loadPhoneNumber = async () => {
    try {
      const storedPhone = await AsyncStorage.getItem("phone");
      if (storedPhone) {
        setPhone(storedPhone);
      }
    } catch (error) {
    }
  };

  const handlePinChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, "");
    if (numericText.length <= 6) {
      setPin(numericText);
      if (numericText.length === 6) {
        setTimeout(() => {
          confirmPinInputRef.current?.focus();
          setActiveInput("confirmPin");
        }, 100);
      }
    }
  };

  const handleConfirmPinChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, "");
    if (numericText.length <= 6) {
      setConfirmPin(numericText);
    }
  };

  const renderPinDots = (pinValue) => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      const isFilled = i < pinValue.length;
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            {
              backgroundColor: isFilled ? colors.primary : colors.lightGray,
              borderColor: colors.border,
            },
          ]}
        >
          {isFilled && (
            <Text style={[styles.pinDotText, { color: colors.white }]}>•</Text>
          )}
        </View>,
      );
    }
    return dots;
  };

  const handleSubmit = async () => {
    if (!phone) {
      Alert.alert("Error", "Phone number not found. Please login again.");
      return;
    }

    if (pin.length !== 6 || confirmPin.length !== 6) {
      Alert.alert("Error", "Please enter and confirm your 6-digit MPIN");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("Error", "MPINs do not match");
      return;
    }

    // Check for weak MPINs
    const weakMPINs = [
      "123456",
      "111111",
      "000000",
      "654321",
      "112233",
      "121212",
    ];
    if (weakMPINs.includes(pin)) {
      Alert.alert(
        "Weak MPIN Detected",
        "For your protection, avoid using easy to guess MPINs like 123456 or 111111.",
        [
          { text: "Change MPIN", style: "cancel" },
          {
            text: "Continue Anyway",
            onPress: () => proceedWithSubmission(pin),
          },
        ],
      );
      return;
    }

    proceedWithSubmission(pin);
  };

  const proceedWithSubmission = async (pinString) => {
    try {
      setLoading(true);

      const formattedPhone = phone.startsWith("+")
        ? phone
        : phone.replace(/^0/, "");

      const response = await fetch(
        "https://staging.kazibufastnet.com/api/app/setup_pin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_number: formattedPhone,
            pin: pinString,
          }),
        },
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to set MPIN!");
      }

      // Store in AsyncStorage
      await AsyncStorage.multiSet([
        ["phone", formattedPhone],
        ["pin", pinString],
        ["pin_set", "true"],
      ]);

      Alert.alert(
        "Success",
        "MPIN changed successfully! For security purposes, you will be logged out.",
        [
          {
            text: "OK",
            onPress: async () => {
              // Clear all auth data
              await AsyncStorage.multiRemove([
                "token",
                "pin",
                "pin_set",
              ]);
              // Navigate to login page
              router.replace("/(auth)/(login)/login");
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const focusPinInput = () => {
    pinInputRef.current?.focus();
    setActiveInput("pin");
  };

  const focusConfirmPinInput = () => {
    if (pin.length === 6) {
      confirmPinInputRef.current?.focus();
      setActiveInput("confirmPin");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={effectiveMode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header */}
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
              Change MPIN
            </Text>
          </View>

          {/* Empty view to balance the header */}
          <View style={styles.headerRight} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { backgroundColor: colors.background },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Instruction */}
          <View style={styles.instructionContainer}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Set New MPIN
            </Text>
            <Text style={[styles.instructionText, { color: colors.textLight }]}>
              Your MPIN will serve as your password to log in. For your
              protection, avoid using weak, easy to guess MPINs such as 123456,
              111111, or your birthdate.
            </Text>
          </View>

          {/* PIN Input Sections */}
          <View
            style={[
              styles.pinContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: effectiveMode === "dark" ? "transparent" : "#000",
              },
            ]}
          >
            {/* New PIN Section */}
            <TouchableOpacity
              style={[
                styles.pinSection,
                {
                  borderColor:
                    activeInput === "pin" ? colors.primary : "transparent",
                },
                activeInput === "pin" && {
                  backgroundColor: colors.primary + "10",
                },
              ]}
              onPress={focusPinInput}
              activeOpacity={0.8}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.labelContainer}>
                  <Ionicons
                    name="key-outline"
                    size={18}
                    color={colors.textLight}
                  />
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>
                    New MPIN
                  </Text>
                </View>
                <Text
                  style={[styles.pinLengthText, { color: colors.textLight }]}
                >
                  {pin.length}/6 digits
                </Text>
              </View>

              <Text
                style={[styles.sectionSubtitle, { color: colors.textLight }]}
              >
                Enter your new 6-digit MPIN
              </Text>

              {/* Hidden TextInput for PIN */}
              <TextInput
                ref={pinInputRef}
                style={styles.hiddenInput}
                value={pin}
                onChangeText={handlePinChange}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry={true}
                onFocus={() => setActiveInput("pin")}
              />

              <View style={styles.pinDotsContainer}>{renderPinDots(pin)}</View>

              {/* Tap to enter text */}
              <Text style={[styles.tapText, { color: colors.textLight }]}>
                Tap to enter MPIN
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            {/* Confirm PIN Section */}
            <TouchableOpacity
              style={[
                styles.pinSection,
                {
                  borderColor:
                    activeInput === "confirmPin"
                      ? colors.primary
                      : "transparent",
                  opacity: pin.length === 6 ? 1 : 0.5,
                },
                activeInput === "confirmPin" && {
                  backgroundColor: colors.primary + "10",
                },
              ]}
              onPress={focusConfirmPinInput}
              activeOpacity={0.8}
              disabled={pin.length !== 6}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.labelContainer}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={colors.textLight}
                  />
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>
                    Verify MPIN
                  </Text>
                </View>
                <Text
                  style={[styles.pinLengthText, { color: colors.textLight }]}
                >
                  {confirmPin.length}/6 digits
                </Text>
              </View>

              <Text
                style={[styles.sectionSubtitle, { color: colors.textLight }]}
              >
                Verify your new 6-digit MPIN
              </Text>

              {/* Hidden TextInput for Confirm PIN */}
              <TextInput
                ref={confirmPinInputRef}
                style={styles.hiddenInput}
                value={confirmPin}
                onChangeText={handleConfirmPinChange}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry={true}
                onFocus={() => setActiveInput("confirmPin")}
                editable={pin.length === 6}
              />

              <View style={styles.pinDotsContainer}>
                {renderPinDots(confirmPin)}
              </View>

              {/* Validation Message */}
              {confirmPin.length === 6 && pin !== confirmPin && (
                <View style={styles.validationMessage}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.danger}
                  />
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    MPINs do not match
                  </Text>
                </View>
              )}

              {confirmPin.length === 6 && pin === confirmPin && (
                <View style={styles.validationMessage}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.success}
                  />
                  <Text style={[styles.successText, { color: colors.success }]}>
                    MPINs match
                  </Text>
                </View>
              )}

              {pin.length !== 6 && (
                <Text
                  style={[styles.disabledText, { color: colors.textLight }]}
                >
                  Complete new MPIN first
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Security Tips */}
          <View
            style={[
              styles.securityTips,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.securityTitle, { color: colors.text }]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.success}
              />{" "}
              Security Tips:
            </Text>

            <View style={styles.tipItem}>
              <View
                style={[styles.tipBullet, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.tipText, { color: colors.textLight }]}>
                Use a unique 6-digit MPIN
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View
                style={[styles.tipBullet, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.tipText, { color: colors.textLight }]}>
                Avoid sequences like 123456 or 111111
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View
                style={[styles.tipBullet, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.tipText, { color: colors.textLight }]}>
                Don't use your birthdate or phone number
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View
                style={[styles.tipBullet, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.tipText, { color: colors.textLight }]}>
                Never share your MPIN with anyone
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.success,
                shadowColor: effectiveMode === "dark" ? "transparent" : "#000",
              },
              (pin.length !== 6 ||
                confirmPin.length !== 6 ||
                pin !== confirmPin ||
                loading) && [
                styles.submitButtonDisabled,
                { backgroundColor: colors.gray },
              ],
            ]}
            onPress={handleSubmit}
            disabled={
              pin.length !== 6 ||
              confirmPin.length !== 6 ||
              pin !== confirmPin ||
              loading
            }
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color={colors.white} />
                <Text
                  style={[styles.submitButtonText, { color: colors.white }]}
                >
                  Change MPIN
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={colors.textLight}
            />
            <Text style={[styles.footerText, { color: colors.textLight }]}>
              For security reasons, you'll need to login again with your new
              MPIN
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
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
    width: 44,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  instructionContainer: {
    marginBottom: 30,
    paddingTop: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  pinContainer: {
    borderRadius: 20,
    padding: 0,
    marginBottom: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  pinSection: {
    padding: 20,
    borderRadius: 0,
    borderWidth: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  pinDotsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  pinDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  pinDotText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  pinLengthText: {
    fontSize: 12,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  tapText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  validationMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  successText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  disabledText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  securityTips: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  tipText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 10,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    marginLeft: 6,
    fontStyle: "italic",
  },
});
