// components/CustomLoader.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../theme/ThemeContext';

export default function CustomLoaderIndicator({ text = "" }) {
  const { mode } = useTheme();
  const isDark = mode === "dark";

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: isDark ? "#222" : "#fff" }]}>
        {/* Animated circles */}
        <View style={styles.circleContainer}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            style={[styles.circle, { backgroundColor: "#1fe1cbff" }]}
          />
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            delay={200}
            style={[styles.circle, { backgroundColor: "#30514e" }]}
          />
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            delay={400}
            style={[styles.circle, { backgroundColor: "#19e2d1" }]}
          />
        </View>

        <Text style={[styles.text, { color: isDark ? "#fff" : "#000" }]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 9999,
  },
  container: {
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
  },
  circleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 80,
    marginBottom: 10,
  },
  circle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginHorizontal: 5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
