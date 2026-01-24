import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function usePhoneVerifyLogic() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
    if (phoneNumber) {
      const clean = phoneNumber.replace(/\D/g, "");
      await AsyncStorage.setItem("phone", clean);
    }

    router.replace("/(auth)/(login)/login");
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
       await AsyncStorage.setItem("temp_phone", clean);

      const storedPhone = await AsyncStorage.getItem("phone");
      const pinSet = await AsyncStorage.getItem(`pin_set_${clean}`);

      if (storedPhone === clean && pinSet === "true") {
        Alert.alert(
          "OTP Sent",
          `Verification code sent to ${maskPhone(clean)}`
        );

        router.replace({
          pathname: "/(auth)/(otp-verify)/otp-verify",
          params: { phone: clean, skipPinSetup: true },
        });
        return;
      }

      const res = await fetch(
        "https://staging.kazibufastnet.com/api/app/verify_number",
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
      await AsyncStorage.setItem("temp_phone", clean);

      router.replace({
        pathname: "/(auth)/(otp-verify)/otp-verify",
        params: { phone: clean },
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
