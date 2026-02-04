import { useEffect } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_TIMEOUT = 1 * 60 * 1000; // 1 minute 

export default function useSessionTimeout() {
  useEffect(() => {
    let currentState = AppState.currentState;

    const handleAppStateChange = async (nextState) => {
      // App going to background → save time
      if (currentState === "active" && nextState.match(/inactive|background/)) {
        await AsyncStorage.setItem(
          "last_active_time",
          Date.now().toString()
        );
      }

      // App coming back
      if (currentState.match(/inactive|background/) && nextState === "active") {
        const lastActive = await AsyncStorage.getItem("last_active_time");
        const token = await AsyncStorage.getItem("token");

        if (lastActive && token) {
          const diff = Date.now() - parseInt(lastActive, 10);

          if (diff > SESSION_TIMEOUT) {

            // 🔥 mark session expired
            await AsyncStorage.setItem("session_expired", "true");

            // clear auth
            await AsyncStorage.multiRemove([
              "token",
              "user",
              "last_active_time",
            ]);
          }
        }
      }

      currentState = nextState;
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, []);
}
