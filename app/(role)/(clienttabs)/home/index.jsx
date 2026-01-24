import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { RefreshControl, useColorScheme } from "react-native";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Overlay from "../../../../components/overlay";
import { useUserStore } from "../../../../store/user";
import { useTheme } from "../../../../theme/ThemeContext";

const { width } = Dimensions.get("window");

const scaleSize = (size) => {
  const baseWidth = 375;
  const scale = width / baseWidth;
  return Math.round(size * Math.min(scale, 1.2));
};

const Home = () => {
  const [showAmount, setShowAmount] = useState(true);
  const scrollViewRef = useRef(null);
  const router = useRouter();
  const [scrollY] = useState(new Animated.Value(0));
  const user = useUserStore((state) => state.user);
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();

  const [upcomingBills, setUpcomingBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userCredit, setUserCredit] = useState(0);

  // Determine effective theme mode
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
      surface: "#FFFFFF",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
      announcementBg: "#FFF5F5",
      announcementBorder: "#FF6B6B",
      billCardBg: "#FFFFFF",
      heroBg: "transparent",
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
      announcementBg: "#2A1A1A",
      announcementBorder: "#FF6B6B",
      billCardBg: "#1E1E1E",
      heroBg: "transparent",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  const fetchUpcomingBills = async (isRefresh = false) => {
    if (!user?.id) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoadingBills(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/billings/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const json = await response.json();

      const bills = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : [];

      const filteredBills = bills
        .filter((bill) => bill?.status?.toLowerCase() === "unpaid")
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

      setUpcomingBills(filteredBills);
    } catch (err) {
      console.error("Fetch upcoming bills error:", err);
      setUpcomingBills([]);
    } finally {
      setLoadingBills(false);
      setRefreshing(false);
    }
  };

  const fetchUserCredit = async () => {
    if (!user?.id) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/user/credit/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (data && data.credit !== undefined) {
        setUserCredit(data.credit);
      } else if (data && data.data?.credit !== undefined) {
        setUserCredit(data.data.credit);
      }
    } catch (err) {
      console.error("Fetch user credit error:", err);
      setUserCredit(0);
    }
  };

  useEffect(() => {
    fetchUpcomingBills(false);
    fetchUserCredit();
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getStatus = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diffDays > 0
      ? `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`
      : "Due today";
  };

  const getStatusColor = (statusText) => {
    if (statusText.includes("Due today")) return colors.danger;
    if (statusText.includes("Due in")) return colors.warning;
    return colors.success;
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const quickActions = [
    {
      title: "SUBSCRIPTION",
      icon: require("../../../../assets/icons/receipt.png"),
      route: "/(role)/(clienttabs)/subscriptions",
      color: colors.primary,
    },
    {
      title: "ADD MERCHANT",
      icon: require("../../../../assets/icons/receipt.png"),
      route: "/(role)/(clienttabs)/subscriptions",
      color: colors.dark,
    },
    {
      title: "TICKET",
      icon: require("../../../../assets/icons/ticket.png"),
      route: "/(role)/(clienttabs)/tickets",
      color: colors.warning,
    },
  ];

  const handleRoutePress = (route) => {
    if (typeof route === "string") {
      router.push(route);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Overlay />
       {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greeting, { color: colors.white }]}>
              Hi, {user?.name?.split(" ")[0] || "Guest"}! 👋
            </Text>
          </View>

          {/* Credit Display */}
          <View
            style={[
              styles.creditContainer,
              {
                backgroundColor: colors.white,
                borderColor: colors.primary + "20",
              },
            ]}
          >
            <View style={styles.creditLeftSection}>
              <View
                style={[
                  styles.creditIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="wallet-outline"
                  size={scaleSize(24)}
                  color={colors.primary}
                />
              </View>
              <View style={styles.creditTextSection}>
                <Text
                  style={[styles.creditLabel, { color: colors.textLight }]}
                >
                  Available Credit
                </Text>
                <View style={styles.amountContainer}>
                  {showAmount ? (
                    <Text
                      style={[styles.creditAmount, { color: colors.primary }]}
                    >
                      ₱{userCredit.toLocaleString()}
                    </Text>
                  ) : (
                    <View style={styles.hiddenAmount}>
                      <Text
                        style={[styles.hiddenText, { color: colors.primary }]}
                      >
                        ••••••
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.creditRightSection}>
              <TouchableOpacity
                onPress={() => setShowAmount(!showAmount)}
                style={[
                  styles.eyeButton,
                  { 
                    backgroundColor: effectiveMode === "dark" ? colors.surface : colors.lightGray,
                    borderColor: colors.primary + "30",
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showAmount ? "eye-outline" : "eye-off-outline"}
                  size={scaleSize(20)}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addCreditButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => router.push("/(role)/(clienttabs)/add-credit")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={scaleSize(16)}
                  color="#FFF"
                />
                <Text style={styles.addCreditText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              fetchUpcomingBills(true);
              fetchUserCredit();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
    

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How can we help you today?
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
          >
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickActionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: action.color + "20",
                    borderWidth: 1,
                    shadowColor: effectiveMode === "dark" ? "transparent" : "#000",
                  },
                ]}
                onPress={() => handleRoutePress(action.route)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: action.color },
                  ]}
                >
                  <Image
                    source={action.icon}
                    style={styles.actionIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Announcements */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="megaphone-outline"
                size={scaleSize(20)}
                color={colors.danger}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Announcements
              </Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() =>
                router.push("/UserAnnouncement/seeAllAnnouncements")
              }
            >
              <Text style={[styles.seeAllText, { color: colors.danger }]}>
                See all
              </Text>
              <Ionicons
                name="chevron-forward"
                size={scaleSize(16)}
                color={colors.danger}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.announcementCard,
              {
                backgroundColor: colors.announcementBg,
                borderLeftColor: colors.announcementBorder,
                borderLeftWidth: scaleSize(4),
              },
            ]}
          >
            <View style={styles.announcementHeader}>
              <Ionicons
                name="alert-circle"
                size={scaleSize(24)}
                color={colors.danger}
              />
              <Text
                style={[styles.announcementLabel, { color: colors.danger }]}
              >
                IMPORTANT
              </Text>
            </View>
            <Text style={[styles.announcementTitle, { color: colors.text }]}>
              Christmas Party Cancellation Notice
            </Text>
            <Text
              style={[
                styles.announcementDescription,
                { color: colors.textLight },
              ]}
            >
              Due to unfavorable weather conditions, our annual Christmas party
              has been postponed. Stay tuned for further updates and new date
              announcements.
            </Text>
            <View style={styles.announcementFooter}>
              <Text
                style={[styles.announcementDate, { color: colors.textLight }]}
              >
                Posted: Dec 10, 2025
              </Text>
              <TouchableOpacity>
                <Text style={[styles.readMoreText, { color: colors.danger }]}>
                  Read more →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Upcoming Bills */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="calendar-outline"
                size={scaleSize(20)}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Upcoming Bills
              </Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/(role)/(clienttabs)/billing")}
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                See all
              </Text>
              <Ionicons
                name="chevron-forward"
                size={scaleSize(16)}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {loadingBills ? (
            <Text style={[styles.loadingText, { color: colors.textLight }]}>
              Loading upcoming bills...
            </Text>
          ) : upcomingBills.length === 0 ? (
            <Text style={[styles.noBillsText, { color: colors.textLight }]}>
              No upcoming bills
            </Text>
          ) : (
            upcomingBills.map((bill) => {
              const statusText = getStatus(bill.due_date);
              const statusColor = getStatusColor(statusText);

              return (
                <TouchableOpacity
                  key={bill.id}
                  style={[
                    styles.billCard,
                    {
                      backgroundColor: colors.billCardBg,
                      borderColor: colors.border,
                      shadowColor: effectiveMode === "dark" ? "transparent" : "#000",
                    },
                  ]}
                  activeOpacity={0.9}
                >
                  <View style={styles.billContent}>
                    <View style={styles.billHeader}>
                      <Text
                        style={[styles.billDate, { color: colors.textLight }]}
                      >
                        {formatDate(bill.due_date)}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusColor + "15" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusTextBadge,
                            { color: statusColor },
                          ]}
                        >
                          {statusText}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.billDescription, { color: colors.text }]}
                    >
                      Internet Bill Payment
                    </Text>
                    <View style={styles.billFooter}>
                      <Text style={[styles.billAmount, { color: colors.text }]}>
                        ₱{bill.amount_due?.toLocaleString() || "0"}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.payButton,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={styles.payButtonText}>PAY NOW</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginBottom: 80,
    marginTop: 20,
  },
  contentContainer: {
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  heroSection: {
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(20),
    paddingBottom: scaleSize(25),
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom:0
  },
  greetingContainer: {
    marginBottom: scaleSize(20),
  },
  greeting: {
    fontSize: scaleSize(32),
    fontWeight: "800",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  creditContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: scaleSize(18),
    padding: scaleSize(16),
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  creditLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  creditIconContainer: {
    width: scaleSize(50),
    height: scaleSize(50),
    borderRadius: scaleSize(12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(14),
  },
  creditTextSection: {
    flex: 1,
  },
  creditLabel: {
    fontSize: scaleSize(12),
    fontWeight: "600",
    marginBottom: scaleSize(4),
    letterSpacing: 0.5,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  creditAmount: {
    fontSize: scaleSize(26),
    fontWeight: "800",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  hiddenAmount: {
    paddingVertical: scaleSize(4),
  },
  hiddenText: {
    fontSize: scaleSize(26),
    fontWeight: "800",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: scaleSize(3),
  },
  creditRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSize(10),
    marginLeft: scaleSize(10),
  },
  eyeButton: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(12),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  addCreditButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(12),
    gap: scaleSize(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: scaleSize(85),
    justifyContent: "center",
  },
  addCreditText: {
    fontSize: scaleSize(14),
    fontWeight: "700",
    color: "#FFF",
  },
  sectionContainer: {
    paddingHorizontal: scaleSize(20),
    marginBottom: scaleSize(20),
  },
  sectionTitle: {
    fontSize: scaleSize(18),
    fontWeight: "700",
    marginBottom: scaleSize(16),
  },
  quickActionsContainer: {
    paddingRight: scaleSize(20),
    gap: scaleSize(10),
  },
  quickActionCard: {
    width: scaleSize(115),
    padding: scaleSize(18),
    borderRadius: scaleSize(16),
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIconContainer: {
    width: scaleSize(50),
    height: scaleSize(50),
    borderRadius: scaleSize(25),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scaleSize(12),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: scaleSize(24),
    height: scaleSize(24),
    tintColor: "#fff",
  },
  quickActionText: {
    fontSize: scaleSize(12),
    fontWeight: "700",
    textAlign: "center",
    lineHeight: scaleSize(16),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(16),
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSize(8),
  },
  seeAllButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scaleSize(4),
  },
  seeAllText: {
    fontSize: scaleSize(14),
    fontWeight: "600",
  },
  billCard: {
    borderRadius: scaleSize(16),
    marginBottom: scaleSize(12),
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  billContent: {
    padding: scaleSize(16),
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(8),
  },
  billDate: {
    fontSize: scaleSize(14),
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(5),
    borderRadius: scaleSize(12),
  },
  statusTextBadge: {
    fontSize: scaleSize(12),
    fontWeight: "600",
  },
  billDescription: {
    fontSize: scaleSize(15),
    marginBottom: scaleSize(16),
    lineHeight: scaleSize(22),
  },
  billFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billAmount: {
    fontSize: scaleSize(20),
    fontWeight: "700",
  },
  payButton: {
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(8),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  payButtonText: {
    fontSize: scaleSize(14),
    fontWeight: "600",
    color: "#fff",
  },
  announcementCard: {
    borderRadius: scaleSize(16),
    padding: scaleSize(20),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSize(8),
    marginBottom: scaleSize(12),
  },
  announcementLabel: {
    fontSize: scaleSize(12),
    fontWeight: "700",
    letterSpacing: 1,
  },
  announcementTitle: {
    fontSize: scaleSize(18),
    fontWeight: "700",
    marginBottom: scaleSize(8),
    lineHeight: scaleSize(24),
  },
  announcementDescription: {
    fontSize: scaleSize(14),
    lineHeight: scaleSize(20),
    marginBottom: scaleSize(16),
  },
  announcementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  announcementDate: {
    fontSize: scaleSize(12),
  },
  readMoreText: {
    fontSize: scaleSize(14),
    fontWeight: "600",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: scaleSize(14),
  },
  noBillsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: scaleSize(14),
  },
});

export default Home;