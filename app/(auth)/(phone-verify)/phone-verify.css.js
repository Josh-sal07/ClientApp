import { StyleSheet } from "react-native";

export default StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#0C1824",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
    width: "100%",
    maxWidth: 400,
  },
  countryCode: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
  },
  helper: {
    fontSize: 12,
    color: "#dcdcdc",
    marginTop: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#30BCBB",
    width: "100%",
    maxWidth: 400,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signInButtonText: {
    color: "#c5d1d1ff",
    fontWeight: "600",  
  },
  signInContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  signInText: {
    color: "#a69d9dff",
    marginRight: 8,
  },
});
