import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./phone-verify.css.js";
import usePhoneVerifyLogic from "./phone-verify-logic.js";

export default function PhoneVerifyScreen() {
  const router = useRouter();

  useEffect(() => {
  const loadPhone = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem("phoneNumber");
      if (savedPhone) {
        setPhone(savedPhone);
      }
    } catch (error) {
      console.error("Failed to load phone number", error);
    }
  };

  loadPhone();
}, []);


  const {
    phone,
    setPhone,
    loading,
    formatPhone,
    handleSendOtp,
    handleSignIn,
  } = usePhoneVerifyLogic();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Image
            source={require("../../../assets/images/kazi.png")}
            style={styles.logo}
          />

          <Text style={styles.title}>Verify Phone Number</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.countryCode}>+63</Text>
            <TextInput
              style={styles.input}
              placeholder="9XXXXXXXXX"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={formatPhone(phone)}
              onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
              maxLength={13}
            />
          </View>

          <Text style={styles.helper}>
            Enter 10-digit number starting with 9 (e.g. 9123456789)
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              (loading || phone.length !== 10) && styles.buttonDisabled,
            ]}
            onPress={handleSendOtp}
            disabled={loading || phone.length !== 10}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.signInText}>
              Already have an account?{" "}
              <Text style={styles.signInLink} onPress={handleSignIn}>
                Sign In
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
