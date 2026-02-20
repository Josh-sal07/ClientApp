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
    padding: scaleSize(8),
    bottom: scaleSize(120),
  },
  backButtonText: {
    fontSize: scaleSize(26),
    fontWeight: "900",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: scaleSize(60),
  },
  logo: {
    width: scaleSize(120),
    height: scaleSize(120),
    marginBottom: scaleSize(10),
  },
  appName: {
    fontSize: scaleSize(24),
    fontWeight: "700",
  },
  title: {
    fontSize: scaleSize(32),
    fontWeight: "700",
    marginBottom: scaleSize(8),
    textAlign: "center",
  },
  subtitle: {
    fontSize: scaleSize(16),
    marginBottom: scaleSize(40),
    textAlign: "center",
    lineHeight: scaleSize(22),
  },
  phoneNumberText: {
    fontWeight: "600",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: scaleSize(30),
  },
  label: {
    fontSize: scaleSize(14),
    fontWeight: "600",
    marginBottom: scaleSize(12),
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  countryCodeBox: {
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(14),
  },
  countryCodeText: {
    fontSize: scaleSize(16),
    fontWeight: "600",
  },
  separator: {
    width: 1,
    height: scaleSize(30),
  },
  phoneInput: {
    flex: 1,
    height: scaleSize(50),
    paddingHorizontal: scaleSize(16),
    fontSize: scaleSize(16),
  },
  exampleText: {
    fontSize: scaleSize(12),
    fontStyle: "italic",
    marginLeft: scaleSize(4),
    marginTop: scaleSize(8),
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scaleSize(20),
    width: "100%",
    maxWidth: 400,
    gap: scaleSize(8),
  },
  otpInput: {
    flex: 1,
    height: scaleSize(50),
    borderWidth: 1,
    borderRadius: 12,
    fontSize: scaleSize(20),
    textAlign: "center",
    marginHorizontal: scaleSize(2),
  },
  otpInputFilled: {
    // Border color will be applied dynamically
  },
  demoContainer: {
    marginBottom: scaleSize(20),
    padding: scaleSize(10),
    borderRadius: 8,
    borderWidth: 1,
  },
  demoText: {
    fontSize: scaleSize(14),
    textAlign: "center",
    fontStyle: "italic",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scaleSize(30),
  },
  resendText: {
    fontSize: scaleSize(14),
  },
  resendLink: {
    fontSize: scaleSize(14),
    fontWeight: "600",
  },
  resendLinkDisabled: {
    // Color will be applied dynamically
  },
  button: {
    width: "100%",
    paddingVertical: scaleSize(16),
    borderRadius: 12,
    alignItems: "center",
    marginTop: scaleSize(15),
    marginBottom: scaleSize(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: scaleSize(18),
    fontWeight: "600",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaleSize(10),
  },
  signInText: {
    fontSize: scaleSize(14),
  },
  signInButton: {
    paddingVertical: scaleSize(4),
    paddingHorizontal: scaleSize(12),
    borderRadius: 6,
  },
  signInButtonText: {
    fontSize: scaleSize(14),
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default styles;