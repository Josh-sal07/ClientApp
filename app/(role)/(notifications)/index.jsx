import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
  RefreshControl,
  useColorScheme,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../../theme/ThemeContext";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function Notifications() {
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
      notificationUnread: "#E3F2FD",
      notificationRead: "#FFFFFF",
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
      notificationUnread: "#2D3748",
      notificationRead: "#1E1E1E",
    },
  };

  const colors = effectiveMode === "dark" ? COLORS.dark : COLORS.light;

  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (notifications.length > 0) {
        loadNotifications();
      }
    }, [notifications.length]),
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const res = await fetch(
        "https://staging.kazibufastnet.com/api/app/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const json = await res.json();
      const fetchedNotifications = json.notifications || [];

      const formatted = fetchedNotifications.map((n) => ({
        ...n,
        isRead: n.is_read === 1,
        timestamp: n.created_at,
      }));

      setNotifications(formatted);
      setHasUnread(formatted.some((n) => !n.isRead));
    } catch (e) {
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false); // ✅ always stop loading
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setSelected(notifications.map((n) => n.id));
  };

  const clearSelection = () => {
    setSelected([]);
    setSelectMode(false);
  };

  const deleteSelected = () => {
    if (selected.length === 0) return;

    Alert.alert(
      "Delete Notifications",
      `Are you sure you want to delete ${selected.length} notification${selected.length !== 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
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
                    selected: selected, // 👈 BULK IDS
                  }),
                },
              );

              if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
              }

              // ✅ UPDATE UI IMMEDIATELY
              setNotifications((prev) =>
                prev.filter((n) => !selected.includes(n.id)),
              );

              clearSelection();

              loadNotifications();

              Alert.alert(
                "Success",
                `${selected.length} notification${selected.length !== 1 ? "s" : ""} deleted`,
              );
            } catch (error) {
              console.error("Delete notifications error:", error);
              Alert.alert("Error", "Failed to delete notifications");
            }
          },
        },
      ],
    );
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Session Expired", "Please login again");
        router.replace("/(auth)/(login)/login");
        return;
      }

      const res = await fetch(
        "https://staging.kazibufastnet.com/api/app/notifications/marked_all_as_red",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json", // ✅ REQUIRED
          },
          body: JSON.stringify({
            selected: notifications.map((n) => n.id), // ✅ SEND ALL IDS
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      // ✅ UPDATE UI IMMEDIATELY
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setHasUnread(false);
    } catch (error) {
      console.error("Mark all as read error:", error);
      Alert.alert("Error", "Failed to mark all as read");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: diffInHours > 8760 ? "numeric" : undefined,
      });
    }
  };

  const renderEmptyState = () => (
    <View
      style={[styles.emptyContainer, { backgroundColor: colors.background }]}
    >
      <Ionicons
        name="notifications-off-outline"
        size={80}
        color={colors.gray}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Notifications
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
        You're all caught up! New notifications will appear here.
      </Text>
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: colors.primary }]}
        onPress={loadNotifications}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNotificationItem = ({ item }) => {
    const isSelected = selected.includes(item.id);

    return (
      <TouchableOpacity
        onPress={() => {
          if (selectMode) {
            toggleSelect(item.id);
          } else {
            markAsRead(item.id);
            router.push(`/(notifications)/${item.id}`);
          }
        }}
        onLongPress={() => {
          if (!selectMode) setSelectMode(true);
          toggleSelect(item.id);
        }}
        activeOpacity={0.8}
        style={[
          styles.notificationCard,
          {
            backgroundColor: isSelected
              ? colors.primary + "20"
              : item.isRead
                ? colors.notificationRead
                : colors.notificationUnread,
          },
        ]}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationTitleContainer}>
              {!item.isRead && (
                <View
                  style={[
                    styles.unreadDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.notificationTitle,
                  {
                    color: colors.text,
                    fontWeight: item.isRead ? "400" : "600",
                  },
                ]}
                numberOfLines={2}
              >
                {item.title || "Notification"}
              </Text>
            </View>
            <Text
              style={[styles.notificationTime, { color: colors.textLight }]}
            >
              {formatDate(item.timestamp)}
            </Text>
          </View>

          <Text
            style={[styles.notificationBody, { color: colors.textLight }]}
            numberOfLines={3}
          >
            {item.body || item.message || "No additional details available."}
          </Text>

          {item.type && (
            <View style={styles.notificationTypeContainer}>
              <View
                style={[
                  styles.notificationTypeBadge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.notificationTypeText,
                    { color: colors.primary },
                  ]}
                >
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {selectMode && (
          <View style={styles.selectionIndicator}>
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={24}
              color={isSelected ? colors.primary : colors.gray}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        {/* LEFT: BACK */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.white} />
        </TouchableOpacity>

        {/* CENTER: TITLE */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.white }]}>
            Notifications
          </Text>
          {!selectMode && hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>New</Text>
            </View>
          )}
        </View>

        {/* RIGHT: ACTIONS */}
        <View style={styles.headerActions}>
          {selectMode ? (
            <>
              <TouchableOpacity onPress={selectAll} style={styles.actionButton}>
                <Ionicons
                  name="checkbox-outline"
                  size={22}
                  color={colors.white}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={deleteSelected}
                style={styles.actionButton}
                disabled={selected.length === 0}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={
                    selected.length === 0 ? colors.white + "80" : colors.white
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearSelection}
                style={styles.actionButton}
              >
                <Ionicons name="close-outline" size={22} color={colors.white} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {hasUnread && (
                <TouchableOpacity
                  onPress={markAllAsRead}
                  style={styles.actionButton}
                >
                  <Ionicons
                    name="checkmark-done-outline"
                    size={22}
                    color={colors.white}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setSelectMode(true)}
                style={styles.actionButton}
              >
                <Ionicons
                  name="checkbox-outline"
                  size={22}
                  color={colors.white}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* SELECTION MODE INFO BAR */}
      {selectMode && (
        <View
          style={[
            styles.selectionBar,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.selectionText, { color: colors.primary }]}>
            {selected.length} selected
          </Text>
          <TouchableOpacity onPress={clearSelection}>
            <Text style={[styles.clearText, { color: colors.textLight }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textLight, marginTop: 12 }}>
            Loading notifications…
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotificationItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[
                effectiveMode === "dark" ? colors.white : colors.primary,
              ]}
              tintColor={
                effectiveMode === "dark" ? colors.white : colors.primary
              }
            />
          }
          contentContainerStyle={
            notifications.length === 0 ? { flex: 1 } : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  unreadBadge: {
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  headerActions: {
    width: 80,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  selectionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  selectionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  clearText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationCard: {
    flexDirection: "row",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,

    // Android shadow
    elevation: 3,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    minWidth: 8,
  },
  notificationTitle: {
    fontSize: 15,
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationTypeContainer: {
    flexDirection: "row",
  },
  notificationTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  notificationTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectionIndicator: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
