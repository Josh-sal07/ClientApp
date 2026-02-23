import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Vibration } from "react-native";
import { useUserStore } from "../../../store/user";
import * as LocalAuthentication from "expo-local-authentication";
import { useFocusEffect } from "@react-navigation/native";

export const useLoginLogic = () => {
  const setUser = useUserStore((state) => state.setUser);
  const setUnlocked = useUserStore((s) => s.setUnlocked);

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
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

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
      } catch (error) {}
    };

    loadPhoneNumber();
  }, []);

  // Handle params.phone if passed
  useEffect(() => {
    if (params.phone) {
      setPhoneNumber(params.phone);
    }
  }, [params.phone]);

  useFocusEffect(
    useCallback(() => {
      const checkBiometricAvailability = async () => {
        try {
          const biometricEnabled =
            await AsyncStorage.getItem("biometric_enabled");

          const storedPhone = await AsyncStorage.getItem("phone");

          if (biometricEnabled !== "true" || !storedPhone) {
            setIsBiometricAvailable(false);
            return;
          }

          const hasHardware = await LocalAuthentication.hasHardwareAsync();

          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          setIsBiometricAvailable(hasHardware && isEnrolled);
        } catch (err) {
          setIsBiometricAvailable(false);
        }
      };

      checkBiometricAvailability();
    }, []),
  );

  const handleBiometricLogin = useCallback(async () => {
    if (isProcessing || isLocked) return;

    try {
      const storedPhone = await AsyncStorage.getItem("phone");

      if (!storedPhone) return;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login with Biometrics",
        fallbackLabel: "Use MPIN",
      });

      if (!result.success) return;

      const savedPin = await AsyncStorage.getItem(`saved_mpin_${storedPhone}`);

      if (savedPin) {
        handleLogin(savedPin);
      }
    } catch (err) {}
  }, [isProcessing, isLocked, handleLogin]);

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

  const handleLogin = useCallback(
    async (pin) => {
      if (isProcessing || isLocked) return;

      setIsProcessing(true);
      setIsVerifying(true);
      setMessage("");

      const fetchWithTimeout = (url, options, timeout = 10000) =>
        Promise.race([
          fetch(url, options),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(new Error("Server timeout. Please try again later.")),
              timeout,
            ),
          ),
        ]);

      try {
        const phone = phoneNumber || (await AsyncStorage.getItem("phone"));

        if (!phone) {
          setAlertConfig({
            visible: true,
            title: "Error",
            message: "Phone number not found. Please verify again.",
            type: "error",
            onConfirm: () => {
              router.replace("/(auth)/(phone-verify)/phone-verify");
            },
          });
          return;
        }

        const response = await fetchWithTimeout(
          "https://tub.kazibufastnet.com/api/app/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              mobile_number: phone,
              pin: pin,
            }),
          },
          10000,
        );

        let data = null;

        try {
          data = await response.json();
        } catch (e) {
          throw new Error(
            "Server is not responding properly. Please try again later.",
          );
        }

        // ============================
        // 🔴 STATUS-BASED HANDLING
        // ============================

        // 404 – Wrong endpoint
        if (response.status === 404) {
          throw new Error("Server endpoint not found. Please contact support.");
        }

        // 500+ – Server crash
        if (response.status >= 500) {
          throw new Error(
            "There is something wrong on our server. Please try again later.",
          );
        }

        // 401 / 422 – Invalid PIN
        if (response.status === 401 || response.status === 422) {
          resetMpin();
          throw new Error(data?.message || "INVALID MPIN. Please try again.");
        }

        // Any other non-200 error
        if (!response.ok) {
          throw new Error(data?.message || "Login failed. Please try again.");
        }

        // Token missing (invalid backend response)
        if (!data?.token) {
          throw new Error("INVALID MPIN. Please try again.");
        }

        // ============================
        // ✅ SUCCESS LOGIN
        // ============================

        await AsyncStorage.setItem("token", data.token);
        setUser(data.user);
        setUnlocked(true);
        setToken(data.token);

        const biometricEnabled =
          await AsyncStorage.getItem("biometric_enabled");

        if (biometricEnabled === "true") {
          await AsyncStorage.setItem(`saved_mpin_${phone}`, pin);
        }

        router.replace("/(role)/(clienttabs)/home");
      } catch (err) {
        resetMpin();
        let errorMessage = err.message;

        // Network error
        if (err.message === "Network request failed") {
          errorMessage =
            "Unable to connect to server. Please check your internet connection.";
        }

        setMessage(errorMessage);
        triggerShakeAnimation();

        // 🔒 LOCK LOGIC
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          setIsLocked(true);

          let countdown = 30;

          const interval = setInterval(() => {
            if (countdown > 0) {
              setMessage(`Too many attempts. Try again in ${countdown}s`);
              countdown--;
            } else {
              clearInterval(interval);
              setAttempts(0);
              setIsLocked(false);
              setMessage("");
            }
          }, 1000);
        }
      } finally {
        setIsProcessing(false);
        setIsVerifying(false);
      }
    },
    [
      isProcessing,
      isLocked,
      phoneNumber,
      router,
      setUser,
      triggerShakeAnimation,
      attempts,
    ],
  );

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
    [isVerifying, isProcessing, currentPosition, mpin, handleLogin],
  );

  const handleForgotMpin = useCallback(() => {
    setAlertConfig({
      visible: true,
      title: "Forgot MPIN?",
      message: "Are you sure you want to reset your MPIN?",
      type: "warning",
      onConfirm: () => {
        router.push("/(auth)/(forgot-mpin)/forgotmpin");
      },
    });
  }, []);

  const handleChangeNumber = useCallback(() => {
    setAlertConfig({
      visible: true,
      title: "Change Number",
      message: "Do you want to use a different phone number?",
      type: "info",
      onConfirm: () => {
        router.replace("/(auth)/(phone-verify)/phone-verify");
      },
    });
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
    alertConfig,
    setAlertConfig,
    isBiometricAvailable,
    handleBiometricLogin,
  };
};

export default useLoginLogic;
