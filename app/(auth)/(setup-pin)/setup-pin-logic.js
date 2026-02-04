import { useRef, useState, useEffect } from "react";
import { Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useSetupPinLogic() {
  const router = useRouter();
  const { phone: paramPhone } = useLocalSearchParams();
  const [phone, setPhone] = useState("");

  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const pinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  useEffect(() => {
    const loadPhone = async () => {
      try {
        // Priority 1: Phone from params (from OTP verification)
        if (paramPhone) {
          setPhone(paramPhone);
        } 
        // Priority 2: Phone from storage
        else {
          const savedPhone = await AsyncStorage.getItem("phone");
          if (savedPhone) {
            setPhone(savedPhone);
            console.log("Loaded phone from storage:", savedPhone);
          } else {
            Alert.alert("Error", "Phone number not found. Please verify again.");
            router.replace("/(auth)/(phone-verify)/phone-verify");
          }
        }
      } catch (error) {
        console.error("Failed to load phone:", error);
        Alert.alert("Error", "Failed to load phone number");
        router.replace("/(auth)/(phone-verify)/phone-verify");
      }
    };
    
    loadPhone();
  }, [paramPhone, router]);

  // Handle PIN input change
  const handlePinChange = (index, value, isConfirm = false) => {
    if (!/^\d?$/.test(value)) return; 
    const arr = isConfirm ? [...confirmPin] : [...pin];
    arr[index] = value;
    isConfirm ? setConfirmPin(arr) : setPin(arr);

    if (value && index < 5) {
      const nextRef = isConfirm
        ? confirmPinRefs.current[index + 1]
        : pinRefs.current[index + 1];
      nextRef?.focus();
    }
  };

  // Handle Backspace key
  const handlePinKeyPress = (index, e, isConfirm = false) => {
    if (e.nativeEvent.key === "Backspace") {
      const arr = isConfirm ? [...confirmPin] : [...pin];
      if (arr[index] === "" && index > 0) {
        const prevRef = isConfirm
          ? confirmPinRefs.current[index - 1]
          : pinRefs.current[index - 1];
        prevRef?.focus();
      }
      arr[index] = "";
      isConfirm ? setConfirmPin(arr) : setPin(arr);
    }
  };

  // Submit PIN
  const handleSubmit = async () => {
    if (!phone) {
      Alert.alert("Error", "Phone number not found. Please login again.");
      return;
    }

    const pinString = pin.join("");
    const confirmPinString = confirmPin.join("");

    if (pinString.length !== 6 || confirmPinString.length !== 6) {
      Alert.alert("Error", "Please enter and confirm your 6-digit PIN");
      return;
    }

    if (pinString !== confirmPinString) {
      Alert.alert("Error", "PINs do not match");
      return;
    }

    try {
      setLoading(true);

      const formattedPhone = phone.startsWith("+")
        ? phone
        : phone.replace(/^0/, "");

      const response = await fetch(
        "https://staging.kazibufastnet.com/api/app/setup_pin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile_number: formattedPhone,
            pin: pinString,
          }),
        }
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to set PIN!");
      }

      // ✅ STORE ALL AUTH DATA CONSISTENTLY
      await AsyncStorage.multiSet([
        ["phone", formattedPhone],
        ["pin_set", "true"],
        [`pin_set_${formattedPhone}`, "true"]
      ]);

      Alert.alert("Success", "PIN set successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Clear any temp data
            AsyncStorage.removeItem("temp_phone");
            
            // Navigate to login with phone parameter
            router.replace({
              pathname: "/(auth)/(login)/login",
              params: { phone: formattedPhone }
            });
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return {
    phone,
    pin,
    confirmPin,
    loading,
    showPin,
    showConfirmPin,
    pinRefs,
    confirmPinRefs,
    setShowPin,
    setShowConfirmPin,
    handlePinChange,
    handlePinKeyPress,
    handleSubmit,
  };
}