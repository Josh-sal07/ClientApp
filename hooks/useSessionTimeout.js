import { useEffect } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const SESSION_TIMEOUT = 60 * 1000; // ⏱ 1 minute

export default function useSessionTimeout() {
  const router = useRouter();

  useEffect(() => {
    let currentState = AppState.currentState;

    const handleAppStateChange = async (nextState) => {
      if (currentState === "active" && nextState.match(/inactive|background/)) {
        // 🔴 App going to background → save timestamp
        await AsyncStorage.setItem(
          "last_active_time",
          Date.now().toString()
        );
      }

      if (currentState.match(/inactive|background/) && nextState === "active") {
        // 🟢 App coming back → check timeout
        const lastActive = await AsyncStorage.getItem("last_active_time");

        if (lastActive) {
          const diff = Date.now() - parseInt(lastActive, 10);

          if (diff > SESSION_TIMEOUT) {
            // ⛔ Force logout
            await AsyncStorage.multiRemove([
              "phone",
              "pin_set",
              "last_active_time",
            ]);

            router.replace("/(auth)/(login)/login");
          }
        }
      }

      currentState = nextState;
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);

    return () => sub.remove();
  }, []);
}
