import { useRef, useMemo } from "react";
import { Animated } from "react-native";

export const useHideTabBarOnScroll = () => {
  const scrollY = useRef(new Animated.Value(0)).current;

  // This interpolation controls the tab bar visibility
  // Negative values to hide tab bar upwards
  const tabBarTranslateY = useMemo(() => 
    scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [0, -100], // Changed to negative to hide upwards
      extrapolate: "clamp",
    }),
    [scrollY]
  );

  // Add opacity animation for smoother effect
  const tabBarOpacity = useMemo(() => 
    scrollY.interpolate({
      inputRange: [0, 30, 50],
      outputRange: [1, 0.5, 0],
      extrapolate: "clamp",
    }),
    [scrollY]
  );

  return { 
    scrollY, 
    tabBarTranslateY, 
    tabBarOpacity 
  };
};