import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useUserStore = create((set) => ({
  user: null,
  hydrated: false, // ✅ important

  // ✅ sync state update
  setUser: (userObj) => {
    set({ user: userObj });
    AsyncStorage.setItem("user", JSON.stringify(userObj));
  },

  // ✅ never throw, always resolve
  loadUser: async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (stored) {
        set({
          user: JSON.parse(stored),
          hydrated: true,
        });
      } else {
        set({
          user: null,
          hydrated: true,
        });
      }
    } catch (e) {
      console.log("loadUser failed:", e);
      set({
        user: null,
        hydrated: true,
      });
    }
  },

  // ✅ logout only — do NOT touch phone unless logging out
  clearUser: async () => {
    await AsyncStorage.multiRemove(["user", "token"]);
    set({ user: null });
  },
}));
