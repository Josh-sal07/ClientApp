import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useUserStore = create((set) => ({
  user: null,

  setUser: async (userObj) => {
    await AsyncStorage.setItem("user", JSON.stringify(userObj));
    set({ user: userObj });
  },

  loadUser: async () => {
    const stored = await AsyncStorage.getItem("user");
    if (stored) {
      set({ user: JSON.parse(stored) });
    }
  },

  clearUser: async () => {
    await AsyncStorage.multiRemove(["user", "phone", "pin_set"]);
    set({ user: null });
  },
  
}));
