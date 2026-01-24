import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Text,
  useColorScheme,
} from "react-native";
import { useRef, useState, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function ClientTabsLayout() {
  const router = useRouter();
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();

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
      facebook: "#1877F2",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
      surface: "#FFFFFF",
      tabBar: "#FFFFFF",
      tabBarBorder: "#E2E8F0",
      tabActive: "#21C7B9",
      tabInactive: "#8E8E93",
      floatingButton: "#1fe1cbff",
      floatingButtonBorder: "#FFFFFF",
      loadingIndicator: "#1fe1cbff",
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
      text: "#141414",
      textLight: "#B0B0B0",
      surface: "#1E1E1E",
      tabBar: "#1E1E1E",
      tabBarBorder: "#333333",
      tabActive: "#1fe1cbff",
      tabInactive: "#9E9E9E",
      floatingButton: "#1f6f68",
      floatingButtonBorder: "#333333",
      loadingIndicator: "#1fe1cbff",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  // Animation values
  const [floatingButtonAnim] = useState(new Animated.Value(1));
  const [floatingButtonTranslateY] = useState(new Animated.Value(0));

  // Tab bar animation for hide/show
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50;

  // Track current route to prevent double navigation
  const [currentRoute, setCurrentRoute] = useState("home");
  const [isNavigating, setIsNavigating] = useState(false);

  // Loading line animation
  const loadingLineAnim = useRef(new Animated.Value(0)).current;
  const [showLoadingLine, setShowLoadingLine] = useState(false);

  // Start loading line animation
  const startLoadingLine = () => {
    setShowLoadingLine(true);
    loadingLineAnim.setValue(0);

    Animated.timing(loadingLineAnim, {
      toValue: 1,
      duration: 1000, // 1 second animation
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        // Hide loading line after animation completes
        setTimeout(() => {
          setShowLoadingLine(false);
        }, 100);
      }
    });
  };

  // Handle QR scanner press
  const handleQrPress = () => {
    if (isNavigating) return;

    setIsNavigating(true);
    startLoadingLine();

    // Pulsing animation for floating button
    Animated.sequence([
      Animated.timing(floatingButtonAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(floatingButtonAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Show tab bar if hidden
    if (!tabBarVisible) {
      showTabBar();
    }

    // Show loading indicator for 1 second, then navigate
    setTimeout(() => {
      router.push("/(clienttabs)/qrscanner");
      // Hide loading after navigation completes
      setTimeout(() => {
        setIsNavigating(false);
      }, 300);
    }, 1000);
  };

  // Handle regular tab press
  const handleTabPress = (routeName) => {
    // Prevent double navigation
    if (isNavigating || currentRoute === routeName) return;

    setIsNavigating(true);
    setCurrentRoute(routeName);
    startLoadingLine();

    // Show tab bar if hidden
    if (!tabBarVisible) {
      showTabBar();
    }

    // Show loading indicator for 1 second, then navigate
    setTimeout(() => {
      router.push(`/(clienttabs)/${routeName}`);
      // Hide loading after navigation completes
      setTimeout(() => {
        setIsNavigating(false);
      }, 300);
    }, 1000);
  };

  // Hide/show tab bar based on scroll
  const handleScroll = useCallback(
    (event) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDirection =
        currentScrollY > lastScrollY.current ? "down" : "up";
      const scrollDistance = Math.abs(currentScrollY - lastScrollY.current);

      if (scrollDistance > scrollThreshold) {
        if (scrollDirection === "down" && tabBarVisible) {
          hideTabBar();
        } else if (scrollDirection === "up" && !tabBarVisible) {
          showTabBar();
        }
      }

      lastScrollY.current = currentScrollY;
    },
    [tabBarVisible],
  );

  const hideTabBar = () => {
    setTabBarVisible(false);
    Animated.parallel([
      Animated.timing(tabBarTranslateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(floatingButtonTranslateY, {
        toValue: 150,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showTabBar = () => {
    setTabBarVisible(true);
    Animated.parallel([
      Animated.timing(tabBarTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(floatingButtonTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Simplified swipe gesture handler - only for horizontal swipes
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to clear horizontal swipes
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeDistance = gestureState.dx;

        // Define tab order for swiping
        const tabOrder = ["home", "subscriptions", "tickets", "account"];
        const currentIndex = tabOrder.indexOf(currentRoute);

        if (swipeDistance < -30 && currentIndex < tabOrder.length - 1) {
          // Swipe left - go to next tab
          handleTabPress(tabOrder[currentIndex + 1]);
        } else if (swipeDistance > 30 && currentIndex > 0) {
          // Swipe right - go to previous tab
          handleTabPress(tabOrder[currentIndex - 1]);
        }
      },
    }),
  ).current;

  // Floating dynamic icons
  const dynamicIcons = Array.from({ length: 7 }).map((_, i) => {
    const size = 20 + Math.random() * 60;
    const top = Math.random() * (height - size);
    const left = Math.random() * (width - size);
    const opacity =
      effectiveMode === "dark"
        ? 0.02 + Math.random() * 0.05
        : 0.05 + Math.random() * 0.1;
    return (
      <Image
        key={`dynamic-icon-${i}`}
        style={{
          position: "absolute",
          width: size,
          height: size,
          top,
          left,
          opacity,
          tintColor: colors.primary,
        }}
        resizeMode="contain"
      />
    );
  });

  return (
    <SafeAreaView
      style={[styles.safearea, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={effectiveMode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.primary}
      />

      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        {...panResponder.panHandlers}
      >
        {/* Loading Line at the very top */}
        {showLoadingLine && (
          <View style={styles.loadingLineContainer}>
            <Animated.View
              style={[
                styles.loadingLine,
                {
                  backgroundColor: colors.loadingIndicator,
                  transform: [
                    {
                      translateX: loadingLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-width, width],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        )}

        {/* Main content */}
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: [
              styles.tabBar,
              {
                transform: [{ translateY: tabBarTranslateY }],
                opacity: tabBarVisible ? 1 : 0,
                backgroundColor: colors.tabBar,
                borderTopColor: colors.tabBarBorder,
              },
            ],
            tabBarActiveTintColor: colors.tabActive,
            tabBarInactiveTintColor: colors.tabInactive,
            tabBarLabelStyle: styles.tabLabel,
            tabBarItemStyle: styles.tabItem,
          }}
        >
          {/* Home Tab */}
          <Tabs.Screen
            name="home/index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
            }}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                handleTabPress("home");
              },
            }}
          />

          {/* Subscriptions Tab */}
          <Tabs.Screen
            name="subscriptions/index"
            options={{
              title: "Subscriptions",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="receipt" size={size} color={color} />
              ),
            }}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                handleTabPress("subscriptions");
              },
            }}
          />

          {/* QR Scanner Tab - Hidden from tab bar */}
          <Tabs.Screen
            name="qrscanner/index"
            options={{
              title: "Scan",
              tabBarStyle: { display: "none" },
              tabBarButton: () => null,
            }}
          />

          {/* Tickets Tab */}
          <Tabs.Screen
            name="tickets/index"
            options={{
              title: "Tickets",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="ticket" size={size} color={color} />
              ),
            }}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                handleTabPress("tickets");
              },
            }}
          />

          {/* Account Tab */}
          <Tabs.Screen
            name="account/index"
            options={{
              title: "Account",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
              ),
            }}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                handleTabPress("account");
              },
            }}
          />
        </Tabs>

        {/* Loading Indicator - Semi-transparent overlay */}
        {isNavigating && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.loadingIndicator} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading...
              </Text>
            </View>
          </View>
        )}

        {/* Floating QR Code Scanner Button */}
        <Animated.View
          style={[
            styles.floatingButtonContainer,
            {
              transform: [
                { scale: floatingButtonAnim },
                { translateY: floatingButtonTranslateY },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.floatingButton,
              {
                backgroundColor: colors.floatingButton,
                borderColor: colors.floatingButtonBorder,
              },
            ]}
            onPress={handleQrPress}
            activeOpacity={0.8}
            disabled={isNavigating}
          >
            <View style={styles.floatingButtonInner}>
              <Ionicons name="qr-code" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text
            style={[styles.floatingButtonLabel, { color: colors.textLight }]}
          >
            Scan
          </Text>
        </Animated.View>

        {/* Dynamic floating icons */}
        {dynamicIcons}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  // Loading Line Styles
  loadingLineContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 9999,
    overflow: "hidden",
  },
  loadingLine: {
    height: "100%",
    width: "100%",
    borderRadius: 2,
  },
  tabBar: {
    height: 60,
    paddingBottom: 9,
    paddingTop: 0,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 0,
  },
  tabItem: {
    paddingVertical: 6,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9998, // Below loading line
  },
  loadingContainer: {
    backgroundColor: "rgb(255, 255, 255)",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "600",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 999,
  },
  floatingButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 15,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 4,
  },
  floatingButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  floatingButtonLabel: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 5,
  },
});
