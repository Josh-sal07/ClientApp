import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setToken } from "../../../../store/token";
import { useUserStore } from "../../../../store/user";
import { useTheme } from "../../../../theme/ThemeContext";
import axios from "axios";

// API endpoints
const API_PROFILE_URL = "https://staging.kazibufastnet.com/api/app/profile";

function Profile() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();

  // Determine effective mode
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  // Colors for both light and dark mode
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
    },
    dark: {
      primary: "#35958d",
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
    },
  };

  const colors = effectiveMode === "dark" ? COLORS.dark : COLORS.light;

  // Fetch profile data
  const fetchProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Authentication required");
        return;
      }

      const response = await axios.get(API_PROFILE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        timeout: 10000,
      });

      if (response.data && response.data.success) {
        const data = response.data.data;
        setProfileData(data);

        // Update user store with latest data
        if (data.name || data.email || data.contactNumber || data.mobile) {
          setUser({
            ...user,
            name: data.name || user.name,
            email: data.email || user.email,
            contactNumber:
              data.contactNumber || data.mobile || user.contactNumber,
          });
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please login again");
        handleLogout();
      } else if (error.code === "ECONNABORTED") {
        Alert.alert("Timeout", "Please check your internet connection");
      } else {
        Alert.alert("Error", "Failed to load profile data");
      }
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProfileData();
      setLoading(false);
    };
    loadData();
  }, []);

  // Handle account settings navigation
  const handleAccountSettings = () => {
    router.push({
      pathname: "/(role)/(accountSettings)/AccountSettings",
      params: { profileData: JSON.stringify(profileData || user) },
    });
  };

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Get the current phone number first
            const phone = await AsyncStorage.getItem("phone");

            // Only remove token and user session data
            // DO NOT remove pin_set or phone!
            await AsyncStorage.multiRemove([
              "token",
              "last_active_time",
              "biometric_verified_session"
            ]);

            setToken(null);

            // Go to phone verification (not login)
            router.replace("/(auth)/(login)/login");
          } catch (error) {
            Alert.alert("Error", "Failed to logout properly");
          }
        },
      },
    ]);
  };

  // Format mobile number for display
  const formatMobileNumber = (number) => {
    if (!number) return "Mobile number not available";

    // Remove non-digits
    const digits = number.replace(/\D/g, "");

    // Get last 4 digits safely
    const last4 = digits.slice(-4);

    // PH numbers usually have 10–12 digits
    if (digits.length >= 10) {
      return `+63 ••• ••• ${last4}`;
    }

    // Fallback
    return `•••• ${last4}`;
  };

  const menuItems = [
    {
      id: "account",
      title: "Account Settings",
      icon: "person-outline",
      onPress: handleAccountSettings,
    },
    {
      id: "app",
      title: "App Settings",
      icon: "settings-outline",
      route: "/(role)/(accountSettings)/settings",
    },
    {
      id: "about",
      title: "About",
      icon: "information-circle-outline",
      route: "/(role)/(accountSettings)/AboutKazibufast",
    },
    {
      id: "support",
      title: "Help & Support",
      icon: "chatbubble-ellipses-outline",
      route: "/(role)/(accountSettings)/HelpSupport",
    },
    {
      id: "security",
      title: "Security",
      icon: "shield-checkmark-outline",
      route: "/(role)/(accountSettings)/Security",
    },
  ];

  // Get mobile number from profile data or user store
  const mobileNumber = user?.mobile_number;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
        <View style={styles.nameContainer}>
          <Text style={[styles.userName, { color: colors.white }]}>
            {loading
              ? "LOADING..."
              : (profileData?.name || user?.name || "Guest User").toUpperCase()}
          </Text>

          {/* Mobile Number Display */}
          <Text style={[styles.mobileNumber, { color: colors.white }]}>
            {loading ? "..." : formatMobileNumber(mobileNumber)}
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[effectiveMode === "dark" ? "#FFFFFF" : "#333333"]}
            tintColor={effectiveMode === "dark" ? "#FFFFFF" : "#333333"}
            titleColor={colors.textLight}
          />
        }
      >
        {/* Menu Items Card Container */}
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: effectiveMode === "dark" ? "#000" : "#000",
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  index !== menuItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={item.onPress || (() => router.push(item.route))}
                disabled={loading}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={colors.primary}
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, { color: colors.text }]}>
                    {item.title}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Spacer before logout button */}
        <View style={styles.spacer} />

        {/* Logout Button - Fixed to be less wide */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: colors.danger + "10",
                borderColor: colors.danger + "30",
              },
            ]}
            activeOpacity={0.7}
            onPress={handleLogout}
            disabled={loading}
          >
            <View style={styles.logoutButtonContent}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={colors.danger}
              />
              <Text style={[styles.logoutText, { color: colors.danger }]}>
                LOGOUT
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    paddingTop: 85,
    paddingBottom: 10,
    paddingHorizontal: 24,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mobileNumber: {
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 0.3,
    marginBottom: 8,
    opacity: 0.9,
  },
  userId: {
    fontSize: 14,
    letterSpacing: 0.3,
    opacity: 0.8,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "400",
  },
  spacer: {
    height: 20,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  bottomPadding: {
    height: 40,
  },
});

export default Profile;
