import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { RefreshControl, useColorScheme } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../../../store/user";
import { useTheme } from "../../../../theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { sharedScrollY } from "../../../../shared/sharedScroll";
import CustomAlert from "../../../../components/CustomAlert";
import NetInfo from "@react-native-community/netinfo";

const { width } = Dimensions.get("window");

const scaleSize = (size) => {
  const baseWidth = 375;
  const scale = width / baseWidth;
  return Math.round(size * Math.min(scale, 1.2));
};

// Skeleton Components
const SkeletonCreditHeader = ({ colors }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonItem = ({ width, height, style, borderRadius = 4 }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.white + "40",
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[colors.background, colors.primary + "80", colors.primary]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.separate}>
              <SkeletonItem width={120} height={24} borderRadius={4} />
              <SkeletonItem width={30} height={30} borderRadius={15} />
            </View>
            <View style={styles.creditHeader}>
              <SkeletonItem
                width={100}
                height={16}
                style={{ marginRight: 8 }}
              />
              <SkeletonItem width={20} height={20} borderRadius={10} />
            </View>
            <View style={styles.creditAmountContainer}>
              <SkeletonItem width={180} height={32} borderRadius={4} />
            </View>
            <SkeletonItem width={100} height={44} borderRadius={8} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const SkeletonQuickAction = ({ colors }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonItem = ({ width, height, style, borderRadius = 4 }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.textLight + "20",
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View style={styles.quickActionCard}>
      <SkeletonItem
        width={56}
        height={56}
        borderRadius={12}
        style={{ marginBottom: 8 }}
      />
      <SkeletonItem width={80} height={14} borderRadius={4} />
    </View>
  );
};

const SkeletonPromoCard = ({ colors }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonItem = ({ width, height, style, borderRadius = 4 }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.textLight + "20",
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View
      style={[
        styles.promoCard,
        { backgroundColor: colors.surface, marginRight: 12 },
      ]}
    >
      <SkeletonItem width="100%" height={120} borderRadius={12} />
      <View style={styles.promoInfo}>
        <SkeletonItem width={150} height={18} style={{ marginBottom: 8 }} />
        <SkeletonItem width="100%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonItem width="80%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonItem width={100} height={12} />
      </View>
    </View>
  );
};

const SkeletonBillCard = ({ colors }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonItem = ({ width, height, style, borderRadius = 4 }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.textLight + "20",
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View
      style={[
        styles.billCard,
        {
          backgroundColor: colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: colors.textLight + "20",
          marginBottom: 12,
        },
      ]}
    >
      <View style={styles.billInfo}>
        <View style={styles.billDetails}>
          <SkeletonItem width={180} height={18} style={{ marginBottom: 8 }} />
          <SkeletonItem width={140} height={14} />
        </View>
        <View style={styles.billRight}>
          <SkeletonItem width={80} height={20} style={{ marginBottom: 4 }} />
          <SkeletonItem width={60} height={12} />
        </View>
      </View>
      <SkeletonItem width="100%" height={44} borderRadius={8} />
    </View>
  );
};

const SkeletonBillsSection = ({ colors }) => {
  return (
    <View>
      {/* Header with skeleton */}
      <View style={styles.billsHeader}>
        <View
          style={{
            width: 150,
            height: 22,
            backgroundColor: colors.textLight + "20",
            borderRadius: 4,
          }}
        />
      </View>

      {/* 3 skeleton bills - matches actual UI */}
      {[1, 2, 3].map((_, index) => (
        <SkeletonBillCard key={`skeleton-bill-${index}`} colors={colors} />
      ))}
    </View>
  );
};

// No Internet Connection Component
const NoInternetView = ({ colors, onRetry, user }) => {
  // Get theme mode from context
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  const getGradientColors = () => {
    if (effectiveMode === "dark") {
      return ["#121212", "#1a4a4b", "#2d6c6d"];
    } else {
      return ["#F5F8FA", "#21C7B9", "#65f1e8"];
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header with Gradient Background */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.separate}>
                <Text style={styles.welcomeText}>
                  Hi {user?.name?.split(" ")[0]?.toUpperCase() || "GUEST"},
                </Text>
                <View style={styles.notificationIconContainer}>
                  <Ionicons name="mail-outline" size={30} color="#fff" />
                </View>
              </View>
              <View style={styles.creditHeader}>
                <Text style={[styles.creditLabel, { color: colors.white }]}>
                  CREDIT BALANCE
                </Text>
              </View>
              <View style={styles.creditAmountContainer}>
                <Text style={[styles.hiddenAmount, { color: colors.white }]}>
                  ••••••••
                </Text>
              </View>
              <View
                style={[
                  styles.addCreditButton,
                  { backgroundColor: colors.primary, opacity: 0.5 },
                ]}
              >
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={styles.addCreditText}>Add Credit</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={styles.noInternetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.noInternetContainer}>
          <View
            style={[
              styles.noInternetIconContainer,
              { backgroundColor: colors.danger + "20" },
            ]}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={80}
              color={colors.danger}
            />
          </View>

          <Text style={[styles.noInternetTitle, { color: colors.text }]}>
            No Internet Connection
          </Text>

          <Text style={[styles.noInternetMessage, { color: colors.textLight }]}>
            Please check your internet connection and try again.
          </Text>

          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={[styles.retryButtonText, { color: colors.white }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [checkingConnection, setCheckingConnection] = useState(true);

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
      text: "#136350",
      textLight: "#64748B",
      announcementBg: "#FFF5F5",
      announcementBorder: "#FF6B6B",
      billCardBg: "#FFFFFF",
      gradientStart: "#98eced",
      gradientAlt1: "#65f1e8",
      gradientEnd: "#21c7c1",
      gradientAlt: "#1de7e3",
      tabBarGradientStart: "#98eced",
      tabBarGradientEnd: "#21c7c1",
      quickActions: "#136350",
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
      gradientStart: "#000000",
      gradientEnd: "#032829",
      gradientAlt: "#0b1515",
      gradientAlt1: "#032829",
      tabBarGradientStart: "#000000",
      tabBarGradientEnd: "#032829",
      quickActions: "#FFFFFF",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    onConfirm: null,
  });

  // Static promo images from assets
  const staticPromos = [
    {
      id: 1,
      title: "Fiber Unlimited Plan",
      description: "Get up to 300Mbps for only ₱1,299/month",
      image: require("../../../../assets/images/promo1.png"),
      validUntil: "2024-12-31",
    },
    {
      id: 2,
      title: "Family Bundle",
      description: "Internet + Mobile Data + Streaming",
      image: require("../../../../assets/images/promo2.jpg"),
      validUntil: "2024-11-30",
    },
    {
      id: 3,
      title: "Gamer's Special",
      description: "Low latency fiber for gaming",
      image: require("../../../../assets/images/promo3.jpg"),
      validUntil: "2025-01-15",
    },
    {
      id: 4,
      title: "Work From Home",
      description: "Reliable connection for remote work",
      image: require("../../../../assets/images/promo4.png"),
      validUntil: "2024-10-31",
    },
  ];

  // Quick actions with additional items
  const quickActions = [
    {
      title: "Subscriptions",
      icon: require("../../../../assets/icons/receipt.png"),
      route: "/(role)/(clienttabs)/subscriptions",
      color: colors.primary,
    },
    {
      title: "Tickets",
      icon: require("../../../../assets/icons/ticket.png"),
      route: "/(role)/(clienttabs)/tickets",
      color: colors.primary,
    },
    {
      title: "Upgrade Plan",
      icon: require("../../../../assets/icons/plan.png"),
      route: "/(role)/(subscriptionPlan)/plan",
      color: colors.primary,
    },
  ];

  // Check network connection
  const checkNetworkConnection = async () => {
    try {
      const state = await NetInfo.fetch();
      const connected = state.isConnected && state.isInternetReachable;

      // If connection is restored, dismiss any existing alert
      if (connected && alertConfig.visible) {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
      }

      setIsConnected(connected);
      return connected;
    } catch (error) {
      console.log("Error checking network:", error);
      setIsConnected(false);
      return false;
    } finally {
      setCheckingConnection(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const connected = await checkNetworkConnection();
        if (connected) {
          fetchHomeData();
        } else {
          setLoadingBills(false);
        }
      };
      loadData();
    }, []),
  );

  useEffect(() => {
    const loadShowAmount = async () => {
      try {
        const saved = await AsyncStorage.getItem("showAmount");
        if (saved !== null) {
          setShowAmount(JSON.parse(saved));
        }
      } catch (e) {
        console.log("Failed to load showAmount", e);
      }
    };

    loadShowAmount();
  }, []);

  useEffect(() => {
    const hasUnreadAnnouncement = announcements.some(
      (ann) => ann.read_at === null,
    );
  }, [announcements, unreadNotifications]);

  // Fetch all data from the single /api/app/home endpoint
  const fetchHomeData = async (isRefresh = false) => {
    if (!user?.branch?.subdomain) {
      console.warn("User branch not loaded yet");
      return;
    }

    // Check connection before fetching
    const connected = await checkNetworkConnection();
    if (!connected) {
      setAlertConfig({
        visible: true,
        title: "No Internet Connection",
        message: "Please check your internet connection and try again.",
        type: "warning",
        onConfirm: () =>
          setAlertConfig((prev) => ({ ...prev, visible: false })),
      });
      setLoadingBills(false);
      setRefreshing(false);
      return;
    }

    const fetchWithTimeout = (url, options, timeout = 10000) =>
      Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Server timeout. Please try again later.")),
            timeout,
          ),
        ),
      ]);

    try {
      if (!isRefresh) setLoadingBills(true);
      else setRefreshing(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication required.");
      }

      const subdomain = user.branch.subdomain;

      const response = await fetchWithTimeout(
        `https://${subdomain}.kazibufastnet.com/api/app/home`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
        10000,
      );

      if (response.status === 401) {
        await AsyncStorage.removeItem("token");

        setAlertConfig({
          visible: true,
          title: "Session Expired",
          message: "Your session has expired. Please log in again.",
          type: "error",
          onConfirm: () => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            router.replace("/(auth)/login");
          },
        });

        return;
      }

      if (response.status === 404) {
        throw new Error("API endpoint not found.");
      }

      if (response.status >= 500) {
        throw new Error(
          "There is something wrong on our server. Please try again later.",
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch home data.");
      }

      const data = await response.json();

      // ✅ SAFE DATA
      setUnreadNotifications(data?.notifications ?? 0);
      setUserCredit(data?.user?.credit_points ?? 0);
      setAnnouncements(
        Array.isArray(data?.announcement) ? data.announcement : [],
      );
      processBillingsData(Array.isArray(data?.billings) ? data.billings : []);
    } catch (err) {
      let errorMessage = err.message;

      if (err.message === "Network request failed") {
        errorMessage =
          "No internet connection. Please check your network and try again.";
        setIsConnected(false);
      }

      if (!isRefresh) {
        showMockData();
      }

      setUpcomingBills([]);

      setAlertConfig({
        visible: true,
        title: "Error",
        message: errorMessage,
        type: "error",
        onConfirm: () =>
          setAlertConfig((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setLoadingBills(false);
      setRefreshing(false);
    }
  };

  // Process billings data from the API
  const processBillingsData = (billings) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processedBills = billings
      .filter((bill) =>
        ["unpaid", "pending", "open"].includes(
          bill.status?.toLowerCase() || "",
        ),
      )
      .map((bill) => {
        const dueDate = new Date(bill.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        let status_category = "upcoming";
        let status_text = `Due in ${diffDays} days`;
        let priority = 4;

        if (diffDays < 0) {
          status_category = "overdue";
          status_text = `Overdue by ${Math.abs(diffDays)} day(s)`;
          priority = 1;
        } else if (diffDays === 0) {
          status_category = "due_today";
          status_text = "Due today";
          priority = 2;
        } else if (diffDays <= 7) {
          status_category = "due_soon";
          status_text = `Due in ${diffDays} day(s)`;
          priority = 3;
        }

        return {
          id: bill.id,
          plan_name: `Plan ${bill.plan_id || "Unknown"}`,
          due_date: bill.due_date,
          amount_due: Number(bill.amount_due || bill.balance || 0),
          status: bill.status?.toLowerCase() || "unpaid",
          status_category,
          status_text,
          priority,
          reference_number: bill.reference_number,
          ...bill,
        };
      })
      .sort((a, b) => a.priority - b.priority);

    setUpcomingBills(processedBills);
  };

  // Mock data for demonstration (remove when API is working)
  const showMockData = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const mockBills = [
      {
        id: 1,
        plan_name: "Fiber Unlimited 300Mbps",
        due_date: yesterday.toISOString().split("T")[0],
        amount_due: 1299.0,
        status_category: "overdue",
        status_text: "Overdue by 1 day",
        priority: 1,
      },
      {
        id: 2,
        plan_name: "Internet Plan",
        due_date: today.toISOString().split("T")[0],
        amount_due: 1599.0,
        status_category: "due_today",
        status_text: "Due today",
        priority: 2,
      },
      {
        id: 3,
        plan_name: "Family Bundle",
        due_date: tomorrow.toISOString().split("T")[0],
        amount_due: 1999.0,
        status_category: "due_soon",
        status_text: "Due in 1 day",
        priority: 3,
      },
      {
        id: 4,
        plan_name: "Basic Plan",
        due_date: nextWeek.toISOString().split("T")[0],
        amount_due: 899.0,
        status_category: "upcoming",
        status_text: "Due in 7 days",
        priority: 4,
      },
    ];

    setUpcomingBills(mockBills);
    setUnreadNotifications(2);
    setUserCredit(182246513487.23);
  };

  useEffect(() => {
    const initializeData = async () => {
      const connected = await checkNetworkConnection();
      if (connected) {
        fetchHomeData(false);
      } else {
        setLoadingBills(false);
      }
    };
    initializeData();
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getStatusColor = (statusCategory) => {
    switch (statusCategory) {
      case "overdue":
        return colors.danger;
      case "due_today":
        return colors.warning;
      case "due_soon":
        return "#FF9800";
      default:
        return colors.success;
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const handleRoutePress = (route) => {
    if (typeof route === "string") {
      router.push(route);
    }
  };

  const getDots = (value) => {
    return "••••••••";
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₱0.00";
    return `₱${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Helper to chunk quick actions into rows of 3
  const chunkArray = (arr, size) => {
    const chunked = [];
    for (let i = 0; i < arr.length; i += size) {
      chunked.push(arr.slice(i, i + size));
    }
    return chunked;
  };

  const quickActionRows = chunkArray(quickActions, 3);

  const toggleShowAmount = async () => {
    const newValue = !showAmount;
    setShowAmount(newValue);

    try {
      await AsyncStorage.setItem("showAmount", JSON.stringify(newValue));
    } catch (e) {
      console.log("Failed to save showAmount", e);
    }
  };

  const PROMO_CARD_WIDTH = 280 + 12;
  const [promoIndex, setPromoIndex] = useState(0);

  // Check if there are unread announcements
  const hasUnreadAnnouncements = announcements.some(
    (ann) => ann.read_at === null,
  );

  const handleRetry = async () => {
    setCheckingConnection(true);
    const connected = await checkNetworkConnection();
    if (connected) {
      setLoadingBills(true);
      await fetchHomeData(false);
    } else {
      setAlertConfig({
        visible: true,
        title: "No Internet Connection",
        message: "Please check your internet connection and try again.",
        type: "warning",
        onConfirm: () =>
          setAlertConfig((prev) => ({ ...prev, visible: false })),
      });
    }
    setCheckingConnection(false);
  };

  // Show no internet view if not connected
  if (!isConnected && !loadingBills && !refreshing) {
    return <NoInternetView colors={colors} onRetry={handleRetry} user={user} />;
  }

  // Show skeleton on initial load OR during refresh
  if (loadingBills || refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />

        {/* Skeleton Credit Header */}
        <SkeletonCreditHeader colors={colors} />

        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                fetchHomeData(true);
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
        >
          {/* How can we help you today? Section */}
          <View style={styles.sectionContainer}>
            {/* Section Title Skeleton */}
            <View
              style={{
                width: 200,
                height: 22,
                backgroundColor: colors.textLight + "20",
                borderRadius: 4,
                marginBottom: 16,
              }}
            />

            {/* Quick Actions Skeleton Grid */}
            <View style={styles.quickActionsContainer}>
              {quickActionRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.quickActionsRow}>
                  {row.map((_, index) => (
                    <SkeletonQuickAction
                      key={`skeleton-${rowIndex}-${index}`}
                      colors={colors}
                    />
                  ))}
                  {/* Fill empty spaces in last row if needed */}
                  {rowIndex === quickActionRows.length - 1 &&
                    row.length < 3 &&
                    Array.from({ length: 3 - row.length }).map((_, i) => (
                      <View key={`empty-${i}`} style={styles.emptyActionCard} />
                    ))}
                </View>
              ))}
            </View>
          </View>

          {/* Promos Section Skeleton */}
          <View style={styles.sectionContainer}>
            <View style={styles.promosHeader}>
              {/* Section Title Skeleton */}
              <View
                style={{
                  width: 100,
                  height: 22,
                  backgroundColor: colors.textLight + "20",
                  borderRadius: 4,
                }}
              />
              {/* "See all" Skeleton */}
              <View
                style={{
                  width: 50,
                  height: 20,
                  backgroundColor: colors.textLight + "20",
                  borderRadius: 4,
                }}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.promosScroll}
            >
              {[1, 2, 3].map((_, index) => (
                <SkeletonPromoCard
                  key={`skeleton-promo-${index}`}
                  colors={colors}
                />
              ))}
            </ScrollView>

            {/* Skeleton Pagination Dots */}
            <View style={styles.paginationContainer}>
              {[1, 2, 3, 4].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor: colors.textLight + "20",
                      width: index === 0 ? 20 : 8,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Upcoming Bills Section Skeleton - Compact Version */}
          <View style={styles.sectionContainer}>
            <SkeletonBillsSection colors={colors} />
          </View>

          {/* Footer Spacer */}
          <View style={styles.bottomSpacer} />
        </Animated.ScrollView>
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

      {/* Header with Gradient Background (Bottom to Top) */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={getHeaderGradientColors(effectiveMode)}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.separate}>
                <Text style={styles.welcomeText}>
                  Hi {user?.name?.split(" ")[0]?.toUpperCase() || "GUEST"},
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    router.push("/(role)/(notifications)");
                  }}
                  style={{ position: "relative" }}
                >
                  <View style={styles.notificationIconContainer}>
                    <Ionicons name="mail-outline" size={30} color="#fff" />

                    {(unreadNotifications > 0 || hasUnreadAnnouncements) && (
                      <View style={styles.redDot}>
                        <Text style={styles.redDotText}>
                          {unreadNotifications > 0 ? unreadNotifications : ""}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.creditHeader}>
                <Text style={[styles.creditLabel, { color: colors.white }]}>
                  CREDIT BALANCE
                </Text>
                <TouchableOpacity
                  onPress={toggleShowAmount}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showAmount ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.creditAmountContainer}>
                {showAmount ? (
                  <Text style={[styles.creditAmount, { color: colors.white }]}>
                    {formatCurrency(user?.credit_points)}
                  </Text>
                ) : (
                  <Text style={[styles.hiddenAmount, { color: colors.white }]}>
                    {getDots(userCredit)}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.addCreditButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => router.push("/(role)/(addcredit)/addCredit")}
              >
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={styles.addCreditText}>Add Credit</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Main Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              fetchHomeData(true);
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* How can we help you today? Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How can we help you today?
          </Text>

          <View style={styles.quickActionsContainer}>
            {quickActionRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.quickActionsRow}>
                {row.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionCard}
                    onPress={() => handleRoutePress(action.route)}
                  >
                    <View style={[styles.actionIconContainer]}>
                      <Image
                        source={action.icon}
                        style={[
                          styles.actionIcon,
                          {
                            tintColor:
                              effectiveMode === "light"
                                ? colors.primary
                                : "#6dffe4",
                          },
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      style={[
                        styles.actionTitle,
                        { color: colors.quickActions },
                      ]}
                    >
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                ))}
                {rowIndex === quickActionRows.length - 1 &&
                  row.length < 3 &&
                  Array.from({ length: 3 - row.length }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.emptyActionCard} />
                  ))}
              </View>
            ))}
          </View>
        </View>

        {/* Promos Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.promosHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Promos
            </Text>
            <TouchableOpacity onPress={() => router.push("/(role)/(promo)")}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promosScroll}
            snapToInterval={PROMO_CARD_WIDTH}
            decelerationRate="fast"
            onScroll={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / PROMO_CARD_WIDTH,
              );
              setPromoIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {staticPromos.map((promo) => (
              <TouchableOpacity
                key={promo.id}
                style={[styles.promoCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/(role)/(clienttabs)/home`)}
              >
                <Image
                  source={promo.image}
                  style={styles.promoImage}
                  resizeMode="cover"
                />
                <View style={styles.promoInfo}>
                  <Text style={[styles.promoTitle, { color: colors.text }]}>
                    {promo.title}
                  </Text>
                  <Text
                    style={[
                      styles.promoDescription,
                      { color: colors.textLight },
                    ]}
                  >
                    {promo.description}
                  </Text>
                  <Text style={[styles.promoValid, { color: colors.primary }]}>
                    Valid until {formatDate(promo.validUntil)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.paginationContainer}>
            {staticPromos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor:
                      promoIndex === index
                        ? colors.primary
                        : colors.textLight + "40",
                    width: promoIndex === index ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {staticPromos.length === 0 && (
            <View
              style={[styles.noPromosCard, { backgroundColor: colors.surface }]}
            >
              <Ionicons
                name="megaphone-outline"
                size={40}
                color={colors.gray}
              />
              <Text style={[styles.noPromosText, { color: colors.textLight }]}>
                No promos available right now.
              </Text>
            </View>
          )}
        </View>

        {/* Upcoming Bills Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.billsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Upcoming Bills
            </Text>
          </View>

          {loadingBills ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textLight }]}>
                Loading upcoming bills...
              </Text>
            </View>
          ) : upcomingBills.length === 0 ? (
            <View
              style={[styles.noBillsCard, { backgroundColor: colors.surface }]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={40}
                color={colors.success}
              />
              <Text style={[styles.noBillsText, { color: colors.textLight }]}>
                No upcoming bills! 🎉
              </Text>
            </View>
          ) : (
            <View>
              {["overdue", "due_today", "due_soon", "upcoming"].map(
                (category) => {
                  const categoryBills = upcomingBills.filter(
                    (bill) => bill.status_category === category,
                  );

                  if (categoryBills.length === 0) return null;

                  const categoryTitles = {
                    overdue: "Overdue Bills",
                    due_today: "Due Today",
                    due_soon: "Due Soon (Next 7 Days)",
                    upcoming: "Upcoming Bills",
                  };

                  return (
                    <View key={category}>
                      <Text
                        style={[
                          styles.categoryTitle,
                          {
                            color: getStatusColor(category),
                            backgroundColor: getStatusColor(category) + "20",
                            borderColor: getStatusColor(category) + "40",
                          },
                        ]}
                      >
                        {categoryTitles[category]} ({categoryBills.length})
                      </Text>

                      {categoryBills.slice(0, 3).map((bill) => {
                        const statusColor = getStatusColor(
                          bill.status_category,
                        );

                        return (
                          <TouchableOpacity
                            key={bill.id}
                            activeOpacity={0.85}
                            onPress={() =>
                              router.push({
                                pathname: "/(role)/(clienttabs)/subscriptions",
                                params: {
                                  focusSubscriptionId: bill.subscription_id,
                                  focusBillingId: bill.id,
                                },
                              })
                            }
                          >
                            <View
                              style={[
                                styles.billCard,
                                {
                                  backgroundColor: colors.surface,
                                  borderLeftWidth: 4,
                                  borderLeftColor: statusColor,
                                },
                              ]}
                            >
                              <View style={styles.billInfo}>
                                <View style={styles.billDetails}>
                                  <Text
                                    style={[
                                      styles.billTitle,
                                      { color: colors.text },
                                    ]}
                                  >
                                    {bill.plan_name || "Internet Bill"}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.billDate,
                                      { color: colors.textLight },
                                    ]}
                                  >
                                    Due: {formatDate(bill.due_date)}
                                    {bill.reference_number &&
                                      ` • Ref: ${bill.reference_number}`}
                                  </Text>
                                </View>

                                <View style={styles.billRight}>
                                  <Text
                                    style={[
                                      styles.billAmount,
                                      { color: colors.text },
                                    ]}
                                  >
                                    ₱
                                    {bill.amount_due?.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    ) || "0.00"}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.billStatus,
                                      { color: statusColor },
                                    ]}
                                  >
                                    {bill.status_text}
                                  </Text>
                                </View>
                              </View>

                              <TouchableOpacity
                                activeOpacity={0.9}
                                style={[
                                  styles.payNowButton,
                                  {
                                    backgroundColor:
                                      bill.status_category === "overdue"
                                        ? colors.danger
                                        : colors.primary,
                                  },
                                ]}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    "/(role)/(clienttabs)/subscriptions",
                                  );
                                }}
                              >
                                <Text style={styles.payNowText}>
                                  {bill.status_category === "overdue"
                                    ? "PAY OVERDUE"
                                    : "PAY NOW"}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                },
              )}
            </View>
          )}

          <CustomAlert {...alertConfig} />
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
};

// Gradient colors helper function - moved outside component but before styles
const getHeaderGradientColors = (effectiveMode) => {
  if (effectiveMode === "dark") {
    return ["#121212", "#1a4a4b", "#2d6c6d"];
  } else {
    return ["#F5F8FA", "#21C7B9", "#65f1e8"];
  }
};

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerGradient: {
    width: "100%",
    paddingBottom: 50,
  },
  header: {},
  headerContent: {
    paddingHorizontal: 20,
  },
  welcomeText: {
    top: 10,
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "800",
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  creditHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  creditLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    top: 30,
  },
  eyeButton: {
    padding: 4,
    left: 20,
    top: 30,
  },
  creditAmountContainer: {
    marginBottom: 16,
  },
  creditAmount: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    top: 20,
  },
  notificationIconContainer: {
    position: "relative",
    top: 10,
  },
  redDot: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  redDotText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  hiddenAmount: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 4,
    top: 20,
  },
  addCreditButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    maxWidth: 120,
    top: 20,
  },
  addCreditText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionContainer: {
    marginTop: 10,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  quickActionsContainer: {
    marginBottom: 1,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  quickActionCard: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
    borderRadius: 10,
  },
  emptyActionCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  promosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  promosScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 10,
  },
  promoCard: {
    borderRadius: 12,
    width: 280,
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promoImage: {
    width: "100%",
    height: 120,
  },
  promoInfo: {
    padding: 12,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  promoDescription: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  promoValid: {
    fontSize: 11,
    fontWeight: "600",
  },
  noPromosCard: {
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  noPromosText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  separate: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  billsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
    marginTop: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  noBillsCard: {
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  noBillsText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  billCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  billInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  billDetails: {
    flex: 1,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  billDate: {
    fontSize: 14,
  },
  billRight: {
    alignItems: "flex-end",
  },
  billAmount: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  billStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  payNowButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  payNowText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  bottomSpacer: {
    height: 20,
  },
  noInternetContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  noInternetContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  noInternetIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  noInternetTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  noInternetMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Home;
