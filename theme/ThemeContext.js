// theme/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState('system'); // system, light, dark
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (newMode) => {
    try {
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = (newMode) => {
    setMode(newMode);
    saveThemePreference(newMode);
  };

  // Define theme colors
  const themeColors = {
    light: {
      primary: "#21C7B9",
      secondary: "#00AFA1",
      dark: "#1b2e2c",
      white: "#FFFFFF",
      lightGray: "#F8F9FA",
      gray: "#718096",
      darkGray: "#1A202C",
      border: "#E2E8F0",
      success: "#00AFA1",
      warning: "#FFA726",
      danger: "#FF6B6B",
      facebook: "#1877F2",
      surface: "#FFFFFF",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
      tabBar: "#FFFFFF",
      tabBarBorder: "#E2E8F0",
      tabActive: "#21C7B9",
      tabInactive: "#8E8E93",
      floatingButton: "#1fe1cbff",
      floatingButtonBorder: "#FFFFFF",
      loadingIndicator: "#1fe1cbff",
      // Gradient colors
      gradientStart: "#98eced",
      gradientAlt1: "#65f1e8",
      gradientEnd: "#21c7c1",
      gradientAlt: "#1de7e3",
      tabBarGradientStart: "#98eced",
      tabBarGradientEnd: "#21c7c1",
      announcementBg: "#FFF5F5",
      announcementBorder: "#FF6B6B",
      billCardBg: "#FFFFFF",
    },
    dark: {
      primary: "#1f6f68",
      secondary: "#00AFA1",
      dark: "#121212",
      white: "#FFFFFF",
      lightGray: "#1E1E1E",
      gray: "#9E9E9E",
      darkGray: "#121212",
      border: "#333333",
      success: "#00AFA1",
      warning: "#FFA726",
      danger: "#FF6B6B",
      facebook: "#1877F2",
      surface: "#1E1E1E",
      background: "#121212",
      text: "#FFFFFF",
      textLight: "#B0B0B0",
      tabBar: "#1E1E1E",
      tabBarBorder: "#333333",
      tabActive: "#1fe1cbff",
      tabInactive: "#9E9E9E",
      floatingButton: "#1f6f68",
      floatingButtonBorder: "#333333",
      loadingIndicator: "#1fe1cbff",
      // Gradient colors (darker version)
      gradientStart: "#000000",
      gradientEnd: "#032829",
      gradientAlt: "#0b1515",
      gradientAlt1: "#032829",
      tabBarGradientStart: "#000000",
      tabBarGradientEnd: "#032829",
      announcementBg: "#2A1A1A",
      announcementBorder: "#FF6B6B",
      billCardBg: "#1E1E1E",
    },
  };

  // Determine effective theme
  const effectiveMode = mode === "system" ? systemColorScheme : mode;
  const colors = themeColors[effectiveMode === "dark" ? "dark" : "light"];

  const value = {
    mode,
    setMode: toggleTheme,
    theme: colors,
    colors, // Add colors for direct access
    isLoading,
  };

  if (isLoading) {
    // You can return a loading screen here if needed
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};