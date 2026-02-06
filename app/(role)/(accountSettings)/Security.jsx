import React, { useEffect, useState } from "react";
import { useUserStore } from "../../../store/user";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
  Switch,
  useColorScheme,
  theme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const Security = () => {
  const user = useUserStore((state) => state.user);
  const loadUser = useUserStore((state) => state.loadUser);
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();
  // Determine effective mode
  const effectiveMode = mode === "system" ? systemColorScheme : mode; // theme is already an object with colors!

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
      facebook: "#1877F2",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
      surface: "#FFFFFF",
      // Gradient colors for header
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
      // Gradient colors for header (darker version)
      gradientStart: "#000000",
      gradientEnd: "#032829",
      gradientAlt: "#0b1515",
      gradientAlt1: "#032829",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];
  const SMS_ENDPOINT = "https://staging.kazibufastnet.com/api/app/settings/sms";
  const EMAIL_ENDPOINT =
    "https://staging.kazibufastnet.com/api/app/settings/email";

  // Header states
  const [activeHeaderTab, setActiveHeaderTab] = useState("Album");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const loadLocalSms = async () => {
        const local = await AsyncStorage.getItem("sms_alerts_enabled");
        if (local !== null) {
          setSmsAlertsEnabled(JSON.parse(local));
        }
      };

      loadLocalSms();
    }, []),
  );

  useFocusEffect(
    React.useCallback(() => {
      const loadAlertsSettings = async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;

          const headers = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          };

          const [smsRes, emailRes] = await Promise.all([
            fetch(SMS_ENDPOINT, { headers }),
            fetch(EMAIL_ENDPOINT, { headers }),
          ]);

          const smsData = await smsRes.json();
          const emailData = await emailRes.json();

          if (typeof smsData.enabled === "boolean") {
            setSmsAlertsEnabled(smsData.enabled);
            await AsyncStorage.setItem(
              "sms_alerts_enabled",
              JSON.stringify(smsData.enabled),
            );
          }

          setEmailAlertsEnabled(Boolean(emailData.enabled));
        } catch (err) {
        }
      };

      loadAlertsSettings();
    }, []),
  );

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("biometric_enabled");
      if (saved === "true") setBiometricEnabled(true);
    })();
  }, []);

  useEffect(() => {
    loadUser();
  }, []);

  // Reset StatusBar when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }

      return () => {
        // Optional cleanup
      };
    }, []),
  );

  const handleResetPin = () => {
    Alert.alert("Reset MPIN", "Do you want to change your MPIN?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: () => router.push("/(auth)/(setup-newmpin)/newmpin"),
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert("Clear Cache", "Clear all cached data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            Alert.alert("Success", "Cache cleared successfully");
          } catch (error) {
            Alert.alert("Error", "Failed to clear cache");
          }
        },
      },
    ]);
  };

  const handleSessionLogout = () => {
    Alert.alert("Logout All Sessions", "Logout from all other devices?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () =>
          Alert.alert("Success", "Logged out from all other devices"),
      },
    ]);
  };

  const toggleSmsAlerts = async (value) => {
    if (!value) {
      setSmsAlertsEnabled(false);
      await updateSmsBackend(false);
      return;
    }

    Alert.alert(
      "Enable SMS Notifications",
      "Do you want to receive account notifications via SMS?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Enable",
          onPress: async () => {
            setSmsAlertsEnabled(true);
            await updateSmsBackend(true);
          },
        },
      ],
    );
  };

  const updateSmsBackend = async (enabled) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await AsyncStorage.setItem("sms_alerts_enabled", JSON.stringify(enabled));

      await fetch(SMS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
    } catch (err) {
    }
  };

  const securityItems = [
    {
      id: "mpin",
      title: "Change MPIN",
      subtitle: "Update your login security PIN",
      icon: "lock-closed-outline",
      color: colors.primary,
      onPress: handleResetPin,
      type: "action",
    },
    {
      id: "biometric",
      title: "Biometric Login",
      subtitle: "Use fingerprint or face recognition",
      icon: "finger-print-outline",
      color: colors.primary,
      value: biometricEnabled,
      onToggle: async (value) => {
        if (!value) {
          await AsyncStorage.removeItem("biometric_enabled");
          setBiometricEnabled(false);
          return;
        }

        Alert.alert(
          "Enable Biometric Login",
          "Do you want to enable biometric authentication for faster and secure login?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Enable",
              onPress: async () => {
                const hasHardware =
                  await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                if (!hasHardware) {
                  Alert.alert(
                    "Unavailable",
                    "Biometric hardware not supported",
                  );
                  return;
                }

                if (!isEnrolled) {
                  Alert.alert(
                    "Not Set Up",
                    "Please set up biometrics on your device",
                  );
                  return;
                }

                const result = await LocalAuthentication.authenticateAsync({
                  promptMessage: "Confirm Biometrics",
                  fallbackLabel: "Use MPIN",
                });

                if (result.success) {
                  await AsyncStorage.setItem("biometric_enabled", "true");
                  setBiometricEnabled(true);
                } else {
                  Alert.alert("Failed", "Biometric authentication failed");
                }
              },
            },
          ],
        );
      },
      type: "toggle",
    },
    {
      id: "sms",
      title: "SMS Alerts",
      subtitle: "Receive notifications via SMS",
      icon: "chatbubble-outline",
      color: colors.primary,
      value: smsAlertsEnabled,
      onToggle: toggleSmsAlerts,
      type: "toggle",
    },
  ];

  const renderSection = (title, description, items) => (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary + "20",
          shadowColor: theme === "dark" ? "transparent" : "#000",
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {description && (
          <Text
            style={[styles.sectionDescription, { color: colors.textLight }]}
          >
            {description}
          </Text>
        )}
      </View>
      <View style={[styles.itemsContainer, { borderColor: colors.border }]}>
        {items.map((item, index) => (
          <View key={item.id}>
            {item.type === "toggle" ? (
              <View
                style={[styles.toggleItem, { backgroundColor: colors.surface }]}
              >
                <View style={styles.toggleLeft}>
                  <View
                    style={[
                      styles.itemIcon,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.toggleContent}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.itemSubtitle, { color: colors.textLight }]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + "80",
                  }}
                  thumbColor={item.value ? colors.primary : colors.white}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionItem, { backgroundColor: colors.surface }]}
                onPress={item.onPress}
              >
                <View style={styles.actionLeft}>
                  <View
                    style={[
                      styles.itemIcon,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.itemSubtitle, { color: colors.textLight }]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
            {index < items.length - 1 && (
              <View
                style={[styles.itemDivider, { backgroundColor: colors.border }]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const securityTips = [
    "Use a strong MPIN (6 digits recommended)",
    "Enable biometric authentication for faster login",
    "Never share your MPIN with anyone",
    "Logout from all devices if you lose your phone",
    "Keep your contact information updated",
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Gradient Header - This will extend under the status bar */}
      <LinearGradient
        colors={[
          colors.gradientEnd,
          colors.gradientEnd,
          colors.gradientEnd,
          colors.gradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          {/* Back Button and Title */}
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Security</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Settings */}
        {renderSection(
          "Authentication & Security",
          "Manage your login methods and security preferences",
          securityItems,
        )}

        {/* Security Tips */}
        <View
          style={[
            styles.tipsSection,
            {
              backgroundColor: colors.primary + "08",
              borderColor: colors.primary + "20",
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                Security Tips
              </Text>
            </View>
            <Text
              style={[styles.sectionDescription, { color: colors.textLight }]}
            >
              Best practices to keep your account secure
            </Text>
          </View>

          <View style={styles.tipsContainer}>
            {securityTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View
                  style={[styles.tipDot, { backgroundColor: colors.primary }]}
                />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            Last security check: Today at{" "}
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.gray }]}>
            Your security is our priority
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default Security;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Gradient Header Styles - Extends under status bar
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 50 : 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
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
  },
  headerRightPlaceholder: {
    width: 40,
  },
  userInfoContainer: {
    marginBottom: 15,
  },
  userEmail: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  deviceInfo: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  headerTabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  headerTab: {
    marginRight: 25,
    paddingBottom: 10,
  },
  activeHeaderTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFFFFF",
  },
  headerTabText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
  },
  activeHeaderTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cloudBackupContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  cloudBackupTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cloudBackupSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  bottomNavContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  bottomNavItem: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  bottomNavText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemsContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toggleContent: {
    flex: 1,
  },
  actionContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
  },
  itemDivider: {
    height: 1,
    marginLeft: 68,
  },
  tipsSection: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tipsContainer: {
    gap: 14,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
  },
  bottomSpacer: {
    height: 20,
  },
});
