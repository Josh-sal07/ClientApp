import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import * as LocalAuthentication from "expo-local-authentication";

import AnimatedSplash from "../components/AnimatedSplash";
import { ThemeProvider } from "../theme/ThemeContext";
import { useUserStore } from "../store/user";
import useSessionTimeout from "../hooks/useSessionTimeout";
import SessionExpiredModal from "../components/SessionExpiredModal";

// 🔒 GLOBAL GUARD
let splashShown = false;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const loadUser = useUserStore((s) => s.loadUser);

  const [showSplash, setShowSplash] = useState(!splashShown);
  const isUnlocked = useUserStore((s) => s.isUnlocked);
  const hasNavigated = useRef(false);
  const [isOffline, setIsOffline] = useState(false);

  // ✅ CONDITIONAL SESSION TIMEOUT - Only enabled when authenticated
  const { expired, setExpired } = useSessionTimeout({
    enabled: isUnlocked,
    timeoutMinutes: 15,
  });

  useEffect(() => {
    if (!showSplash) {
      checkAuth();
    }
  }, [showSplash]);

  const checkConnection = async () => {
    try {
      await fetch("https://staging.kazibufastnet.com", {
        method: "HEAD",
      });

      setIsOffline(false);
    } catch (error) {
      setIsOffline(true);
    }
  };

  useEffect(() => {
    // First check
    checkConnection();

    // Infinite checking every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    try {
      // Check if user has a token (is logged in)
      const token = await AsyncStorage.getItem("token");

      if (token) {
        // User is authenticated
        loadUser();
        router.replace("/(auth)/(login)");
        return;
      }

      // No token - check if phone number is stored (user has entered phone before)
      const storedPhone = await AsyncStorage.getItem("user_phone");

      if (storedPhone) {
        // User has previously entered a phone number - go to login
        router.replace("/(auth)/(login)/login");
      } else {
        // First time user - go to phone verification
        router.replace("/(auth)/(phone-verify)/phone-verify");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // On error, try to check for stored phone
      try {
        const storedPhone = await AsyncStorage.getItem("user_phone");
        if (storedPhone) {
          router.replace("/(auth)/(login)/login");
        } else {
          router.replace("/(auth)/(phone-verify)/phone-verify");
        }
      } catch {
        router.replace("/(auth)/(phone-verify)/phone-verify");
      }
    }
  };

  // Reset auth state when session expires
  const handleSessionExpired = () => {
    setExpired(false);
    useUserStore.getState().setUnlocked(false);
    router.replace("/(auth)/(login)/login");
  };

  if (showSplash) {
    return (
      <ThemeProvider>
        <AnimatedSplash
          onFinish={async () => {
            splashShown = true;
            setShowSplash(false);
            await SplashScreen.hideAsync();
          }}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />

      {isUnlocked && (
        <SessionExpiredModal
          visible={expired}
          onConfirm={handleSessionExpired}
        />
      )}

      {/* 🔴 OFFLINE OVERLAY */}
      {isOffline && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          pointerEvents="auto"
        >
          <View
            style={{
              width: "85%",
              backgroundColor: "#1E1E1E",
              padding: 25,
              borderRadius: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                color: "#fff",
                fontWeight: "600",
                marginBottom: 10,
              }}
            >
              No Internet Connection
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: "#aaa",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Please check your connection and try again.
            </Text>

            <Text
              onPress={checkConnection}
              style={{
                color: "#21C7B9",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Retry
            </Text>
          </View>
        </View>
      )}
    </ThemeProvider>
  );
}
