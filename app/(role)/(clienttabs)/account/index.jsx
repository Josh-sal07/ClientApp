import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setToken } from "../../../../store/token";
import { useUserStore } from "../../../../store/user";
import { useTheme } from "../../../../theme/ThemeContext";
import axios from "axios";

const { width } = Dimensions.get('window');

// API endpoints
const API_PROFILE_URL = "https://staging.kazibufastnet.com/api/app/profile";
const API_EDIT_PROFILE_URL = "https://staging.kazibufastnet.com/api/app/profile/update";

function Profile() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
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
    }
  };
  
  const colors = theme === "dark" ? COLORS.dark : COLORS.light;

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
        if (data.name || data.email) {
          setUser({
            ...user,
            name: data.name || user.name,
            email: data.email || user.email,
          });
        }
        
        console.log("Profile data fetched successfully:", data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please login again");
        handleLogout();
      } else if (error.code === 'ECONNABORTED') {
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
      params: { profileData: JSON.stringify(profileData || user) }
    });
  };

  // Edit profile function (to be called from AccountSettings)
  const editProfile = async (updatedData) => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "Authentication required");
        return { success: false };
      }

      const response = await axios.post(
        API_EDIT_PROFILE_URL,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.success) {
        // Refresh profile data
        await fetchProfileData();
        return { success: true, data: response.data.data };
      } else {
        return { success: false, message: response.data.message || "Update failed" };
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || "Update failed"
        };
      } else if (error.request) {
        return { success: false, message: "Network error" };
      } else {
        return { success: false, message: error.message };
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["token", "pin_set"]);
            setToken(null);
            router.replace("/(auth)/(login)/login");
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: "account",
      title: "Account Settings",
      icon: "person-circle-outline",
      onPress: handleAccountSettings,
      color: colors.primary,
    },
    {
      id: "security",
      title: "Security",
      icon: "shield-checkmark-outline",
      route: "/(role)/(accountSettings)/Security",
      color: colors.primary,
    },
    {
      id: "support",
      title: "Help & Support",
      icon: "chatbubble-ellipses-outline",
      route: "/(role)/(accountSettings)/HelpSupport",
      color: colors.primary,
    },
    {
      id: "about",
      title: "About",
      icon: "information-circle-outline",
      route: "/(role)/(accountSettings)/AboutKazibufast",
      color: colors.primary,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header at the very top - extends under status bar */}
      
      <View style={[styles.header, { 
        backgroundColor: colors.primary,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      }]}>
        <View style={styles.headerContent}>
          {/* Center the "Account" title */}
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.white }]}>Account</Text>
          </View>
          
          {/* Settings icon at the end */}
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.settingsBtn}
              onPress={() => router.push("/(role)/(accountSettings)/settings")}
            >
              <Ionicons name="settings-sharp" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content area */}
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Pull to refresh"
            titleColor={colors.textLight}
          />
        }
      >
        {/* Profile Overview Card */}
        <View style={[styles.profileCard, { 
          backgroundColor: colors.surface,
          borderColor: colors.success + '90',
          shadowColor: theme === 'dark' ? 'transparent' : '#000',
        }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                {loading && !refreshing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.avatarText}>
                    {profileData?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "G"}
                  </Text>
                )}
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </View>
            </View>
            
            <View style={styles.profileInfo}>
              {loading && !refreshing ? (
                <ActivityIndicator color={colors.primary} style={{ marginBottom: 16 }} />
              ) : (
                <>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {profileData?.name || user?.name || "Guest User"}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.textLight }]}>
                    {profileData?.email || user?.email || "user@example.com"}
                  </Text>
                  <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                      <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.badgeText, { color: colors.success }]}>Active Member</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Account Stats */}
          <View style={[styles.statsGrid, { borderTopColor: colors.border + '80' }]}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="key-outline" size={18} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {loading && !refreshing ? "..." : `#${(profileData?.id || user?.id || "000000").toString().slice(-6)}`}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>Account ID</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {profileData?.created_at ? new Date(profileData.created_at).getFullYear() : "2024"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>Member Since</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="phone-portrait-outline" size={18} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {loading && !refreshing ? "..." : profileData?.phone || user?.phone || "N/A"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>Phone</Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage Your Account</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuCard, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.success + '70',
                  shadowColor: theme === 'dark' ? 'transparent' : '#000',
                }]}
                onPress={item.onPress || (() => router.push(item.route))}
                activeOpacity={0.8}
                disabled={loading}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name={item.icon} size={26} color={colors.success} />
                </View>
                <Text style={[styles.menuCardTitle, { color: colors.text }]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Info Section */}
        {profileData && !loading && (
          <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Account Information</Text>
            {profileData.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={colors.textLight} />
                <Text style={[styles.infoText, { color: colors.textLight, marginLeft: 8 }]}>
                  {profileData.address}
                </Text>
              </View>
            )}
            {profileData.company_name && (
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={18} color={colors.textLight} />
                <Text style={[styles.infoText, { color: colors.textLight, marginLeft: 8 }]}>
                  {profileData.company_name}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Logout Section */}
        <TouchableOpacity 
          style={[styles.logoutContainer, { 
            backgroundColor: colors.surface,
            borderColor: colors.danger + '90',
            shadowColor: theme === 'dark' ? 'transparent' : '#000',
          }]} 
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={loading}
        >
          <View style={[styles.logoutIconContainer, { backgroundColor: colors.danger + '10' }]}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          </View>
          <View style={styles.logoutTextContainer}>
            <Text style={[styles.logoutTitle, { color: colors.danger }]}>Logout</Text>
            <Text style={[styles.logoutSubtitle, { color: colors.textLight }]}>Sign out from this device</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.text }]}>Kazibufast Network</Text>
          <Text style={[styles.footerRights, { color: colors.gray }]}>© 2020 All rights reserved</Text>
          {refreshing && (
            <Text style={[styles.refreshText, { color: colors.textLight }]}>
              Refreshing profile...
            </Text>
          )}
        </View>
      </ScrollView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 0,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    marginLeft: 'auto', // Push to the end
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(33, 199, 185, 0.3)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    paddingLeft: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  menuCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: '1%',
    marginBottom: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  logoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  logoutIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutTextContainer: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  logoutSubtitle: {
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerRights: {
    fontSize: 11,
    marginBottom: 4,
  },
  refreshText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default Profile;