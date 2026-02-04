import { useRouter, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemeProvider } from "../theme/ThemeContext";
import { useUserStore } from "../store/user";
import useSessionTimeout from "../hooks/useSessionTimeout";
import * as LocalAuthentication from "expo-local-authentication";

export default function RootLayout() {
  const router = useRouter();
  const loadUser = useUserStore((s) => s.loadUser);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const hasNavigated = useRef(false);
  const isMounted = useRef(true);

  // 🔐 SESSION TIMEOUT TRACKING
  useSessionTimeout();

  // 🔄 HANDLE APP FOREGROUND (session + auth)
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;


      // 1️⃣ Check session expiration
      const expired = await AsyncStorage.getItem("session_expired");

      if (expired === "true") {
        await AsyncStorage.removeItem("session_expired");

        Alert.alert(
          "Session Timed Out",
          "Please login again.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(auth)/(login)/login");
              },
            },
          ],
          { cancelable: false },
        );
        return;
      }

      // 2️⃣ Re-check authentication
      hasNavigated.current = false;
      checkAuth();
    });

    return () => sub.remove();
  }, []);

  // 🔎 INITIAL AUTH CHECK
  useEffect(() => {
    isMounted.current = true;
    checkAuth();

    return () => {
      isMounted.current = false;
      hasNavigated.current = false;
    };
  }, []);

  // 🔐 AUTH DECISION LOGIC
  const checkAuth = async () => {
    if (hasNavigated.current) {
      return;
    }

    try {
      setIsCheckingAuth(true);

      const [phone, token] = await Promise.all([
        AsyncStorage.getItem("phone"),
        AsyncStorage.getItem("token"),
      ]);

      if (!isMounted.current) return;

      hasNavigated.current = true;

      if (!phone) {
        router.replace("/(auth)/(phone-verify)/phone-verify");
      } else if (!token) {
        await AsyncStorage.setItem("temp_phone", phone);
        router.replace("/(auth)/(login)/login");
      } else {
        // 🔐 BIOMETRIC GATE
        const biometricEnabled =
          await AsyncStorage.getItem("biometric_enabled");

        if (biometricEnabled === "true") {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Unlock with Biometrics",
            fallbackLabel: "Use MPIN",
          });

          if (!result.success) {
            // ⛔ Block auto-login → go to MPIN
            await AsyncStorage.setItem("temp_phone", phone);
            router.replace("/(auth)/(login)/login");
            return;
          }
        }

        await loadUser();
        router.replace("/(role)/(clienttabs)/home");
      }
    } catch (err) {

      if (!hasNavigated.current) {
        hasNavigated.current = true;
        router.replace("/(auth)/(login)/login");
      }
    } finally {
      if (isMounted.current) {
        setIsCheckingAuth(false);
      }
    }
  };

  // ⏳ SPLASH / LOADING
  if (isCheckingAuth) {
    return (
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    );
  }

  // 🚀 APP
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
