import React, { useEffect, useState } from "react";
import { useUserStore } from "../../../store/user";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  useColorScheme,
  theme
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const API_EDIT_PROFILE_URL = "https://staging.kazibufastnet.com/api/app/profile/update";

const AccountSettings = () => {
  const user = useUserStore((state) => state.user);
  const loadUser = useUserStore((state) => state.loadUser);
  const setUser = useUserStore((state) => state.setUser);
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();
    // Determine effective mode
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
    }
  };
  
   const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    street: "",
    barangay: "",
    town: "",
    province: "",
    mobile_number: "",
  });

  // Header states
  const [activeHeaderTab, setActiveHeaderTab] = useState("Album");

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        street: user.street || "",
        barangay: user.barangay || "",
        town: user.town || "",
        province: user.province || "",
        mobile_number: user.mobile_number || "",
      });
    }
  }, [user]);

  // Reset StatusBar when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
        StatusBar.setTranslucent(true);
      }
      
      return () => {
        // Optional cleanup
      };
    }, [])
  );

  const handleHeaderTabPress = (tabName) => {
    setActiveHeaderTab(tabName);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }

    setIsSaving(true);
    
    try {
      // Get authentication token
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "Authentication required");
        router.back();
        return;
      }

      // Prepare data for backend
      const updateData = {
        name: form.name.trim(),
        street: form.street?.trim() || "",
        barangay: form.barangay?.trim() || "",
        town: form.town?.trim() || "",
        province: form.province?.trim() || "",
        mobile_number: form.mobile_number?.trim() || "",
      };

      // SEND TO BACKEND API
      const response = await fetch(API_EDIT_PROFILE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseText = await response.text();
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Server returned invalid JSON response");
      }

      // Check different response formats
      if (response.ok) {
        if (result.success === true || result.status === "success" || result.message?.includes("success")) {
          // Update local user store with backend response
          const updatedUser = {
            ...user,
            ...updateData,
          };
          
          await setUser(updatedUser);
          
          setIsEditing(false);
          Alert.alert(
            "Success!",
            result.message || "Your profile has been updated successfully",
            [
              {
                text: "OK",
                onPress: () => {
                  loadUser();
                }
              }
            ]
          );
          return;
        }
      }

      // Provide specific error messages based on status code
      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      } else if (response.status === 422) {
        throw new Error("Validation error: " + (result.errors ? Object.values(result.errors).join(", ") : "Invalid data"));
      } else if (response.status === 400) {
        throw new Error(result.message || "Bad request. Please check your data.");
      } else if (response.status === 404) {
        throw new Error("API endpoint not found. Please contact support.");
      } else if (response.status === 500) {
        throw new Error("Server error. Please try again later.");
      } else {
        throw new Error(result.message || `Update failed (${response.status})`);
      }

    } catch (error) {
      
      if (error.message === "Network request failed") {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again.",
          [{ text: "OK" }]
        );
      } else if (error.message.includes("timeout")) {
        Alert.alert(
          "Timeout",
          "The request took too long. Please try again.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Update Failed",
          error.message || "Could not update profile. Please try again."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        name: user.name || "",
        street: user.street || "",
        barangay: user.barangay || "",
        town: user.town || "",
        province: user.province || "",
        mobile_number: user.mobile_number || "",
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientAlt1, colors.gradientAlt, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Account Settings</Text>
              <View style={styles.headerRightPlaceholder} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textLight }]}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  const renderInput = (label, value, onChange, placeholder = "", icon = null, editable = true) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelRow}>
        {icon && <Ionicons name={icon} size={18} color={colors.primary} style={styles.inputIcon} />}
        <Text style={[styles.inputLabel, { color: colors.primary }]}>{label}</Text>
      </View>
      {isEditing && editable ? (
        <TextInput
          style={[styles.input, { 
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }]}
          value={value}
          placeholder={placeholder || label}
          onChangeText={onChange}
          placeholderTextColor={colors.gray}
          editable={!isSaving}
        />
      ) : (
        <Text style={[styles.inputValue, { color: colors.text }]}>{value || "Not set"}</Text>
      )}
      <View style={[styles.inputBorder, { backgroundColor: colors.border }]} />
    </View>
  );

  const renderSection = (title, children) => (
    <View style={[styles.section, { 
      backgroundColor: colors.surface,
      borderColor: colors.primary + '20',
      shadowColor: theme === 'dark' ? 'transparent' : '#000',
    }]}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      
      {/* Gradient Header - This will extend under the status bar */}
      <LinearGradient
        colors={[colors.gradientStart,colors.gradientEnd, colors.gradientAlt1, colors.gradientAlt ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          {/* Back Button and Title */}
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Account Settings</Text>
            {isEditing ? (
              <TouchableOpacity 
                style={styles.cancelHeaderButton}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <Text style={styles.cancelHeaderText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerRightPlaceholder} />
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Info Card */}
        <View style={[styles.statsCard, { 
          backgroundColor: colors.surface,
          borderColor: colors.success + '80',
          shadowColor: theme === 'dark' ? 'transparent' : '#000',
        }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {user.mobile_number ? user.mobile_number.slice(-4) : "N/A"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>Last 4 Digits</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {user.id ? `#${user.id.toString().slice(-6)}` : "N/A"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>Account ID</Text>
            </View>
            <View style={[styles.statDivider]} />
           
          </View>
        </View>

        {/* Personal Information */}
        {renderSection(
          "Personal Information",
          <>
            {renderInput(
              "Full Name",
              form.name,
              (v) => setForm({ ...form, name: v }),
              "Enter your full name",
              "person-outline"
            )}
            
            {renderInput(
              "Phone Number",
              form.mobile_number,
              (v) => setForm({ ...form, mobile_number: v }),
              "Enter phone number",
              "call-outline"
            )}
          </>
        )}

        {/* Address */}
        {renderSection(
          "Address Information",
          <>
            {renderInput(
              "Street",
              form.street,
              (v) => setForm({ ...form, street: v }),
              "Enter street address",
              "home-outline"
            )}
            
            {renderInput(
              "Barangay",
              form.barangay,
              (v) => setForm({ ...form, barangay: v }),
              "Enter barangay",
              "location-outline"
            )}
            
            {renderInput(
              "Town/City",
              form.town,
              (v) => setForm({ ...form, town: v }),
              "Enter town/city",
              "business-outline"
            )}
            
            {renderInput(
              "Province",
              form.province,
              (v) => setForm({ ...form, province: v }),
              "Enter province",
              "map-outline"
            )}
          </>
        )}

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {isEditing ? (
            <TouchableOpacity 
              style={[styles.saveButton, { 
                backgroundColor: isSaving ? colors.gray : colors.primary,
                opacity: isSaving ? 0.7 : 1,
              }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.editButton, { 
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                shadowColor: theme === 'dark' ? 'transparent' : '#000',
              }]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color={colors.success} />
              <Text style={[styles.editButtonText, { color: colors.success }]}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { 
          backgroundColor: colors.surface + '90',
          borderColor: colors.border,
        }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textLight }]}>
            Changes will be saved to our servers and reflected across all devices.
          </Text>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default AccountSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Gradient Header Styles - Extends under status bar
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
  cancelHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelHeaderText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  userInfoContainer: {
    marginBottom: 15,
  },
  userEmail: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  deviceInfo: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  headerTabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  headerTab: {
    marginRight: 25,
    paddingBottom: 10,
  },
  activeHeaderTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  headerTabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  activeHeaderTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cloudBackupContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  cloudBackupTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cloudBackupSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  bottomNavItem: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  bottomNavText: {
    color: 'rgba(255, 255, 255, 0.8)',
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
  statsCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    minHeight: 24,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputBorder: {
    height: 1,
    marginTop: 4,
  },
  actionContainer: {
    paddingVertical: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});