import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/ThemeContext";

const CustomAlert = ({
  visible,
  title,
  message,
  type = "info",
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText,
}) => {
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  const COLORS = {
    light: {
      primary: "#21C7B9",
      success: "#00AFA1",
      warning: "#FFA726",
      danger: "#FF6B6B",
      surface: "#FFFFFF",
      background: "#F8FAFC",
      text: "#136350",
      textLight: "#475569",
      border: "#E2E8F0",
      overlay: "rgba(0,0,0,0.55)",
      white: "#FFFFFF",
    },
    dark: {
      primary: "#4FD1C5",
      success: "#4FD1C5",
      warning: "#FBBF24",
      danger: "#F87171",
      surface: "#1E293B",
      background: "#0F172A",
      text: "#F1F5F9",
      textLight: "#CBD5E1",
      border: "#334155",
      overlay: "rgba(0,0,0,0.7)",
      white: "#FFFFFF",
    },
  };

  const colors = effectiveMode === "dark" ? COLORS.dark : COLORS.light;

  const getColor = () => {
    switch (type) {
      case "success":
        return colors.success;
      case "error":
        return colors.danger;
      case "warning":
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "checkmark";
      case "error":
        return "close";
      case "warning":
        return "alert";
      default:
        return "information";
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getColor() + "15" },
            ]}
          >
            <LinearGradient
              colors={[getColor(), colors.primary]}
              style={styles.iconGradient}
            >
              <Ionicons
                name={getIcon()}
                size={32}
                color={colors.white}
              />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textLight }]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {cancelText && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={onClose}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: getColor() },
              ]}
              onPress={onConfirm || onClose}
            >
              <Text style={styles.confirmText}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  iconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "900",
  },
});
