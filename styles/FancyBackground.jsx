import React from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Put your icon file path here relative to this file
const icon = require('../assets/images/kazi.png');

export default function FancyBackground({ children }) {
  // Generate 20 random icon instances
  const dynamicIcons = Array.from({ length: 7 }).map((_, i) => {
    const size = 20 + Math.random() * 60; // size between 20 and 80
    const top = Math.random() * (height - size);
    const left = Math.random() * (width - size);
    const opacity = 0.1 + Math.random() * 0.2;

    return (
      <Image
        key={`dynamic-icon-${i}`}
        source={icon}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          top,
          left,
          opacity,
        }}
        resizeMode="contain"
      />
    );
  });

  return (
    <View style={styles.container}>
      {/* Gradient */}
      <LinearGradient
        colors={['#1596a4ff', '#4b9dd4ff', '#2d1520ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dynamic icons */}
      {dynamicIcons}

      {/* Diagonal lines */}
      {/* <View style={[styles.line, { top: 80, left: 40 }]} />
      <View style={[styles.line, { top: 160, right: 60 }]} />
      <View style={[styles.line, { top: 260, left: 120 }]} />
      <View style={[styles.line, { top: 90, left: 60 }]} />
      <View style={[styles.line, { top: 110, right: 60 }]} />
      <View style={[styles.line, { top: 260, left: 120 }]} />
      <View style={[styles.line, { top: 80, left: 40 }]} />
      <View style={[styles.line, { top: 160, right: 60 }]} />
      <View style={[styles.line, { top: 260, left: 120 }]} /> */}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },

  /* 🔵 Fixed floating circles */
  circleSmall: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.35)',
    top: 40,
    left: 30,
  },
  circleMedium: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    top: 100,
    right: 70,
  },
  circleLarge: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(58, 255, 219, 0.2)',
    bottom: 20,
    right: 100,
  },
  circleExtraLarge: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: 150,
    left: 150,
  },
  circle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(58, 255, 219, 0.25)',
    bottom: 100,
    left: 80,
  },

  /* ✨ Diagonal streak lines */
  line: {
    position: 'absolute',
    width: 140,
    height: 1.5,
    backgroundColor: 'rgba(1, 248, 252, 0.35)',
    transform: [{ rotate: '-30deg' }],
  },
});
