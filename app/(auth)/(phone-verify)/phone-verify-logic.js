// phone-verify-logic.js
import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function usePhoneVerifyLogic() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  /* Format while typing */
  const formatPhone = (value) => {
    const clean = value.replace(/\D/g, "").slice(0, 10);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  };

  /* Masked display */
  const maskPhone = (value) => {
    const c = value.replace(/\D/g, "");
    return c.length === 10 ? `+63${c[0]}******${c.slice(-3)}` : "+63";
  };

  const handleSignIn = async () => {
    // Check if we have an existing phone number
    const existingPhone = await AsyncStorage.getItem("user_phone");
    if (existingPhone) {
      // Use existing phone for sign in - STILL NEED OTP
      router.replace({
        pathname: "/(auth)/(login)/login",
        params: { 
          phone: existingPhone,
          skipPinSetup: true // Skip PIN setup if PIN exists
        }
      });
    } else {
      // Clear any temp data and go to OTP
      await AsyncStorage.removeItem("temp_phone");
      router.replace("/(auth)/(login)/login");
    }
  };

  const handleSendOtp = async () => {
    const clean = phone.replace(/\D/g, "");

    if (!clean) return Alert.alert("Error", "Enter phone number");
    if (clean.length !== 10)
      return Alert.alert("Error", "Phone number must be 10 digits");
    if (!clean.startsWith("9"))
      return Alert.alert("Error", "Phone number must start with 9");

    try {
      setLoading(true);
      
      // Save phone permanently for future logins
      await AsyncStorage.setItem("user_phone", clean);
      
      // Also save temporarily for OTP verification
      await AsyncStorage.setItem("temp_phone", clean);

      // Check if this phone has existing PIN setup locally
      const localPinSet = await AsyncStorage.getItem(`pin_set_${clean}`);
      const hasLocalPin = localPinSet === "true";

      // Always send OTP, even if phone has PIN`
      const res = await fetch(
        "https://tub.kazibufastnet.com/api/app/verify_number",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_number: clean }),
        }
      );

      const data = await res.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to send OTP");
      }

      Alert.alert("OTP Sent", `Verification code sent to ${maskPhone(clean)}`);
      
      // Navigate to OTP verification with skipPinSetup flag if PIN exists
      router.replace({
        pathname: "/(auth)/(otp-verify)/otp-verify",
        params: { 
          phone: clean,
          skipPinSetup: hasLocalPin ? "true" : "false"
        },
      });
    } catch (e) {
      Alert.alert("Error", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return {
    phone,
    setPhone,
    loading,
    formatPhone,
    handleSendOtp,
    handleSignIn,
  };
}