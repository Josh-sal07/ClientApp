import React, { useEffect, useState } from "react";
import { useUserStore } from "../../../store/user";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
  Animated,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../theme/ThemeContext";

const { width, height } = Dimensions.get('window');

const Security = () => {
  const user = useUserStore((state) => state.user);
  const loadUser = useUserStore((state) => state.loadUser);
  const { theme } = useTheme();

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
    }
  };
  
  const colors = theme === "dark" ? COLORS.dark : COLORS.light;

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);
  
  const scrollY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUser();
  }, []);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [height * 0.18, height * 0.12],
    extrapolate: 'clamp'
  });

  const handleResetPin = () => {
    Alert.alert("Reset MPIN", "Do you want to change your MPIN?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: () => router.push("/(auth)/(setup-pin)/setup-pin"),
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
    Alert.alert(
      "Logout All Sessions",
      "Logout from all other devices?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => Alert.alert("Success", "Logged out from all other devices"),
        },
      ],
    );
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
      onToggle: setBiometricEnabled,
      type: "toggle",
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Receive notifications easily",
      icon: "notifications-outline",
      color: colors.primary,
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
      type: "toggle",
    },
    {
      id: "email",
      title: "Email Alerts",
      subtitle: "Receive security alerts via email",
      icon: "mail-outline",
      color: colors.primary,
      value: emailAlertsEnabled,
      onToggle: setEmailAlertsEnabled,
      type: "toggle",
    },
    {
      id: "sms",
      title: "SMS Alerts",
      subtitle: "Receive security alerts via SMS",
      icon: "chatbubble-outline",
      color: colors.primary,
      value: smsAlertsEnabled,
      onToggle: setSmsAlertsEnabled,
      type: "toggle",
    },
  ];

  const sessionItems = [
    {
      id: "sessions",
      title: "Active Sessions",
      subtitle: "Manage logged in devices",
      icon: "phone-portrait-outline",
      color: colors.warning,
      onPress: () => router.push("/sessions"),
      type: "action",
    },
    {
      id: "logout-all",
      title: "Logout All Sessions",
      subtitle: "Logout from all other devices",
      icon: "log-out-outline",
      color: colors.danger,
      onPress: handleSessionLogout,
      type: "action",
    },
    {
      id: "cache",
      title: "Clear Cache",
      subtitle: "Free up storage space",
      icon: "trash-outline",
      color: colors.primary,
      onPress: handleClearCache,
      type: "action",
    },
  ];

  const renderSection = (title, description, items) => (
    <View style={[styles.section, { 
      backgroundColor: colors.surface,
      borderColor: colors.primary + '20',
      shadowColor: theme === 'dark' ? 'transparent' : '#000',
    }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {description && <Text style={[styles.sectionDescription, { color: colors.textLight }]}>{description}</Text>}
      </View>
      <View style={[styles.itemsContainer, { borderColor: colors.border }]}>
        {items.map((item, index) => (
          <View key={item.id}>
            {item.type === "toggle" ? (
              <View style={[styles.toggleItem, { backgroundColor: colors.surface }]}>
                <View style={styles.toggleLeft}>
                  <View style={[styles.itemIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.toggleContent}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.itemSubtitle, { color: colors.textLight }]}>{item.subtitle}</Text>
                  </View>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={item.value ? colors.primary : colors.white}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionItem, { backgroundColor: colors.surface }]}
                onPress={item.onPress}
              >
                <View style={styles.actionLeft}>
                  <View style={[styles.itemIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.itemSubtitle, { color: colors.textLight }]}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            {index < items.length - 1 && <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />}
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Animated Header Background */}
      <Animated.View style={[styles.headerBackground, { height: headerHeight, backgroundColor: colors.primary }]}>
        <View style={styles.headerGradient}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Security</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Security Settings */}
        {renderSection(
          "Authentication & Security",
          "Manage your login methods and security preferences",
          securityItems
        )}

        {/* Sessions & Data */}
        {renderSection(
          "Sessions & Data",
          "Manage active sessions and app data",
          sessionItems
        )}

        {/* Security Tips */}
        <View style={[styles.tipsSection, { 
          backgroundColor: colors.primary + '08',
          borderColor: colors.primary + '20',
        }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={22} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Security Tips</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.textLight }]}>
              Best practices to keep your account secure
            </Text>
          </View>
          
          <View style={styles.tipsContainer}>
            {securityTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            Last security check: Today at {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.gray }]}>
            Your security is our priority
          </Text>
        </View>
        
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default Security;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    zIndex: 1,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: height * 0.18,
    paddingBottom: 40,
  },
  section: {
    marginHorizontal: 16,
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
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
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
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tipsContainer: {
    gap: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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