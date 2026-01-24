import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Vibration } from "react-native";
import { useUserStore } from "../../../store/user";

export const useLoginLogic = () => {
  const setUser = useUserStore((state) => state.setUser);
  const [token, setToken] = useState(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  const [message, setMessage] = useState("");
  const [mpin, setMpin] = useState(["", "", "", "", "", ""]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shakeAnimation, setShakeAnimation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasEnteredNumber = mpin.some((digit) => digit !== "");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(30); // countdown in seconds
  const [showMpin, setShowMpin] = useState(true);
 


  

  // lock timer effect
  useEffect(() => {
    let interval;
    if (isLocked) {
      interval = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLocked(false);
            setAttempts(0);
            setLockTimer(30);
            setMessage("");
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked]);

  // Load phone number on mount
  useEffect(() => {
    const loadPhoneNumber = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem("phone");
        if (storedPhone) {
          setPhoneNumber(storedPhone);
        }
      } catch (error) {
        console.error("Failed to load phone number:", error);
      }
    };

    loadPhoneNumber();
  }, []);

  // Handle params.phone if passed
  useEffect(() => {
    if (params.phone) {
      setPhoneNumber(params.phone);
    }
  }, [params.phone]);

  const triggerShakeAnimation = useCallback(() => {
    setShakeAnimation(true);
    setTimeout(() => setShakeAnimation(false), 500);
  }, []);

  const resetMpin = useCallback(() => {
    setMpin(["", "", "", "", "", ""]);
    setCurrentPosition(0);
    setIsProcessing(false);
  }, []);

  const resetMpinWithDelay = useCallback(() => {
    setTimeout(() => {
      resetMpin();
    }, 500);
  }, [resetMpin]);

const handleLogin = useCallback(async (pin) => {
  if (isProcessing || isLocked) return;

  setIsProcessing(true);
  setIsVerifying(true);
  setMessage("");

  try {
    const phone = phoneNumber || (await AsyncStorage.getItem("phone"));
    
    if (!phone) {
      Alert.alert("Error", "Phone number not found. Please verify again.");
      router.replace("/(auth)/(phone-verify)/phone-verify");
      return;
    }

    const response = await fetch(
      "https://staging.kazibufastnet.com/api/app/login",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          mobile_number: phone, 
          pin: pin 
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.token) {
      resetMpin();
      throw new Error(data.message || "Invalid MPIN");
    }

    // Save token and user data
    await AsyncStorage.setItem("token", data.token);
    setUser(data.user);
    setToken(data.token);

    // Navigate to client home
    router.replace("/(role)/(clienttabs)/home");
    
  } catch (err) {
    setMessage(err.message || "Login failed");
    triggerShakeAnimation();

    // Increment wrong attempts
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Lock after 3 wrong attempts
    if (newAttempts >= 3) {
      setIsLocked(true);
      setMessage("Too many attempts. Try again in 30s");

      let countdown = 30;
      const countdownInterval = () => {
        if (countdown > 0) {
          setMessage(`Too many attempts. Try again in ${countdown}s`);
          countdown -= 1;
          setTimeout(countdownInterval, 1000); // recursive countdown
        } else {
          setAttempts(0);      // reset attempts
          setIsLocked(false);  // unlock inputs
          setMessage("");      // reset message
        }
      };

      countdownInterval(); // start countdown
    }
  } finally {
    setIsProcessing(false);
    setIsVerifying(false);
  }
}, [isProcessing, phoneNumber, router, setUser, triggerShakeAnimation, attempts]);


  const handleKeyPress = useCallback(
    (key) => {
      if (isVerifying || isProcessing) return;

      if (key === "⌫") {
        if (currentPosition > 0) {
          const newPosition = currentPosition - 1;
          const newMpin = [...mpin];
          newMpin[newPosition] = "";
          setMpin(newMpin);
          setCurrentPosition(newPosition);
        }
      } else {
        if (currentPosition >= 6) return;

        const newMpin = [...mpin];
        newMpin[currentPosition] = key.toString();
        setMpin(newMpin);
        const nextPosition = currentPosition + 1;
        setCurrentPosition(nextPosition);

        if (nextPosition === 6) {
          const enteredPin = newMpin.join("");
          handleLogin(enteredPin);
        }
      }

      Vibration.vibrate(10);
    },
    [isVerifying, isProcessing, currentPosition, mpin, handleLogin]
  );

  const handleForgotMpin = useCallback(() => {
    Alert.alert("Forgot MPIN?", "Are you sure you want to reset your MPIN?", [
      { text: "Cancel", style: "cancel" },
      {
        onPress: () => {
          router.replace("/(auth)/(forgot-mpin)/forgotmpin");
        },
      },
    ]);
  }, []);

  const handleChangeNumber = useCallback(() => {
    Alert.alert(
      "Change Number",
      "Do you want to use a different phone number?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            router.replace("/(auth)/(phone-verify)/phone-verify");
          },
        },
      ]
    );
  }, [router]);

  return {
    phoneNumber,
    mpin,
    currentPosition,
    isVerifying,
    shakeAnimation,
    message,
    isLoading: isVerifying || isProcessing,
    hasEnteredNumber,
    isProcessing,
    handleKeyPress,
    handleForgotMpin,
    handleChangeNumber,
    resetMpin,
  };
};

export default useLoginLogic;
