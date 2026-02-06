import { 
  View, 
  Text, 
  Animated, 
  Dimensions, 
  StyleSheet,
  Easing 
} from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as SplashScreen from "expo-splash-screen";


const { width, height } = Dimensions.get("window");

export default function AnimatedSplash({ onFinish }) {
  // Multiple animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  
  // Particle animations
  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      x: useRef(new Animated.Value(Math.random() * width)).current,
      y: useRef(new Animated.Value(height)).current,
      scale: useRef(new Animated.Value(0)).current,
      opacity: useRef(new Animated.Value(0)).current,
    }))
  ).current;

  // Background pulse animation
  const bgScale = useRef(new Animated.Value(1)).current;

  // Loading dots animation
  const dotAnimations = useRef(
    Array.from({ length: 3 }, (_, i) => useRef(new Animated.Value(0)).current)
  ).current;

  useEffect(() => {
     SplashScreen.hideAsync();
    // Animate loading dots in loop
    const dotAnimation = Animated.loop(
      Animated.stagger(200, 
        dotAnimations.map(dot => 
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
          ])
        )
      )
    );

    // Start all animations in sequence
    Animated.sequence([
      // 1. Particle animation
      Animated.parallel(
        particles.map((particle, index) =>
          Animated.sequence([
            Animated.delay(index * 60), // Stagger particles
            Animated.parallel([
              Animated.timing(particle.y, {
                toValue: Math.random() * height * 0.5 + 100,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
              }),
              Animated.timing(particle.opacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.spring(particle.scale, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
              }),
            ]),
          ])
        )
      ),

      // 2. Logo entrance with rotation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(logoScale, {
          toValue: 1.2,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),

      // 3. Logo settle with bounce
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),

      // 4. Text animation
      Animated.parallel([
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
      ]),

      // 5. Background pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(bgScale, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(bgScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
        ]),
        { iterations: 2 }
      ),

      // 6. Start loading dots
      Animated.delay(500),

      // 7. Hold the splash
      Animated.delay(1200),

      // 8. Exit animations
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        // Particles fade out
        Animated.parallel(
          particles.map(particle =>
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          )
        ),
      ]),
    ]).start(() => {
      dotAnimation.stop();
      onFinish?.();
    });

    // Start loading dots animation
    dotAnimation.start();

    // Cleanup
    return () => {
      dotAnimation.stop();
    };
  }, []);

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Fixed interpolation - inputRange must be monotonically increasing
  const logoScaleInterpolate = logoScale.interpolate({
    inputRange: [0.8, 1, 1.2],
    outputRange: [0.8, 1, 1.2],
  });

  return (
    <View style={styles.container}>
      {/* Animated Background Gradient */}
      <Animated.View 
        style={[
          styles.background,
          {
            transform: [{ scale: bgScale }]
          }
        ]}
      >
        <LinearGradient
          colors={['#21C7B9', '#00AFA1', '#1B8A7F']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Subtle Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent']}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Floating Particles */}
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <View 
            style={[
              styles.particleInner,
              { 
                backgroundColor: index % 3 === 0 ? '#FFFFFF' : 
                                index % 3 === 1 ? '#B2EBF2' : '#80DEEA',
                width: 8 + (index % 4) * 3,
                height: 8 + (index % 4) * 3,
              }
            ]} 
          />
        </Animated.View>
      ))}

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Logo Container with Glow Effect */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logoGlow,
              {
                opacity: logoOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
                transform: [{ scale: logoScaleInterpolate }],
              },
            ]}
          />
          
          {/* Main Logo */}
          <Animated.Image
            source={require("../assets/images/kazi.png")}
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: logoScale },
                  { rotate: logoRotation },
                ],
              },
            ]}
          />
        </View>

        {/* App Name */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          }}
        >
          <Text style={styles.appName}>KAZIBUFAST</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.tagline}>Fast. Reliable. Secure.</Text>
          <View style={styles.underline} />
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
    backgroundColor: '#21C7B9',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: 0.5,
    opacity: 0.9,
    marginBottom: 4,
  },
  underline: {
    width: 50,
    height: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 30,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  particle: {
    position: 'absolute',
  },
  particleInner: {
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
    justifyContent:'center'
  },
  watermark: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '300',
    marginBottom: 2,
  },
  version: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '300',
  },
});