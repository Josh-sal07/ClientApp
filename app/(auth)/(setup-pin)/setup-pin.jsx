// setup-pin.js
import React, {useEffect} from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./setup-pin.css.js";
import useSetupPinLogic from "./setup-pin-logic.js";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import CustomAlert from "../../../components/CustomAlert";
import { useTheme } from "../../../theme/ThemeContext";

export default function SetupPinScreen({ route }) {
  
  const router = useRouter();
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();

  // Get phone number from route params
  const { phone } = useLocalSearchParams();
  
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
      statusBg: "#F8F9FA",
      successBg: "#E8F5E9",
      errorBg: "#FFEBEE",
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
      statusBg: "#2A2A2A",
      successBg: "#1E3A2E",
      errorBg: "#3A2A2A",
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

  const {
    alertConfig,
    setAlertConfig,
    pin,
    confirmPin,
    loading,
    showPin,
    showConfirmPin,
    pinRefs,
    confirmPinRefs,
    setShowPin,
    setShowConfirmPin,
    handlePinChange,
    handlePinKeyPress,
    handleSubmit,
    handleSetupPinSubmit,
  } = useSetupPinLogic(phone);

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
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { backgroundColor: "transparent" }]}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/images/kazi.png")}
                style={styles.logo}
              />
            </View>

            <Text style={[styles.title, { color: colors.white }]}>
              Create Your PIN
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Create a 6-digit PIN for secure access to your account
            </Text>

            {/* PIN Inputs */}
            <View style={styles.pinContainer}>
              {/* Enter PIN */}
              <View style={styles.pinSection}>
                <View style={styles.pinHeader}>
                  <Text style={[styles.pinLabel, { color: colors.white }]}>
                    Enter 6-digit PIN
                  </Text>
                  <TouchableOpacity
                    style={[styles.visibilityButton, { backgroundColor: colors.lightGray }]}
                    onPress={() => setShowPin(!showPin)}
                  >
                    <Text style={[styles.visibilityButtonText, { color: colors.primary }]}>
                      {showPin ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.pinInputsContainer}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                      key={`pin-${index}`}
                      ref={(ref) => (pinRefs.current[index] = ref)}
                      style={[
                        styles.pinInput,
                        { 
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.border,
                          color: colors.inputText,
                        },
                        pin[index] && { 
                          borderColor: colors.primary,
                        },
                      ]}
                      value={showPin ? pin[index] : pin[index] ? "•" : ""}
                      onChangeText={(value) => handlePinChange(index, value, false)}
                      onKeyPress={(e) => handlePinKeyPress(index, e, false)}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!loading}
                      selectTextOnFocus
                      textAlign="center"
                      autoFocus={index === 0 && pin[0] === ""}
                      selectionColor={colors.primary}
                      placeholderTextColor={colors.placeholder}
                    />
                  ))}
                </View>
              </View>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              {/* Confirm PIN */}
              <View style={styles.pinSection}>
                <View style={styles.pinHeader}>
                  <Text style={[styles.pinLabel, { color: colors.white }]}>
                    Confirm 6-digit PIN
                  </Text>
                  <TouchableOpacity
                    style={[styles.visibilityButton, { backgroundColor: colors.lightGray }]}
                    onPress={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    <Text style={[styles.visibilityButtonText, { color: colors.primary }]}>
                      {showConfirmPin ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.pinInputsContainer}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                      key={`confirm-${index}`}
                      ref={(ref) => (confirmPinRefs.current[index] = ref)}
                      style={[
                        styles.pinInput,
                        { 
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.border,
                          color: colors.inputText,
                        },
                        confirmPin[index] && { 
                          borderColor: colors.primary,
                        },
                        pin.join("") === confirmPin.join("") &&
                          confirmPin[index] && { 
                            borderColor: colors.success,
                          },
                      ]}
                      value={
                        showConfirmPin
                          ? confirmPin[index]
                          : confirmPin[index]
                          ? "•"
                          : ""
                      }
                      onChangeText={(value) => handlePinChange(index, value, true)}
                      onKeyPress={(e) => handlePinKeyPress(index, e, true)}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!loading}
                      selectTextOnFocus
                      textAlign="center"
                      selectionColor={colors.primary}
                      placeholderTextColor={colors.placeholder}
                    />
                  ))}
                </View>
              </View>

              {/* Status */}
              <View style={[styles.statusContainer, { backgroundColor: colors.statusBg }]}>
                {pin.join("").length === 6 && confirmPin.join("").length === 6 ? (
                  pin.join("") === confirmPin.join("") ? (
                    <Text style={[styles.statusTextSuccess, { color: colors.success }]}>
                      ✓ PINs match
                    </Text>
                  ) : (
                    <Text style={[styles.statusTextError, { color: colors.danger }]}>
                      ✗ PINs don't match
                    </Text>
                  )
                ) : (
                  <Text style={[styles.statusText, { color: colors.helper }]}>
                    Enter 6-digit PIN in both fields
                  </Text>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary },
                loading && styles.buttonDisabled,
                (pin.join("").length !== 6 || confirmPin.join("").length !== 6) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                loading ||
                pin.join("").length !== 6 ||
                confirmPin.join("").length !== 6
              }
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Set PIN</Text>
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
              setAlertConfig(prev => ({ ...prev, visible: false }));
            }}
            onClose={() =>
              setAlertConfig(prev => ({ ...prev, visible: false }))
            }
          />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}