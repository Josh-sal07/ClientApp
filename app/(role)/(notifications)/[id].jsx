import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";

export default function NotificationDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();
  
  // Determine effective mode
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  // Colors for both light and dark mode (same as profile)
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
      card: "#FFFFFF",
      link: "#2563EB",
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
      card: "#1E1E1E",
      link: "#60A5FA",
    },
  };

  const colors = effectiveMode === "dark" ? COLORS.dark : COLORS.light;

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadNotification();
  }, []);

  // 📥 LOAD SINGLE NOTIFICATION
  const loadNotification = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Authentication Required", "Please login to view notifications");
        router.back();
        return;
      }

      const res = await fetch(
        `https://staging.kazibufastnet.com/api/app/notifications/view/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        if (res.status === 401) {
          Alert.alert("Session Expired", "Please login again");
          await AsyncStorage.removeItem("token");
          router.replace("/(auth)/(login)/login");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      setNotification(json.notification);
    } catch (err) {
      console.error("Load notification error:", err);
      Alert.alert(
        "Error",
        "Failed to load notification details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ DELETE (FRONTEND ONLY)
  const deleteNotification = () => {
  Alert.alert(
    "Delete Notification",
    "Are you sure you want to delete this notification?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
              Alert.alert("Session Expired", "Please login again");
              router.replace("/(auth)/(login)/login");
              return;
            }

            const res = await fetch(
              "https://staging.kazibufastnet.com/api/app/notifications/delete",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  selected: [id], // ✅ SINGLE ID
                }),
              }
            );

            if (!res.ok) {
              const text = await res.text();
              throw new Error(text);
            }

            Alert.alert("Deleted", "Notification removed");
            router.back(); // 👈 list will refresh or already filtered

          } catch (error) {
            console.error("Delete notification error:", error);
            Alert.alert("Error", "Failed to delete notification");
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]
  );
};


  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Handle action URL navigation
  const handleActionPress = () => {
    if (!notification?.action_url) return;
    
    try {
      // Check if it's a full URL or a route path
      if (notification.action_url.startsWith('http')) {
        // Open external URL
        Alert.alert("External Link", "This will open in your browser", [
          { text: "Cancel", style: "cancel" },
          { text: "Open", onPress: () => router.push(notification.action_url) }
        ]);
      } else {
        // Navigate to internal route
        router.push(`/(role)/(clienttabs)/${notification.action_url}`);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open the link");
    }
  };

  // ⏳ LOADING
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textLight }]}>
          Loading notification...
        </Text>
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={26} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.white }]}>
              Notification
            </Text>
          </View>
          <View style={styles.rightPlaceholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons 
            name="alert-circle-outline" 
            size={60} 
            color={colors.gray} 
          />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Notification Not Found
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.textLight }]}>
            The notification you're looking for doesn't exist or has been deleted.
          </Text>
          <TouchableOpacity 
            style={[styles.backButtonFull, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        {/* BACK */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          disabled={isDeleting}
        >
          <Ionicons name="chevron-back" size={26} color={colors.white} />
        </TouchableOpacity>

        {/* TITLE */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.white }]}>
            Notification
          </Text>
        </View>

        {/* DELETE */}
        <TouchableOpacity 
          onPress={deleteNotification} 
          style={styles.deleteButton}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="trash-outline" size={22} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentCard, { backgroundColor: colors.surface }]}>
          {/* NOTIFICATION TYPE BADGE */}
          {notification.type && (
            <View style={styles.typeContainer}>
              <View 
                style={[
                  styles.typeBadge,
                  { backgroundColor: colors.primary + "20" }
                ]}
              >
                <Text style={[styles.typeText, { color: colors.primary }]}>
                  {notification.type.toUpperCase()}
                </Text>
              </View>
            </View>
          )}

          {/* TITLE */}
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {notification.title || "Notification"}
          </Text>

          {/* TIMESTAMP */}
          <View style={styles.timeContainer}>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={colors.textLight} 
            />
            <Text style={[styles.timestamp, { color: colors.textLight }]}>
              {formatDate(notification.created_at)}
            </Text>
          </View>

          {/* SEPARATOR */}
          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          {/* BODY CONTENT */}
          <Text style={[styles.notificationBody, { color: colors.text }]}>
            {notification.body || "No content available."}
          </Text>

          {/* ACTION URL */}
          {notification.action_url && (
            <View style={styles.actionContainer}>
              <Text style={[styles.actionLabel, { color: colors.textLight }]}>
                Reference:
              </Text>
              <TouchableOpacity 
                onPress={handleActionPress}
                style={[
                  styles.actionButton,
                  { 
                    backgroundColor: colors.primary + "10",
                    borderColor: colors.primary + "30"
                  }
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons 
                    name="link-outline" 
                    size={16} 
                    color={colors.primary} 
                  />
                  <Text 
                    style={[styles.actionUrl, { color: colors.link }]}
                    numberOfLines={2}
                  >
                    {notification.action_url_label}
                  </Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={colors.link} 
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* BOTTOM PADDING */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    paddingTop:40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  rightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notificationTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 28,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  timestamp: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginBottom: 20,
  },
  notificationBody: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  actionContainer: {
    marginTop: 8,
  },
  actionLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionUrl: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButtonFull: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomPadding: {
    height: 40,
  },
});