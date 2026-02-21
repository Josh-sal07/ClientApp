import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { usePathname } from "expo-router";

import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  useColorScheme,
} from "react-native";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sharedScrollY, resetScrollY } from "../../../shared/sharedScroll";
import ChatBot from "../../../components/overlay";

const { width } = Dimensions.get("window");

export default function ClientTabsLayout() {
  const router = useRouter();
  const { mode, theme } = useTheme();
  const systemColorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const scrollDirection = useRef("up"); // 'up' or 'down'
  const lastScrollY = useRef(0);
  const scrollIdleTimer = useRef(null);
  const pathname = usePathname();
  const isQrScreen = pathname.includes("qrscanner");

  // Track if layout is mounted
  const [isMounted, setIsMounted] = useState(false);

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
      textLoading: "#1fe1cbff",
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
      textLoading: "#1fe1cbff",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  // Animation values
  const [floatingButtonAnim] = useState(new Animated.Value(1));
  const [floatingButtonTranslateY] = useState(new Animated.Value(0));

  // Use the shared scrollY
  const scrollY = sharedScrollY;

  const tabBarAnim = useRef(new Animated.Value(0)).current;
  const qrButtonAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden

  useEffect(() => {
    if (pathname.includes("/home")) setCurrentRoute("home");
    else if (pathname.includes("/subscriptions"))
      setCurrentRoute("subscriptions");
    else if (pathname.includes("/tickets")) setCurrentRoute("tickets");
    else if (pathname.includes("/account")) setCurrentRoute("account");
  }, [pathname]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const currentY = value;

      // 🔁 CLEAR previous idle timer
      if (scrollIdleTimer.current) {
        clearTimeout(scrollIdleTimer.current);
      }

      // ⏱️ START idle timer (3 seconds)
      scrollIdleTimer.current = setTimeout(() => {
        Animated.timing(tabBarAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();

        Animated.timing(qrButtonAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }, 1000);

      // ✅ ALWAYS SHOW when at top
      if (currentY <= 0) {
        Animated.timing(tabBarAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();

        Animated.timing(qrButtonAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();

        lastScrollY.current = 0;
        return;
      }

      // ⬇️ scrolling DOWN → hide
      if (currentY > lastScrollY.current + 1) {
        Animated.timing(tabBarAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();

        Animated.timing(qrButtonAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }

      // ⬆️ scrolling UP → show
      if (currentY < lastScrollY.current - 1) {
        Animated.timing(tabBarAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();

        Animated.timing(qrButtonAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }

      lastScrollY.current = currentY;
    });

    return () => {
      if (scrollIdleTimer.current) {
        clearTimeout(scrollIdleTimer.current);
      }
      scrollY.removeListener(id);
    };
  }, []);

  // Track current route to prevent double navigation
  const [currentRoute, setCurrentRoute] = useState("home");
  const [isNavigating, setIsNavigating] = useState(false);

  // Loading line animation
  const loadingLineAnim = useRef(new Animated.Value(0)).current;
  const [showLoadingLine, setShowLoadingLine] = useState(false);

  // Calculate tab bar height with safe area
  const tabBarHeight = 60;
  const totalTabBarHeight = tabBarHeight + insets.bottom;

  // Set mounted state when component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset tab bar when switching tabs
  useEffect(() => {
    resetScrollY();

    Animated.timing(tabBarAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();

    Animated.timing(qrButtonAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [currentRoute]);

  // Start loading line animation
  const startLoadingLine = () => {
    setShowLoadingLine(true);
    loadingLineAnim.setValue(0);

    Animated.timing(loadingLineAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setTimeout(() => {
          setShowLoadingLine(false);
        }, 100);
      }
    });
  };

  // Handle QR scanner press
  const handleQrPress = () => {
    if (isNavigating || !isMounted) return;

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

    // Reset scrollY to show tab bar
    resetScrollY();

    // Show loading indicator for 1 second, then navigate
    setTimeout(() => {
      if (isMounted) {
        router.push("/(clienttabs)/qrscanner");
        // Hide loading after navigation completes
        setTimeout(() => {
          setIsNavigating(false);
        }, 300);
      } else {
        setIsNavigating(false);
      }
    }, 1000);
  };

  // Handle regular tab press
  const handleTabPress = (routeName) => {
    // Prevent double navigation or navigation before mount
    if (isNavigating || currentRoute === routeName || !isMounted) return;

    setIsNavigating(true);
    setCurrentRoute(routeName);
    startLoadingLine();

    // Reset scrollY to show tab bar when switching tabs
    resetScrollY();

    // Show loading indicator for 1 second, then navigate
    setTimeout(() => {
      if (isMounted) {
        router.push(`/(clienttabs)/${routeName}`);
        // Hide loading after navigation completes
        setTimeout(() => {
          setIsNavigating(false);
        }, 300);
      } else {
        setIsNavigating(false);
      }
    }, 1000);
  };

  // Custom Tab Label Component
  const CustomTabLabel = ({ children, color, focused }) => {
    return (
      <Text
        style={[styles.tabLabel, { color }, focused && styles.tabLabelFocused]}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {children}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={effectiveMode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      {!isQrScreen && <ChatBot />}

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
              transform: [
                {
                  translateY: tabBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 100], // Adjust this value based on your tab bar height
                  }),
                },
              ],
              opacity: tabBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              backgroundColor: colors.tabBar,
              borderTopColor: colors.tabBarBorder,
              height: totalTabBarHeight,
              paddingBottom: insets.bottom,
              paddingHorizontal: 4,
            },
          ],
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: {
            paddingTop: 4, // reduce this to move icon higher
            paddingBottom: 2,
          },
        }}
      >
        {/* Home Tab */}
        <Tabs.Screen
          name="home/index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="home" size={focused ? 32 : 28} color={color} style={{ marginTop: -10 }} />
            ),
            tabBarLabel: ({ color, children, focused }) => (
              <CustomTabLabel color={color} focused={focused}>
                {children}
              </CustomTabLabel>
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
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="receipt" size={focused ? 32 : 28} color={color}  style={{ marginTop: -10 }} />
            ),
            tabBarLabel: ({ color, children, focused }) => (
              <CustomTabLabel color={color} focused={focused}>
                {children}
              </CustomTabLabel>
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
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="ticket" size={focused ? 32 : 28} color={color} style={{ marginTop: -10 }} />
            ),
            tabBarLabel: ({ color, children, focused }) => (
              <CustomTabLabel color={color} focused={focused}>
                {children}
              </CustomTabLabel>
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
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="person" size={focused ? 32 : 28} color={color}  style={{ marginTop: -10 }}/>
            ),
            tabBarLabel: ({ color, children, focused }) => (
              <CustomTabLabel color={color} focused={focused}>
                {children}
              </CustomTabLabel>
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

      {/* Loading Indicator */}
      {isNavigating && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <ActivityIndicator size="large" color={colors.loadingIndicator} />
            <Text style={[styles.loadingText, { color: colors.textLoading }]}>
              Loading...
            </Text>
          </View>
        </View>
      )}

      {/* Floating QR Code Scanner Button */}
      {!isQrScreen && (
        <Animated.View
          style={[
            styles.floatingButtonContainer,
            {
              transform: [
                { scale: floatingButtonAnim },
                {
                  translateY: qrButtonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 120],
                  }),
                },
              ],
              opacity: qrButtonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              bottom: insets.bottom + 8,
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
              <Ionicons name="qr-code" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text
            style={[styles.floatingButtonLabel, { color: colors.textLight }]}
          >
            Scan
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    paddingTop: 8,
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
    fontSize: 8,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    width: "100%",
    includeFontPadding: false,
  },
  tabLabelFocused: {
    fontWeight: "800",
  },
  tabItem: {
    paddingVertical: 4,
    paddingHorizontal: 1,
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
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
    zIndex: 9998,
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
