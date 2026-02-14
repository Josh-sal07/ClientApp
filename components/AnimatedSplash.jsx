import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  Easing,
} from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";

const { width, height } = Dimensions.get("window");

export default function AnimatedSplash({ onFinish }) {
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const enterpriseOpacity = useRef(new Animated.Value(0)).current;
  const poweredByOpacity = useRef(new Animated.Value(0)).current;
  const telecomOpacity = useRef(new Animated.Value(0)).current;

  // Loading dots animation
  const dotAnimations = useRef(
    Array.from({ length: 3 }, (_, i) => useRef(new Animated.Value(0)).current),
  ).current;

  useEffect(() => {
    SplashScreen.hideAsync();

    const dotAnimation = Animated.loop(
      Animated.stagger(
        200,
        dotAnimations.map((dot) =>
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        )
      )
    );

    Animated.sequence([
      // 🚀 ALL ENTER AT ONCE
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),

        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),

        Animated.timing(lineWidth, {
          toValue: 149,
          duration: 600,
          useNativeDriver: false,
        }),

        Animated.timing(enterpriseOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // ⏸ HOLD
      Animated.delay(1600),

      // 👋 EXIT TOGETHER
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(enterpriseOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      dotAnimation.stop();
      onFinish?.();
    });

    dotAnimation.start();

    return () => dotAnimation.stop();
  }, []);

  return (
    <View style={styles.container}>
      {/* UPDATED: Background Gradient - White at bottom to #20C7B9 at top */}
      <LinearGradient
        colors={["#20C7B9", "#FFFFFF"]} // Top to bottom: #20C7B9 → White
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}    // Start at top center
        end={{ x: 0.5, y: 1 }}      // End at bottom center
      />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Logo */}
        <Animated.Image
          source={require("../assets/images/kazi.png")}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        />

        {/* Main Brand Text - KAZIBUFAST */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            alignItems: "center",
            marginBottom: 1,
          }}
        >
          <Text style={styles.brandName}>
            <Text style={styles.kazibu}>KAZIBU</Text>
            <Text style={styles.fast}>FAST</Text>
          </Text>
        </Animated.View>

        {/* NETWORKS text with animated line */}
        <Animated.View style={styles.networkSection}>
          {/* Animated line */}
          <Animated.View 
            style={[
              styles.networkLine,
              { width: lineWidth }
            ]} 
          />
          <Text style={styles.networkText}>NETWORKS</Text>
        </Animated.View>

        {/* Tagline - PROVIDING SIMPLE SOLUTIONS */}
        <Animated.View style={[styles.taglineContainer, { opacity: enterpriseOpacity }]}>
          <Text style={styles.tagline}>"PROVIDING SIMPLE SOLUTIONS"</Text>
        </Animated.View>

        {/* Loading Dots */}
        <View style={styles.loadingContainer}>
          {dotAnimations.map((dotAnim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.loadingDot,
                {
                  transform: [
                    {
                      scale: dotAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 1.2, 0.8],
                      }),
                    },
                  ],
                  opacity: dotAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject, // Make gradient cover entire screen
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 20,
  },
  brandName: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  kazibu: {
    color: "#000000",
  },
  fast: {
    color: "#20C7B9",
  },
  networkSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  networkLine: {
    height: 20,
    backgroundColor: "#20C7B9",
    borderRadius: 1,
  },
  networkText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#000000",
    textTransform: "uppercase",
  },
  taglineContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333333",
    letterSpacing: 0.5,
    fontStyle: "italic",
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 30,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#20C7B9",
  },
});