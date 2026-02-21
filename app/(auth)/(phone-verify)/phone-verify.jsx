// phone-verify.js
import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./phone-verify.css.js";
import usePhoneVerifyLogic from "./phone-verify-logic.js";
import CustomAlert from "../../../components/CustomAlert";
import { useTheme } from "../../../theme/ThemeContext";

export default function PhoneVerifyScreen() {
  const router = useRouter();
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();
  const [hasExistingPhone, setHasExistingPhone] = useState(false);

  const {
    alertConfig,
    setAlertConfig,
    phone,
    setPhone,
    loading,
    formatPhone,
    handleSendOtp,
    handleSignIn,
  } = usePhoneVerifyLogic();

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

  // Load existing phone on mount
  // useEffect(() => {
  //   const loadExistingPhone = async () => {
  //     try {
  //       // Check for user_phone (from RootLayout logic)
  //       const savedPhone = await AsyncStorage.getItem("user_phone");
  //       if (savedPhone) {
  //         setPhone(savedPhone);
  //       }

  //       // Also clear any temporary data
  //       await AsyncStorage.removeItem("temp_phone");
  //     } catch (error) {
  //       console.error("Error loading phone:", error);
  //     }
  //   };

  //   loadExistingPhone();
  // }, []);

  useEffect(() => {
  const loadExistingPhone = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem("user_phone");

      if (savedPhone) {
        setPhone(savedPhone);
        setHasExistingPhone(true); // ✅ Enable Sign In
      } else {
        setHasExistingPhone(false); // ❌ Disable Sign In
      }

      await AsyncStorage.removeItem("temp_phone");
    } catch (error) {
      console.error("Error loading phone:", error);
      setHasExistingPhone(false);
    }
  };

  loadExistingPhone();
}, []);


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
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[styles.container, { backgroundColor: "transparent" }]}
            >
              <Image
                source={require("../../../assets/images/kazi.png")}
                style={styles.logo}
              />

              <Text style={[styles.title, { color: colors.white }]}>
                Verify Phone Number
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.countryCode, { color: colors.text }]}>
                  +63
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder="9XXXXXXXXX"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  value={formatPhone(phone)}
                  onChangeText={(t) =>
                    setPhone(t.replace(/\D/g, "").slice(0, 10))
                  }
                  maxLength={13}
                  autoFocus={!phone}
                />
              </View>

              <Text style={[styles.helper, { color: colors.text }]}>
                Enter 10-digit number starting with 9 (e.g. 9123456789)
              </Text>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  (loading || phone.length !== 10) && styles.buttonDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={loading || phone.length !== 10}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signInContainer}>
                <Text style={[styles.signInText, { color: colors.text }]}>
                  Already have an account?{" "}
                  <Text
                    style={[
                      styles.signInLink,
                      {
                        color: hasExistingPhone ? colors.primary : colors.gray,
                        opacity: hasExistingPhone ? 1 : 0.5,
                      },
                    ]}
                    onPress={hasExistingPhone ? handleSignIn : null}
                  >
                    Sign In
                  </Text>
                </Text>
              </View>
            </View>

            <CustomAlert
              visible={alertConfig.visible}
              title={alertConfig.title}
              message={alertConfig.message}
              type={alertConfig.type}
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
