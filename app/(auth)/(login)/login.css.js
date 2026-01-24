import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const scaleSize = (size) => {
  const baseWidth = 375;
  const scale = width / baseWidth;
  return Math.round(size * Math.min(scale, 1.3));
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0C1824",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scaleSize(20),
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    marginBottom: scaleSize(10),
  },
  logoTextContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontWeight: "700",
    color: "#00afa1ff",
    letterSpacing: scaleSize(1),
  },
  phoneSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  phoneNumber: {
    fontWeight: "600",
    color: "#f1f1f1ff",
    marginRight: scaleSize(10),
  },
  mpinContainer: {
    alignItems: "center",
    width: '100%',
    position: 'relative',
  },
  securityWarning: {
    color: "#e9e9e9ff",
    textAlign: "center",
    lineHeight: scaleSize(20),
    maxWidth: "90%",
  },
  mpinDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: 'relative',
  },
  mpinDotContainer: {
    alignItems: "center",
    position: "relative",
    justifyContent: 'space-evenly',
    padding: 3
  },
  mpinDot: {
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#0C1824",
    justifyContent: "center",
    alignItems: "center",
  },
  mpinDotFilled: {
    backgroundColor: "#00AFA1",
    borderColor: "#00AFA1",
  },
  mpinDotInner: {
    backgroundColor: "#fff",
  },
  keypadWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxHeight: 300,
  },
  keypadContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 300,
  },
  keypadKey: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  keypadKeyEmpty: {
    backgroundColor: "transparent",
  },
  keypadKeyText: {
    color: "#333",
    fontWeight: "600",
  },
  keypadKeyTextBackspace: {
    color: "#666",
    fontWeight: "600",
  },
  keypadKeyBackspace: {
    backgroundColor: "#f5f5f5",
  },
  keypadKeyDisabled: {
    backgroundColor: "#f0f0f0",
    opacity: 0.6,
  },
  keypadKeyTextDisabled: {
    color: "#999",
  },
  bottomSection: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  forgotMpinButton: {
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(20),
  },
  forgotMpinText: {
    color: "#00AFA1",
    fontWeight: "500",
  },
  disabledText: {
    color: "#666",
    opacity: 0.6,
  },
  shakeAnimation: {
    animationKeyframes: {
      '0%': { transform: [{ translateX: 0 }] },
      '25%': { transform: [{ translateX: -10 }] },
      '50%': { transform: [{ translateX: 10 }] },
      '75%': { transform: [{ translateX: -10 }] },
      '100%': { transform: [{ translateX: 0 }] },
    },
    animationDuration: '300ms',
    animationIterationCount: 2,
  },
  skeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 24, 36, 0.8)',
    borderRadius: 10,
    zIndex: 10,
  },
  skeletonLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  skeletonLoadingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00AFA1',
    marginHorizontal: 8,
    opacity: 0.6,
  },
  skeletonLoadingText: {
    color: '#00AFA1',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  skeletonDot: {
    backgroundColor: '#ddd',
    opacity: 0.6,
  },
  verifyingOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10,
},
verifyingText: {
  color: "#fff",
  fontSize: 18,
  marginTop: 15,
  fontWeight: "600",
},

});

export default styles;