import { AppState } from "react-native";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TIMEOUT = 60 * 1000;

export default function useSessionTimeout({ enabled = true } = {}) {
  const appState = useRef(AppState.currentState);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!enabled) return; // 🔥 STOP on login page

    const handleChange = async (nextState) => {
      if (appState.current === "active" && nextState !== "active") {
        await AsyncStorage.setItem("bgTime", Date.now().toString());
      }

      if (appState.current !== "active" && nextState === "active") {
        const last = await AsyncStorage.getItem("bgTime");
        if (last && Date.now() - Number(last) >= TIMEOUT) {
          await AsyncStorage.removeItem("token");
          setExpired(true);
        }
      }

      appState.current = nextState;
    };

    const sub = AppState.addEventListener("change", handleChange);
    return () => sub.remove();
  }, [enabled]); // 👈 important

  return { expired, setExpired };
}
