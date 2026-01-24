import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Vibration,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const goBackSafe = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(role)/(clienttabs)/home"); // 👈 change to your home/dashboard route
  }
};


const COLORS = {
  primary: "#21C7B9",       // Teal from "KAZIBU FAST"
  secondary: "#00AFA1",     // Darker teal
  white: "#FFFFFF",
  dark: "#1b2e2c",
  black: "#000000",
};

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-off" size={60} color={COLORS.primary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please allow camera access to scan QR codes
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Ionicons name="camera" size={20} color={COLORS.white} />
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      Vibration.vibrate();
      
      Alert.alert(
        "QR Code Scanned",
        `Type: ${type}\nData: ${data}`,
        [
          {
            text: "Scan Again",
            onPress: () => setScanned(false),
            style: "default",
          },
          {
            text: "Go Back",
            onPress: goBackSafe,
            style: "cancel",
          },
        ]
      );
    }
  };

  const handleClose = () => {
    router.back();
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const handleManualInput = () => {
    Alert.prompt(
      "Manual QR Code Input",
      "Enter the QR code data:",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Submit",
          onPress: (data) => {
            if (data) {
              Alert.alert("Manual Entry", `Data entered: ${data}`);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'pdf417',
            'code128',
            'code39',
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        enableTorch={torchOn}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan QR Code</Text>
          <TouchableOpacity style={styles.torchButton} onPress={toggleTorch}>
            <Ionicons
              name={torchOn ? "flash" : "flash-off"}
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        {/* Scan Frame */}
        <View style={styles.scanFrameContainer}>
          <View style={styles.scanFrame}>
            {/* Top Left Corner */}
            <View style={[styles.corner, styles.topLeft]} />
            {/* Top Right Corner */}
            <View style={[styles.corner, styles.topRight]} />
            {/* Bottom Left Corner */}
            <View style={[styles.corner, styles.bottomLeft]} />
            {/* Bottom Right Corner */}
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <Text style={styles.instruction}>
            Position the QR code within the frame
          </Text>
          
          <TouchableOpacity 
            style={styles.manualButton}
            onPress={handleManualInput}
          >
            <Ionicons name="keypad" size={20} color={COLORS.primary} />
            <Text style={styles.manualButtonText}>Enter Manually</Text>
          </TouchableOpacity>

          {scanned && (
            <TouchableOpacity 
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    width: '100%',
  },
  permissionTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
    lineHeight: 22,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  torchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  bottomControls: {
    padding: 30,
    alignItems: 'center',
  },
  instruction: {
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.9,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 199, 185, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
  },
  manualButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  scanAgainButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanAgainText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});