import React from "react";
import {
  Dimensions,
  ActivityIndicator,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLoginLogic } from "./login-logic.js";
import styles from "./login.css.js";
import CustomAlert from "../../../components/CustomAlert";
import { useTheme } from "../../../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const scaleSize = (size) => {
  const baseWidth = 375;
  const scale = width / baseWidth;
  return Math.round(size * Math.min(scale, 1.3));
};

export default function MpinLoginScreen() {
  const {
    alertConfig,
    setAlertConfig,
    phoneNumber,
    mpin,
    currentPosition,
    isVerifying,
    shakeAnimation,
    message,
    hasEnteredNumber,
    handleKeyPress,
    handleForgotMpin,
    handleChangeNumber,
    resetMpin,
    isLoading,
    isBiometricAvailable,
    handleBiometricLogin,
  } = useLoginLogic();

  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();

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
        "#F5F8FA", // Lighter at top
      ];
    }
  };

  const renderKeypad = () => {
    const numbers = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [null, 0, hasEnteredNumber ? "⌫" : null],
    ];

    const keySize = Math.min(Math.max(width * 0.18, 60), 85);
    const keySpacing = Math.min(width * 0.05, 20);
    const isKeypadDisabled = isVerifying;

    return (
      <View style={[styles.keypadContainer, { marginBottom: scaleSize(20) }]}>
        {numbers.map((row, rowIndex) => (
          <View
            key={`row-${rowIndex}`}
            style={[styles.keypadRow, { marginBottom: keySpacing }]}
          >
            {row.map((item, colIndex) => {
              if (item === null) {
                return (
                  <View
                    key={`empty-${colIndex}`}
                    style={[
                      styles.keypadKeyEmpty,
                      { width: keySize, height: keySize },
                    ]}
                  />
                );
              }

              const isBackspace = item === "⌫";
              return (
                <TouchableOpacity
                  key={`key-${item}`}
                  style={[
                    styles.keypadKey,
                    isBackspace && styles.keypadKeyBackspace,
                    isKeypadDisabled && styles.keypadKeyDisabled,
                    {
                      width: keySize,
                      height: keySize,
                      borderRadius: keySize / 2,
                      backgroundColor: isBackspace
                        ? colors.lightGray
                        : colors.white,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => !isKeypadDisabled && handleKeyPress(item)}
                  onLongPress={() => {
                    if (!isKeypadDisabled && isBackspace) {
                      resetMpin();
                    }
                  }}
                  disabled={isKeypadDisabled}
                >
                  {isBackspace ? (
                    <Text
                      style={[
                        styles.keypadKeyTextBackspace,
                        { fontSize: scaleSize(22), color: colors.gray },
                        isKeypadDisabled && styles.keypadKeyTextDisabled,
                      ]}
                    >
                      ⌫
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.keypadKeyText,
                        { fontSize: scaleSize(26), color: colors.dark },
                        isKeypadDisabled && styles.keypadKeyTextDisabled,
                      ]}
                    >
                      {item}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderMpinDots = () => {
    const dotSize = scaleSize(20);
    const dotSpacing = scaleSize(20);

    return (
      <View
        style={[
          styles.mpinDotsContainer,
          { gap: dotSpacing },
          shakeAnimation && styles.shakeAnimation,
        ]}
      >
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <View key={`dot-${index}`} style={styles.mpinDotContainer}>
            {isVerifying ? (
              <View
                style={[
                  styles.skeletonDot,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: colors.gray + "60",
                  },
                ]}
              />
            ) : (
              <>
                <View
                  style={[
                    styles.mpinDot,
                    mpin[index] && styles.mpinDotFilled,
                    {
                      width: dotSize,
                      height: dotSize,
                      borderRadius: dotSize / 2,
                      borderColor: mpin[index] ? colors.primary : colors.border,
                      backgroundColor: mpin[index]
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {mpin[index] && (
                    <View
                      style={[
                        styles.mpinDotInner,
                        {
                          width: dotSize * 0.4,
                          height: dotSize * 0.4,
                          borderRadius: dotSize * 0.2,
                          backgroundColor: colors.white,
                        },
                      ]}
                    />
                  )}
                </View>
                {index === currentPosition &&
                  currentPosition < 6 &&
                  !isLoading && (
                    <View
                      style={[
                        {
                          width: scaleSize(2),
                          height: scaleSize(4),
                          bottom: scaleSize(-8),
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  )}
              </>
            )}
          </View>
        ))}
      </View>
    );
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
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: "transparent" }]}
        >
          <View style={styles.container}>
            <View style={{ flex: height < 700 ? 0.05 : 0.1 }} />

            <View
              style={[styles.logoContainer, { marginBottom: scaleSize(20) }]}
            >
              <Image
                source={require("../../../assets/images/kazi.png")}
                style={[
                  styles.logo,
                  {
                    width: scaleSize(100),
                    height: scaleSize(100),
                  },
                ]}
                resizeMode="contain"
              />
              <View style={styles.logoTextContainer}>
                <Text
                  style={[
                    styles.appName,
                    { fontSize: scaleSize(22), color: colors.text },
                  ]}
                >
                  KAZIBUFAST
                </Text>
              </View>
            </View>

            {/* Phone Number Section */}
            <View
              style={[styles.phoneSection, { marginBottom: scaleSize(30) }]}
            >
              {phoneNumber ? (
                <Text
                  style={[
                    styles.phoneNumber,
                    { fontSize: scaleSize(18), color: colors.white },
                  ]}
                >
                  +63{phoneNumber || AsyncStorage.getItem("phone")}
                </Text>
              ) : (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
              <TouchableOpacity
                onPress={handleChangeNumber}
                disabled={isVerifying}
              >
                <Ionicons
                  name="create-outline"
                  size={scaleSize(22)}
                  color={isVerifying ? colors.gray : colors.white}
                />
              </TouchableOpacity>
            </View>

            {/* MPIN Input Section */}
            <View
              style={[styles.mpinContainer, { marginBottom: scaleSize(40) }]}
            >
              <Text
                style={[
                  styles.securityWarning,
                  {
                    fontSize: scaleSize(16),
                    marginBottom: scaleSize(30),
                    color: colors.white,
                  },
                ]}
                id="message"
              >
                {message || "Enter your MPIN to log in."}
              </Text>

              {/* Skeleton loading overlay when verifying */}
              {isVerifying && (
                <View
                  style={[
                    styles.verifyingOverlay,
                  ]}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.verifyingText, { color: colors.white }]}>
                    Verifying MPIN...
                  </Text>
                </View>
              )}

              {renderMpinDots()}
            </View>

            <View style={styles.keypadWrapper}>{renderKeypad()}</View>

            <View
              style={[
                styles.bottomSection,
                {
                  marginTop: height < 700 ? scaleSize(10) : scaleSize(20),
                },
              ]}
            >
              <TouchableOpacity
                style={styles.forgotMpinButton}
                onPress={handleForgotMpin}
                activeOpacity={0.7}
                disabled={isVerifying}
              >
                <Text
                  style={[
                    styles.forgotMpinText,
                    { fontSize: scaleSize(16), color: colors.primary },
                    isVerifying && { color: colors.gray },
                  ]}
                >
                  Forgot MPIN?
                </Text>
              </TouchableOpacity>
            </View>

            {isBiometricAvailable && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                activeOpacity={0.8}
                style={{
                  marginTop: scaleSize(20),
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: scaleSize(12),
                  borderRadius: 50,
                  backgroundColor: colors.primary,
                  flexDirection: "row",
                  maxWidth: 250,
                  left:55,
                  gap: 8,
                }}
              >
                <Ionicons
                  name="finger-print"
                  size={scaleSize(22)}
                  color={colors.white}
                />
                <Text
                  style={{
                    color: colors.white,
                    fontSize: scaleSize(16),
                    fontWeight: "600",
                  }}
                >
                  Use Biometrics
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ flex: height < 700 ? 0.05 : 0.1 }} />

            <CustomAlert
              visible={alertConfig.visible}
              title={alertConfig.title}
              message={alertConfig.message}
              type={alertConfig.type}
              confirmText="OK"
              cancelText="Cancel"
              onConfirm={() => {
                alertConfig.onConfirm?.();
                setAlertConfig((prev) => ({ ...prev, visible: false }));
              }}
              onClose={() =>
                setAlertConfig((prev) => ({ ...prev, visible: false }))
              }
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

export { MpinLoginScreen };
