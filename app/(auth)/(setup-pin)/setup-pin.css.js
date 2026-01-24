import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0C1824",
    minHeight: "100%",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    padding: 8,
  },
  backButtonText: {
    color: "#00afa1ff",
    fontSize: 26,
    fontWeight: "600",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#00afa1ff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    color: "#ffffffff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#f8f8f8ff",
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  pinContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 30,
  },
  pinSection: {
    marginBottom: 25,
  },
  pinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f0f0f0ff",
  },
  visibilityButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  visibilityButtonText: {
    color: "#00afa1ff",
    fontSize: 12,
    fontWeight: "600",
  },
  pinInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  pinInput: {
    width: 48,
    height: 60,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 22,
    backgroundColor: "#f9f9f9",
    textAlign: "center",
  },
  pinInputFilled: {
    borderColor: "#00afa1ff",
    backgroundColor: "#fff",
  },
  pinInputMatched: {
    borderColor: "#4CAF50",
    backgroundColor: "#f8fff8",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  statusContainer: {
    alignItems: "center",
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  statusTextSuccess: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "center",
  },
  statusTextError: {
    fontSize: 14,
    color: "#f44336",
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#30BCBB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#00afa1ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default styles;
