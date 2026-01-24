import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      const phone = await AsyncStorage.getItem("phone");
      const pinSet = await AsyncStorage.getItem("pin_set");

      if (phone && pinSet === "true") {
        // ✅ Already verified & PIN set
        router.replace("/(auth)/(login)/login");
      } else if (phone) {
        // ✅ Phone exists but PIN not set
        router.replace("/(auth)/(otp-verify)/otp-verify");
      } else {
        // ❌ New user
        router.replace("/(auth)/(phone-verify)/phone-verify");
      }
    };

    bootstrap();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

