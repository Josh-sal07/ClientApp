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
  StatusBar,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../../../store/user";
import { useTheme } from "../../../../theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { sharedScrollY } from "../../../../shared/sharedScroll";

const { width } = Dimensions.get("window");

const scaleSize = (size) => {
  const baseWidth = 375;
  const scale = width / baseWidth;
  return Math.round(size * Math.min(scale, 1.2));
};

const Home = () => {
  // Use the shared scrollY
  const scrollY = sharedScrollY;
  
  const [showAmount, setShowAmount] = useState(true);
  const scrollViewRef = useRef(null);
  const router = useRouter();
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
      // Gradient colors - Matching Security/About screens
      gradientStart: "#98eced",
      gradientAlt1: "#65f1e8",
      gradientEnd: "#21c7c1",
      gradientAlt: "#1de7e3",
      tabBarGradientStart: "#98eced",
      tabBarGradientEnd: "#21c7c1",
    },
    dark: {
      primary: "#1f6f68",
      secondary: "#00AFA1",
      dark: "#121212",
      white: "#d9f7f6",
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
      // Gradient colors (darker version)
      gradientStart: "#000000",
      gradientEnd: "#032829",
      gradientAlt: "#0b1515",
      gradientAlt1: "#032829",
      tabBarGradientStart: "#000000",
      tabBarGradientEnd: "#032829",
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
      if (!token) {
        setUserCredit(0);
        return;
      }

      const response = await fetch(
        `https://staging.kazibufastnet.com/api/app/credit_points`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        setUserCredit(0);
        return;
      }

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        setUserCredit(0);
        return;
      }

      // Helper function to find credit value in nested objects
      const findCreditValue = (obj) => {
        if (!obj || typeof obj !== "object") return 0;

        // Check common credit field names
        const creditFields = [
          "credits_balance",
          "credit_points",
          "credits",
          "balance",
          "credit_balance",
          "points",
          "credit",
          "available_credits",
          "available_balance",
          "total_credits",
          "amount",
        ];

        // Check direct fields first
        for (const field of creditFields) {
          if (obj[field] !== undefined && obj[field] !== null) {
            const value = parseFloat(obj[field]);
            if (!isNaN(value)) {
              return value;
            }
          }
        }

        // Check nested objects
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === "object") {
            const nestedValue = findCreditValue(obj[key]);
            if (nestedValue > 0) return nestedValue;
          }
        }

        return 0;
      };

      const creditValue = findCreditValue(data);
      setUserCredit(creditValue);
    } catch (err) {
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
    {
      title: "plans",
      icon: require("../../../../assets/icons/ticket.png"),
      route: "/(role)/(subscriptionPlan)/plan",
      color: colors.warning,
    },
  ];

  const handleRoutePress = (route) => {
    if (typeof route === "string") {
      router.push(route);
    }
  };
  const getDots = (value) => {
    const digits = value.toString().length;
    return "•".repeat(7);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

   

      {/* Image Background Hero Section */}
      <ImageBackground
        source={require("../../../../assets/images/homebg.png")} // Change this path to your image
        style={styles.heroImageBackground}
        resizeMode="cover"
      >
        {/* Optional overlay to improve text readability */}
        <View style={styles.imageOverlay}>
          <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greeting, { color: colors.white }]}>
                Hi, {user?.name?.split(" ")[0] || "Guest"}! 
              </Text>
            </View>

            {/* Credit Display Card */}
            <View
              style={[
                styles.creditCard,
                {
                  backgroundColor: colors.white,
                  borderColor: colors.primary + "20",
                },
              ]}
            >
              <View style={styles.creditHeader}>
                <View style={styles.creditTitleContainer}>
                  <View
                    style={[
                      styles.creditIconContainer,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={scaleSize(22)}
                      color={colors.primary}
                    />
                  </View>
                  <View>
                    <Text
                      style={[styles.creditLabel, { color: colors.primary }]}
                    >
                      Available Credit
                    </Text>
                    <View style={styles.amountContainer}>
                      {showAmount ? (
                        <Text
                          style={[styles.creditAmount, { color: colors.primary }]}
                        >
                          ₱
                          {Number(userCredit).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      ) : (
                        <View style={styles.hiddenAmount}>
                          <Text
                            style={[styles.hiddenText, { color: colors.primary }]}
                          >
                            {getDots(userCredit)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.creditActions}>
                  <TouchableOpacity
                    onPress={() => setShowAmount(!showAmount)}
                    style={[
                      styles.eyeButton,
                      {
                        backgroundColor:
                          effectiveMode === "dark"
                            ? colors.white
                            : colors.lightGray,
                        borderColor: colors.primary + "30",
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showAmount ? "eye-outline" : "eye-off-outline"}
                      size={scaleSize(18)}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.primary + "10" },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.addCreditButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => router.push("/(role)/(addcredit)/addCredit")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={scaleSize(16)}
                  color="#FFF"
                />
                <Text style={styles.addCreditText}>Add Credit</Text>
                <Ionicons
                  name="arrow-forward"
                  size={scaleSize(14)}
                  color="#FFF"
                  style={styles.addCreditArrow}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
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
        {/* Quick Actions Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle1, { color: colors.text }]}>
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
                    shadowColor:
                      effectiveMode === "dark" ? "transparent" : "#000",
                  },
                ]}
                onPress={() => handleRoutePress(action.route)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    {
                      backgroundColor: action.color,
                      shadowColor:
                        effectiveMode === "dark" ? "transparent" : action.color,
                    },
                  ]}
                >
                  <Image
                    source={action.icon}
                    style={[
                      styles.actionIcon,
                      { tintColor: index === 1 ? colors.white : undefined },
                    ]}
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

        {/* Announcements Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: colors.danger + "15" },
                ]}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={scaleSize(18)}
                  color={colors.danger}
                />
              </View>
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
                size={scaleSize(20)}
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

        {/* Upcoming Bills Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={scaleSize(18)}
                  color={colors.primary}
                />
              </View>
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
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textLight }]}>
                Loading upcoming bills...
              </Text>
            </View>
          ) : upcomingBills.length === 0 ? (
            <View style={styles.noBillsContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={scaleSize(40)}
                color={colors.success}
              />
              <Text style={[styles.noBillsText, { color: colors.textLight }]}>
                All bills are paid! 🎉
              </Text>
            </View>
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
                      backgroundColor: colors.surface,
                      borderColor: colors.primary + "10",
                      shadowColor:
                        effectiveMode === "dark" ? "transparent" : "#000",
                    },
                  ]}
                  activeOpacity={0.9}
                >
                  <View style={styles.billContent}>
                    <View style={styles.billHeader}>
                      <View style={styles.billDateContainer}>
                        <Ionicons
                          name="calendar-outline"
                          size={scaleSize(14)}
                          color={colors.textLight}
                          style={styles.billDateIcon}
                        />
                        <Text
                          style={[styles.billDate, { color: colors.textLight }]}
                        >
                          {formatDate(bill.due_date)}
                        </Text>
                      </View>
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
                        <Ionicons
                          name="arrow-forward"
                          size={scaleSize(12)}
                          color="#FFF"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Footer Spacer */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Image Background Styles
  heroImageBackground: {
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    minHeight: 250, // Adjust as needed for your image
  },
  imageOverlay: {
    flex: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 50 : 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flex: 1,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: scaleSize(24),
    fontWeight: "700",
    bottom:40,
    right:5,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  welcomeText: {
    fontSize: scaleSize(15),
    bottom:50,
    opacity: 0.9,
    right:5
 
  },
  creditCard: {
    top:10,
    padding: 20,
    elevation: 5,
    borderRadius:10,
    
  },
  creditHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  creditTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  creditIconContainer: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
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
    fontSize: scaleSize(16),
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.5,
  },
  hiddenAmount: {
    paddingVertical: scaleSize(0),
  },
  hiddenText: {
    fontSize: scaleSize(24),
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: scaleSize(3),
  },
  creditActions: {
    marginLeft: 10,
  },
  eyeButton: {
    width: scaleSize(30),
    height: scaleSize(30),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  addCreditButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addCreditText: {
    fontSize: scaleSize(14),
    fontWeight: "700",
    color: "#FFF",
  },
  addCreditArrow: {
    marginLeft: 2,
  },
  scrollView: {
    flex: 1,
    marginTop: 66,
  },
  contentContainer: {
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
  },
  sectionContainer: {
    
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: scaleSize(18),
    fontWeight: "700",
    marginBottom: 10,
    
  },
  sectionTitle1: {
    fontSize: scaleSize(18),
    fontWeight: "700",
    marginBottom: 10,
    marginTop:10
    
  },
  seeAllButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: scaleSize(14),
    fontWeight: "600",
  },
  quickActionsContainer: {
    paddingRight: 20,
    gap: 12,
  },
  quickActionCard: {
    width: scaleSize(100),
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIconContainer: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
  },
  quickActionText: {
    fontSize: scaleSize(8),
    fontWeight: "700",
    textAlign: "center",
    lineHeight: scaleSize(16),
  },
  announcementCard: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  announcementLabel: {
    fontSize: scaleSize(12),
    fontWeight: "700",
    letterSpacing: 1,
  },
  announcementTitle: {
    fontSize: scaleSize(18),
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: scaleSize(24),
  },
  announcementDescription: {
    fontSize: scaleSize(14),
    lineHeight: scaleSize(20),
    marginBottom: 16,
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
  billCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  billContent: {
    padding: 16,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  billDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  billDateIcon: {
    opacity: 0.7,
  },
  billDate: {
    fontSize: scaleSize(14),
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusTextBadge: {
    fontSize: scaleSize(12),
    fontWeight: "600",
  },
  billDescription: {
    fontSize: scaleSize(15),
    marginBottom: 16,
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: scaleSize(14),
  },
  noBillsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  noBillsText: {
    fontSize: scaleSize(14),
    marginTop: 10,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default Home;