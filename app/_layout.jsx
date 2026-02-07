import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import * as LocalAuthentication from "expo-local-authentication";

import AnimatedSplash from "../components/AnimatedSplash";
import { ThemeProvider } from "../theme/ThemeContext";
import { useUserStore } from "../store/user";
import useSessionTimeout from "../hooks/useSessionTimeout";

// 🔒 GLOBAL GUARD — survives remounts
let splashShown = false;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const loadUser = useUserStore((s) => s.loadUser);

  const [showSplash, setShowSplash] = useState(!splashShown);
  const hasNavigated = useRef(false);

  useEffect(() => {
  if (!showSplash) {
    checkAuth();
  }
}, [showSplash]);


  useSessionTimeout();

  const checkAuth = async () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/(login)/login");
        return;
      }

      const biometricEnabled = await AsyncStorage.getItem("biometric_enabled");
      if (biometricEnabled === "true") {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock with Biometrics",
          fallbackLabel: "Use MPIN",
        });

        if (!result.success) {
          router.replace("/(auth)/(login)/login");
          return;
        }
      }

      loadUser();
      router.replace("/(role)/(clienttabs)/home");
    } catch {
      router.replace("/(auth)/(login)/login");
    }
  };

  if (showSplash) {
    return (
      <ThemeProvider>
        <AnimatedSplash
          onFinish={async () => {
            splashShown = true;     // ✅ prevents re-show
            setShowSplash(false);
            await checkAuth();
            await SplashScreen.hideAsync();
          }}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
