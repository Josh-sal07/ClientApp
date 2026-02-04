// sharedScroll.js
import { Animated } from "react-native";

// Create and export a shared scrollY value
export const sharedScrollY = new Animated.Value(0);

// Optional: Helper function to reset scrollY
export const resetScrollY = () => {
  sharedScrollY.setValue(0);
};