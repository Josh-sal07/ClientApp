import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const scaleSize = (size) => {
  const baseWidth = 375;
  const scale = width / baseWidth;
  return Math.round(size * Math.min(scale, 1.3));
};

export default StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: scaleSize(20),
  },
  logo: {
    width: scaleSize(120),
    height: scaleSize(120),
    marginBottom: scaleSize(20),
  },
  title: {
    fontSize: scaleSize(28),
    fontWeight: "700",
    marginBottom: scaleSize(20),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
    maxWidth: 400,
  },
  countryCode: {
    paddingHorizontal: scaleSize(16),
    fontSize: scaleSize(16),
    fontWeight: "600",
  },
  input: {
    flex: 1,
    height: scaleSize(50),
    paddingHorizontal: scaleSize(12),
    fontSize: scaleSize(16),
  },
  helper: {
    fontSize: scaleSize(12),
    marginTop: scaleSize(8),
    marginBottom: scaleSize(20),
  },
  button: {
    width: "100%",
    maxWidth: 400,
    paddingVertical: scaleSize(16),
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: scaleSize(16),
    fontWeight: "600",
  },
  signInContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scaleSize(20),
  },
  signInText: {
    marginRight: scaleSize(8),
  },
  signInLink: {
    fontWeight: "600",
  },
});