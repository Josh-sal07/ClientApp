import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, getResponsiveValues } from './header.css.js';

const Header = () => {
  const responsive = getResponsiveValues();
  const [notificationModalVisible, setNotificationModalVisible] = React.useState(false);

  const supportInfo = {
    facebookPage: 'https://www.facebook.com/messages/t/116319363610666',
    phoneNumber: '+9505358971',
  };

  const handleFacebookRedirect = () => {
    Linking.openURL(supportInfo.facebookPage).catch(() => {
      Alert.alert('Error', 'Could not open Facebook Messenger.');
    });
  };

  const handleCallSupport = async () => {
    const phoneUrl = `tel:${supportInfo.phoneNumber}`;

    try {
      const canMakeCalls = await Linking.canOpenURL(phoneUrl);

      if (canMakeCalls) {
        Alert.alert(
          'Call Support',
          `Do you want to call ${supportInfo.phoneNumber}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Call',
              onPress: async () => {
                try {
                  await Linking.openURL(phoneUrl);
                } catch {
                  showPhoneFallback();
                }
              }
            }
          ]
        );
      } else {
        showPhoneFallback();
      }
    } catch {
      showPhoneFallback();
    }
  };

  const showPhoneFallback = () => {
    Alert.alert(
      'Call Support',
      `Device cannot make calls.\n\nSupport Number: ${supportInfo.phoneNumber}`,
      [
        {
          text: 'Copy Number',
          onPress: async () => {
            await Clipboard.setStringAsync(supportInfo.phoneNumber);
            Alert.alert('Copied', 'Phone number copied!');
          }
        },
        {
          text: 'Open Dialer',
          onPress: () => {
            const dialerUrl = Platform.select({
              ios: `telprompt:${supportInfo.phoneNumber}`,
              android: `tel:${supportInfo.phoneNumber}`,
            });

            if (dialerUrl) {
              Linking.openURL(dialerUrl).catch(() =>
                Alert.alert('Error', 'Cannot open dialer.')
              );
            }
          }
        },
        { text: 'OK' }
      ]
    );
  };

  return (
    <>
      <View style={styles.safeArea}>
        <View style={[styles.headerContainer, { height: responsive.height }]}>

          <Pressable onPress={() => router.push('/home')}>
            <Image
              source={require("../../assets/images/kazi.png")}
              style={[styles.logo, { width: responsive.logoSize, height: responsive.logoSize }]}
              resizeMode="contain"
            />
          </Pressable>

          <View style={[styles.header, { gap: responsive.padding }]}>

            <Pressable onPress={() => setNotificationModalVisible(true)}>
              <Image
                source={require("../../assets/icons/notifications.png")}
                style={{ width: responsive.iconSize, height: responsive.iconSize }}
                resizeMode="contain"
              />
            </Pressable>

            <Pressable onPress={handleCallSupport}>
              <Image
                source={require("../../assets/icons/call.png")}
                style={{ width: responsive.iconSize, height: responsive.iconSize }}
                resizeMode="contain"
              />
            </Pressable>

            {/* FACEBOOK */}
            <Pressable onPress={handleFacebookRedirect}>
              <Image
                source={require("../../assets/icons/fb.png")}
                style={{ width: responsive.iconSize, height: responsive.iconSize }}
                resizeMode="contain"
              />
            </Pressable>

          </View>
        </View>
      </View>

      <Modal
        visible={notificationModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalOverlay} onPress={() => setNotificationModalVisible(false)}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Notifications</Text>

                <View style={styles.notificationItem}>
                  <Text style={styles.notificationText}>Your order has been shipped!</Text>
                </View>
                <View style={styles.notificationItem}>
                  <Text style={styles.notificationText}>Support replied to your message.</Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => setNotificationModalVisible(false)}
                >
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </>
  );
};

export default Header;