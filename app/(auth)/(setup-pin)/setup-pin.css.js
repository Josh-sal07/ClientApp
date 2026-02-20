import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const scaleSize = (size) => {
  const baseWidth = 375;
  const scale = width / baseWidth;
  return Math.round(size * Math.min(scale, 1.3));
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scaleSize(20),
    minHeight: "100%",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: scaleSize(20),
    padding: scaleSize(8),
  },
  backButtonText: {
    fontSize: scaleSize(26),
    fontWeight: "600",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: scaleSize(30),
  },
  logo: {
    width: scaleSize(80),
    height: scaleSize(80),
    marginBottom: scaleSize(10),
  },
  appName: {
    fontSize: scaleSize(22),
    fontWeight: "700",
  },
  title: {
    fontSize: scaleSize(28),
    fontWeight: "700",
    marginBottom: scaleSize(10),
    textAlign: "center",
  },
  subtitle: {
    fontSize: scaleSize(16),
    marginBottom: scaleSize(40),
    textAlign: "center",
    lineHeight: scaleSize(22),
    paddingHorizontal: scaleSize(20),
  },
  pinContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: scaleSize(30),
  },
  pinSection: {
    marginBottom: scaleSize(25),
  },
  pinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(15),
  },
  pinLabel: {
    fontSize: scaleSize(16),
    fontWeight: "600",
  },
  visibilityButton: {
    paddingVertical: scaleSize(4),
    paddingHorizontal: scaleSize(12),
    borderRadius: 6,
  },
  visibilityButtonText: {
    fontSize: scaleSize(12),
    fontWeight: "600",
  },
  pinInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: scaleSize(10),
    gap: scaleSize(8),
  },
  pinInput: {
    flex: 1,
    height: scaleSize(60),
    borderWidth: 1,
    borderRadius: 12,
    fontSize: scaleSize(22),
    textAlign: "center",
  },
  pinInputFilled: {
    // Border color will be applied dynamically
  },
  pinInputMatched: {
    // Border color will be applied dynamically
  },
  separator: {
    height: 1,
    marginVertical: scaleSize(15),
  },
  statusContainer: {
    alignItems: "center",
    marginTop: scaleSize(15),
    padding: scaleSize(10),
    borderRadius: 8,
  },
  statusText: {
    fontSize: scaleSize(14),
    textAlign: "center",
  },
  statusTextSuccess: {
    fontSize: scaleSize(14),
    fontWeight: "600",
    textAlign: "center",
  },
  statusTextError: {
    fontSize: scaleSize(14),
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    width: "100%",
    maxWidth: 400,
    paddingVertical: scaleSize(16),
    borderRadius: 12,
    alignItems: "center",
    marginBottom: scaleSize(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginTop: scaleSize(20),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: scaleSize(18),
    fontWeight: "600",
  },
});

export default styles;