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
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get('window');

const API_EDIT_PROFILE_URL = "https://staging.kazibufastnet.com/api/app/profile/update";

const AccountSettings = () => {
  const user = useUserStore((state) => state.user);
  const loadUser = useUserStore((state) => state.loadUser);
  const setUser = useUserStore((state) => state.setUser);
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

  const scrollY = React.useRef(new Animated.Value(0)).current;

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

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [height * 0.22, height * 0.15],
    extrapolate: 'clamp'
  });

  // UPDATE THIS FUNCTION TO SEND DATA TO BACKEND
 // UPDATE THE handleSave FUNCTION WITH THIS CODE:

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

    console.log("📤 Sending to backend:", updateData);
    console.log("🔑 Token length:", token.length);

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

    console.log("📥 Response status:", response.status);
    console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

    // Try to parse the response text first
    const responseText = await response.text();
    console.log("📥 Raw response:", responseText);

    let result;
    try {
      result = JSON.parse(responseText);
      console.log("📥 Parsed response:", result);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      throw new Error("Server returned invalid JSON response");
    }

    // Check different response formats
    if (response.ok) {
      // Check for different success response formats
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
                // Optional: Reload user data from backend
                loadUser();
              }
            }
          ]
        );
        
        console.log("✅ Profile updated successfully:", result.data || result);
        return;
      }
    }

    // If we get here, something went wrong
    console.error("❌ API Error details:", {
      status: response.status,
      statusText: response.statusText,
      result: result
    });

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
    console.error("❌ Error updating profile:", error);
    
    // Check for network errors
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

// ALSO ADD THIS DEBUG FUNCTION TO CHECK API CONNECTION:
const testAPIEndpoint = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log("🔍 Testing API endpoint:", API_EDIT_PROFILE_URL);
    console.log("🔍 Token exists:", !!token);
    
    // Simple test request
    const testResponse = await fetch(API_EDIT_PROFILE_URL, {
      method: "HEAD", // Just check if endpoint exists
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    
    console.log("🔍 Endpoint status:", testResponse.status);
    console.log("🔍 Endpoint headers:", Object.fromEntries(testResponse.headers.entries()));
  } catch (error) {
    console.error("🔍 API test failed:", error);
  }
};

// Call this in useEffect to debug
useEffect(() => {
  testAPIEndpoint();
}, []);

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
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Animated.View style={[styles.headerBackground, { height: headerHeight, backgroundColor: colors.primary }]}>
          <View style={styles.headerGradient} />
        </Animated.View>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-circle-outline" size={60} color={colors.primary} />
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

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            Last updated: {new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.gray }]}>
            Update your information anytime
          </Text>
        </View>
        
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default AccountSettings;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: height * 0.22,
    paddingBottom: 40,
  },
  statsCard: {
    marginHorizontal: 16,
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
    paddingHorizontal: 16,
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
    marginHorizontal: 16,
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