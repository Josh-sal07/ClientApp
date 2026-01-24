import React from "react";
import {
  Alert,
  Dimensions,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLoginLogic } from "./login-logic.js";
import styles from "./login.css.js";

const { width, height } = Dimensions.get("window");

const scaleSize = (size) => {
  const baseWidth = 375;
  const scale = width / baseWidth;
  return Math.round(size * Math.min(scale, 1.3));
};

export default function MpinLoginScreen() {
  const {
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
  } = useLoginLogic();

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
                        { fontSize: scaleSize(22) },
                        isKeypadDisabled && styles.keypadKeyTextDisabled,
                      ]}
                    >
                      ⌫
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.keypadKeyText,
                        { fontSize: scaleSize(26) },
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#00AFA1" barStyle="light-content" />

      <View style={styles.container}>
        <View style={{ flex: height < 700 ? 0.05 : 0.1 }} />

        <View style={[styles.logoContainer, { marginBottom: scaleSize(20) }]}>
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
            <Text style={[styles.appName, { fontSize: scaleSize(22) }]}>
              KAZIBUFAST
            </Text>
          </View>
        </View>

        {/* Phone Number Section */}
        <View style={[styles.phoneSection, { marginBottom: scaleSize(30) }]}>
          {phoneNumber ? (
            <Text style={[styles.phoneNumber, { fontSize: scaleSize(18) }]}>
              +63{phoneNumber ||  AsyncStorage.getItem("phone")}
            </Text>
          ) : (
            <ActivityIndicator size="small" color="#00AFA1" />
          )}
          <TouchableOpacity onPress={handleChangeNumber} disabled={isVerifying}>
            <Ionicons
              name="create-outline"
              size={scaleSize(22)}
              color={isVerifying ? "#666" : "#00AFA1"}
            />
          </TouchableOpacity>
        </View>

        {/* MPIN Input Section */}
        <View style={[styles.mpinContainer, { marginBottom: scaleSize(40) }]}>
          <Text
            style={[
              styles.securityWarning,
              {
                fontSize: scaleSize(16),
                marginBottom: scaleSize(30),
              },
            ]}
            id="message"
          >
            {message || "Enter your MPIN to log in."}
          </Text>

          {/* Skeleton loading overlay when verifying */}
          {isVerifying && (
            <View style={styles.verifyingOverlay}>
              <ActivityIndicator size="large" color="#00AFA1" />
              <Text style={styles.verifyingText}>Verifying MPIN...</Text>
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
                { fontSize: scaleSize(16) },
                isVerifying && styles.disabledText,
              ]}
            >
              Forgot MPIN?
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: height < 700 ? 0.05 : 0.1 }} />
      </View>
    </SafeAreaView>
  );
}

export { MpinLoginScreen };
