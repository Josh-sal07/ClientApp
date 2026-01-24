import React, {useEffect} from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styles from "./setup-pin.css.js";
import useSetupPinLogic from "./setup-pin-logic.js";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";


export default function SetupPinScreen({ route }) {
  
  const router = useRouter();

  // Get phone number from route params
  const { phone } = useLocalSearchParams();
  

  const {
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
    handleSetupPinSubmit,
  } = useSetupPinLogic(phone);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../assets/images/kazi.png")}
            style={styles.logo}
          />
        </View>

        <Text style={styles.title}>Create Your PIN</Text>
        <Text style={styles.subtitle}>
          Create a 6-digit PIN for secure access to your account
        </Text>

        {/* PIN Inputs */}
        <View style={styles.pinContainer}>
          {/* Enter PIN */}
          <View style={styles.pinSection}>
            <View style={styles.pinHeader}>
              <Text style={styles.pinLabel}>Enter 6-digit PIN</Text>
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setShowPin(!showPin)}
              >
                <Text style={styles.visibilityButtonText}>
                  {showPin ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pinInputsContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={`pin-${index}`}
                  ref={(ref) => (pinRefs.current[index] = ref)}
                  style={[styles.pinInput, pin[index] && styles.pinInputFilled]}
                  value={showPin ? pin[index] : pin[index] ? "•" : ""}
                  onChangeText={(value) => handlePinChange(index, value, false)}
                  onKeyPress={(e) => handlePinKeyPress(index, e, false)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!loading}
                  selectTextOnFocus
                  textAlign="center"
                  autoFocus={index === 0 && pin[0] === ""}
                />
              ))}
            </View>
          </View>

          <View style={styles.separator} />

          {/* Confirm PIN */}
          <View style={styles.pinSection}>
            <View style={styles.pinHeader}>
              <Text style={styles.pinLabel}>Confirm 6-digit PIN</Text>
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setShowConfirmPin(!showConfirmPin)}
              >
                <Text style={styles.visibilityButtonText}>
                  {showConfirmPin ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pinInputsContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={`confirm-${index}`}
                  ref={(ref) => (confirmPinRefs.current[index] = ref)}
                  style={[
                    styles.pinInput,
                    confirmPin[index] && styles.pinInputFilled,
                    pin.join("") === confirmPin.join("") &&
                      confirmPin[index] &&
                      styles.pinInputMatched,
                  ]}
                  value={
                    showConfirmPin
                      ? confirmPin[index]
                      : confirmPin[index]
                      ? "•"
                      : ""
                  }
                  onChangeText={(value) => handlePinChange(index, value, true)}
                  onKeyPress={(e) => handlePinKeyPress(index, e, true)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!loading}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.statusContainer}>
            {pin.join("").length === 6 && confirmPin.join("").length === 6 ? (
              pin.join("") === confirmPin.join("") ? (
                <Text style={styles.statusTextSuccess}>✓ PINs match</Text>
              ) : (
                <Text style={styles.statusTextError}>✗ PINs don't match</Text>
              )
            ) : (
              <Text style={styles.statusText}>
                Enter 6-digit PIN in both fields
              </Text>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
            (pin.join("").length !== 6 || confirmPin.join("").length !== 6) &&
              styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            loading ||
            pin.join("").length !== 6 ||
            confirmPin.join("").length !== 6
          }
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Set PIN</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
