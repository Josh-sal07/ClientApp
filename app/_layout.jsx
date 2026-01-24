import { useRouter } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useUserStore } from "../store/user";
import useSessionTimeout from "../hooks/useSessionTimeout";
import { ThemeProvider } from "../theme/ThemeContext";

export default function RootLayout() {
  const router = useRouter();
  const loadUser = useUserStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
    checkAuth();
  }, []);

  useSessionTimeout();

  const checkAuth = async () => {
    const phone = await AsyncStorage.getItem("phone");
    const pinSet = await AsyncStorage.getItem("pin_set");

    if (!phone) {
      router.replace("/(auth)/(phone-verify)/phone-verify");
    } else if (!pinSet) {
      router.replace("/(auth)/(setup-pin)/setup-pin");
    } else {
      router.replace("/(auth)/(login)/login");
    }
  };

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
