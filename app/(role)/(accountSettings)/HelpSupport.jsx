import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  useColorScheme,
  theme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme/ThemeContext";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const UserSupport = () => {
  const router = useRouter();
  const { mode } = useTheme();
  const [showFAQModal, setShowFAQModal] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const systemColorScheme = useColorScheme();
    // Determine effective mode
  const effectiveMode = mode === "system" ? systemColorScheme : mode;


  // Define colors based on theme
  const COLORS = {
    light: {
      primary: "#21C7B9",
      secondary: "#00AFA1",
      dark: "#1b2e2c",
      white: "#FFFFFF",
      lightGray: "#F8F9FA",
      gray: "#718096",
      darkGray: "#1A202C",
      border: "#E2E8F0",
      success: "#00AFA1",
      warning: "#FFA726",
      danger: "#FF6B6B",
      facebook: "#1877F2",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
      surface: "#FFFFFF",
      // Gradient colors for header
      gradientStart: "#98eced",
      gradientAlt1: "#65f1e8",
      gradientEnd: "#21c7c1",
      gradientAlt: "#1de7e3",
    },
    dark: {
      primary: "#1f6f68",
      secondary: "#00AFA1",
      dark: "#121212",
      white: "#FFFFFF",
      lightGray: "#1E1E1E",
      gray: "#9E9E9E",
      darkGray: "#121212",
      border: "#333333",
      success: "#00AFA1",
      warning: "#FFA726",
      danger: "#FF6B6B",
      facebook: "#1877F2",
      background: "#121212",
      text: "#FFFFFF",
      textLight: "#B0B0B0",
      surface: "#1E1E1E",
      // Gradient colors for header (darker version)
      gradientStart: "#000000",
      gradientEnd: "#032829",
      gradientAlt: "#0b1515",
      gradientAlt1: "#032829",
    }
  };
  
  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  // Header states
  const [activeHeaderTab, setActiveHeaderTab] = useState("Album");

  // Reset StatusBar when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
        StatusBar.setTranslucent(true);
      }
      
      return () => {
        // Optional cleanup
      };
    }, [])
  );

  const handleHeaderTabPress = (tabName) => {
    setActiveHeaderTab(tabName);
  };

  const supportCategories = [
    {
      id: "ticket",
      title: "Create Ticket",
      icon: "ticket-outline",
      color: colors.primary,
      action: () => router.push("/(clienttabs)/tickets/create-ticket"),
    },
    {
      id: "mpin",
      title: "Reset MPIN",
      icon: "lock-closed-outline",
      color: colors.primary,
      action: () => router.push("/(auth)/(setup-pin)/setup-pin"),
    },
    {
      id: "account",
      title: "Account Help",
      icon: "person-outline",
      color: colors.primary,
      action: () => router.push("/(clienttabs)/account/settings"),
    },
    {
      id: "payment",
      title: "Payment",
      icon: "card-outline",
      color: colors.primary,
      action: () => router.push("/(clienttabs)/billing"),
    },
  ];

  const faqs = [
    {
      question: "How do I Create Ticket?",
      answer: "Go to the 'Tickets' tab, If you prefer, use the floating AI assistant — just chat with it and it will show a Submit Ticket button.",
      action: () => router.push("/(role)/(clienttabs)/tickets"),
    },
    {
      question: "I forgot my MPIN. What should I do?",
      answer: "Use the 'Forgot MPIN' option on the login screen. You'll receive an OTP to verify your identity and can then reset your MPIN.",
      action: () => router.push("/(auth)/(forgot-mpin)/forgotmpin"),
    },
    {
      question: "Can I change my phone number?",
      answer: "Yes, go to 'Account Settings' to update your contact information. You'll need to verify the new number with an OTP.",
      action: () => router.push("/(role)/(clienttabs)/account"),
    },
  ];

  const contactOptions = [
    {
      title: "Call Support",
      description: "Speak directly with our support team",
      icon: "call-outline",
      action: () => Linking.openURL("tel:09505358971"),
      color: colors.primary,
    },
    {
      title: "Email Support",
      description: "Send us an email for detailed assistance",
      icon: "mail-outline",
      action: () => Linking.openURL("mailto:support@kazibufast.com"),
      color: colors.primary,
    },
  ];

  const supportHours = [
    {
      label: "Phone Support:",
      value: "7:30AM - 6:00PM Available",
      icon: "time-outline",
      color: colors.primary,
    },
    {
      label: "Response Time:",
      value: "Average 2 hours",
      icon: "speedometer-outline",
      color: colors.primary,
    },
  ];

  const renderFAQModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFAQModal !== null}
      onRequestClose={() => setShowFAQModal(null)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setShowFAQModal(null)}
              style={styles.modalBackButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>FAQ</Text>
            <TouchableOpacity
              onPress={() => setShowFAQModal(null)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.faqHeader}>
              <View style={[styles.faqIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>
                {faqs[showFAQModal]?.question}
              </Text>
            </View>
            
            <View style={[styles.faqAnswerContainer, { backgroundColor: colors.lightGray }]}>
              <Text style={[styles.faqAnswer, { color: colors.text }]}>{faqs[showFAQModal]?.answer}</Text>
            </View>

            {faqs[showFAQModal]?.action && (
              <TouchableOpacity 
                style={[styles.faqActionButton, { backgroundColor: colors.primary }]}
                onPress={faqs[showFAQModal]?.action}
              >
                <Text style={styles.faqActionText}>Go to {faqs[showFAQModal]?.question.includes('Ticket') ? 'Create Ticket' : 'Settings'}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderContactModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showContactModal}
      onRequestClose={() => setShowContactModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Contact Support</Text>
            <TouchableOpacity
              onPress={() => setShowContactModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.contactOptions}>
              {contactOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.contactOption, { backgroundColor: colors.lightGray }]}
                  onPress={option.action}
                >
                  <View style={[styles.contactIcon, { backgroundColor: option.color + '15' }]}>
                    <Ionicons name={option.icon} size={24} color={option.color} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactTitle, { color: colors.text }]}>{option.title}</Text>
                    <Text style={[styles.contactDescription, { color: colors.textLight }]}>{option.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.supportInfo}>
              <Text style={[styles.supportTitle, { color: colors.text }]}>Support Information</Text>
              {supportHours.map((hour, index) => (
                <View key={index} style={[styles.supportHourItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.supportHourLeft}>
                    <View style={[styles.supportHourIcon, { backgroundColor: hour.color + '15' }]}>
                      <Ionicons name={hour.icon} size={16} color={hour.color} />
                    </View>
                    <Text style={[styles.supportHourLabel, { color: colors.textLight }]}>{hour.label}</Text>
                  </View>
                  <Text style={[styles.supportHourValue, { color: colors.text }]}>{hour.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      
      {/* Gradient Header - This will extend under the status bar */}
      <LinearGradient
        colors={[colors.gradientStart,  colors.gradientAlt,colors.gradientAlt1, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          {/* Back Button and Title */}
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="help-circle" size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>How can we help you?</Text>
          
        </View>

        {/* Contact Options */}
        <View style={[styles.card, { 
          backgroundColor: colors.surface,
          borderColor: colors.primary + '20',
          shadowColor: theme === 'dark' ? 'transparent' : '#000',
        }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Contact Support</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textLight }]}>Reach out to our team</Text>
          </View>
          <View style={styles.contactGrid}>
            {contactOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.contactCard, { 
                  backgroundColor: colors.lightGray,
                  borderColor: colors.border 
                }]}
                onPress={option.action}
              >
                <View style={[styles.contactCardIcon, { backgroundColor: option.color + '15' }]}>
                  <Ionicons name={option.icon} size={24} color={option.color} />
                </View>
                <Text style={[styles.contactCardTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.contactCardSubtitle, { color: colors.textLight }]}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => setShowContactModal(true)}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>More contact options</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={[styles.card, { 
          backgroundColor: colors.surface,
          borderColor: colors.primary + '20',
          shadowColor: theme === 'dark' ? 'transparent' : '#000',
        }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textLight }]}>Quick answers to common questions</Text>
          </View>
          <View style={styles.faqList}>
            {faqs.slice(0, 3).map((faq, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.faqItem, { borderBottomColor: colors.border }]}
                onPress={() => setShowFAQModal(index)}
              >
                <View style={styles.faqLeft}>
                  <View style={[styles.faqIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.faqQuestion, { color: colors.text }]} numberOfLines={2}>{faq.question}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Information */}
        <View style={[styles.card, { 
          backgroundColor: colors.surface,
          borderColor: colors.primary + '20',
          shadowColor: theme === 'dark' ? 'transparent' : '#000',
        }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Support Information</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textLight }]}>Our availability & response times</Text>
          </View>
          <View style={styles.supportInfo}>
            {supportHours.map((hour, index) => (
              <View key={index} style={[styles.supportHourItem, { borderBottomColor: colors.border }]}>
                <View style={styles.supportHourLeft}>
                  <View style={[styles.supportHourIcon, { backgroundColor: hour.color + '15' }]}>
                    <Ionicons name={hour.icon} size={16} color={hour.color} />
                  </View>
                  <Text style={[styles.supportHourLabel, { color: colors.textLight }]}>{hour.label}</Text>
                </View>
                <Text style={[styles.supportHourValue, { color: colors.text }]}>{hour.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            Need urgent assistance? Call us at{" "}
            <Text style={[styles.footerHighlight, { color: colors.primary }]}>0950-535-8971</Text>
          </Text>
          <Text style={[styles.footerNote, { color: colors.gray }]}>We're always here to help!</Text>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderFAQModal()}
      {renderContactModal()}
    </View>
  );
};

export default UserSupport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Gradient Header Styles - Extends under status bar
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  userInfoContainer: {
    marginBottom: 15,
  },
  userEmail: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  deviceInfo: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  headerTabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  headerTab: {
    marginRight: 25,
    paddingBottom: 10,
  },
  activeHeaderTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  headerTabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  activeHeaderTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cloudBackupContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  cloudBackupTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cloudBackupSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  bottomNavItem: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  bottomNavText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 10,
  },
  heroIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  contactCard: {
    width: (width - 72) / 2,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactCardSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  faqList: {
    marginBottom: 16,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  faqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  supportInfo: {
    marginTop: 8,
  },
  supportHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  supportHourLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportHourIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  supportHourLabel: {
    fontSize: 14,
    width: 100,
  },
  supportHourValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerHighlight: {
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  faqHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  faqAnswerContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 22,
  },
  faqActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  faqActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactOptions: {
    marginBottom: 24,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 13,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
});