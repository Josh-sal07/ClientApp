import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar,
  Platform,
  useColorScheme,
  theme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const AboutKazibufast = () => {
  const router = useRouter();
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();
  // Determine effective mode
  const effectiveMode = mode === "system" ? systemColorScheme : mode; // theme is already an object with colors!

  // Define colors based on theme - Matching Security screen colors
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
      // Gradient colors for header - Matching Security screen
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
    },
  };

   const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  // Reset StatusBar when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }

      return () => {
        // Optional cleanup
      };
    }, []),
  );

  const handleOpenWebsite = () => {
    Linking.openURL("https://kazibufastnet.com");
  };

  const handleOpenFacebook = () => {
    Linking.openURL("https://facebook.com/kazibufast");
  };

  const contactItems = [
    {
      id: "website",
      title: "Website",
      subtitle: "www.kazibufastnet.com",
      icon: "globe-outline",
      color: colors.primary,
      onPress: handleOpenWebsite,
    },
    {
      id: "phone",
      title: "Phone",
      subtitle: "0950-822-1851",
      icon: "call-outline",
      color: colors.primary,
    },
    {
      id: "email",
      title: "Email",
      subtitle: "support@kazibufast.com",
      icon: "mail-outline",
      color: colors.primary,
    },
    {
      id: "address",
      title: "Address",
      subtitle: "Guiwanon, Tubigon, Bohol",
      icon: "location-outline",
      color: colors.primary,
    },
  ];

  const appInfoItems = [
    {
      id: "version",
      title: "Version",
      subtitle: "2.1.0",
      icon: "information-circle-outline",
      color: colors.primary,
    },
    {
      id: "build",
      title: "Build Number",
      subtitle: "2020.01.15",
      icon: "hammer-outline",
      color: colors.primary,
    },
    {
      id: "updated",
      title: "Last Updated",
      subtitle: "January 15, 2024",
      icon: "calendar-outline",
      color: colors.primary,
    },
    {
      id: "platform",
      title: "Platform",
      subtitle: "React Native",
      icon: "phone-portrait-outline",
      color: colors.primary,
    },
  ];

  const aboutPoints = [
    "High-speed internet connectivity",
    "Reliable network infrastructure",
    "Affordable subscription plans",
    "Easy online management",
    "Secure payment processing",
  ];

  const renderSection = (title, description, items, showChevron = false) => (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary + "20",
          shadowColor: theme === "dark" ? "transparent" : "#000",
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {description && (
          <Text
            style={[styles.sectionDescription, { color: colors.textLight }]}
          >
            {description}
          </Text>
        )}
      </View>
      <View style={[styles.itemsContainer, { borderColor: colors.border }]}>
        {items.map((item, index) => (
          <View key={item.id}>
            <TouchableOpacity
              style={[styles.actionItem, { backgroundColor: colors.surface }]}
              onPress={item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}
            >
              <View style={styles.actionLeft}>
                <View
                  style={[
                    styles.itemIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.itemSubtitle, { color: colors.textLight }]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              {showChevron && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
            {index < items.length - 1 && (
              <View
                style={[styles.itemDivider, { backgroundColor: colors.border }]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderHeroSection = () => (
    <View
      style={[
        styles.heroSection,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary + "20",
          shadowColor: theme === "dark" ? "transparent" : "#000",
        },
      ]}
    >
      <View style={styles.heroContent}>
        <View style={styles.logoContainer}>
          <View
            style={[styles.logoBackground, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="wifi-outline" size={32} color={colors.white} />
          </View>
          <View style={styles.logoTextContainer}>
            <Text style={[styles.companyName, { color: colors.text }]}>
              KazibuFast
            </Text>
            <View
              style={[
                styles.taglineContainer,
                { backgroundColor: colors.primary + "10" },
              ]}
            >
              <Text style={[styles.companyTagline, { color: colors.primary }]}>
                "PROVIDING SIMPLE SOLUTIONS"
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAboutCard = () => (
    <View
      style={[
        styles.aboutCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary + "20",
          shadowColor: theme === "dark" ? "transparent" : "#000",
        },
      ]}
    >
      <View style={styles.aboutHeader}>
        <View
          style={[styles.aboutIcon, { backgroundColor: colors.primary + "15" }]}
        >
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.aboutTitleContainer}>
          <Text style={[styles.aboutTitle, { color: colors.text }]}>
            About Us
          </Text>
          <Text style={[styles.aboutSubtitle, { color: colors.textLight }]}>
            Leading ISP in the region
          </Text>
        </View>
      </View>
      <Text style={[styles.aboutText, { color: colors.textLight }]}>
        Kazibufast is a leading internet service provider dedicated to
        delivering high-speed, reliable, and affordable internet connectivity to
        homes and businesses. Founded with a vision to bridge the digital
        divide, we continue to innovate and expand our services to empower
        communities in the digital age.
      </Text>
    </View>
  );

  const renderMissionCard = () => (
    <View
      style={[
        styles.missionCard,
        {
          backgroundColor: colors.primary + "08",
          borderColor: colors.primary + "20",
        },
      ]}
    >
      <View style={styles.missionHeader}>
        <View style={[styles.missionIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="rocket-outline" size={28} color={colors.white} />
        </View>
        <View style={styles.missionTitleContainer}>
          <Text style={[styles.missionTitle, { color: colors.primary }]}>
            Our Mission
          </Text>
          <Text style={[styles.missionSubtitle, { color: colors.textLight }]}>
            Our commitment to excellence
          </Text>
        </View>
      </View>
      <Text style={[styles.missionText, { color: colors.text }]}>
        To provide exceptional internet services that connect people, empower
        businesses, and transform communities through innovative technology and
        dedicated support.
      </Text>
    </View>
  );

  const renderSocialCard = () => (
    <View
      style={[
        styles.socialCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary + "20",
          shadowColor: theme === "dark" ? "transparent" : "#000",
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.socialHeader}>
          <Ionicons
            name="share-social-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Connect With Us
          </Text>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textLight }]}>
          Stay updated on social media
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.facebookButton,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={handleOpenFacebook}
        activeOpacity={0.7}
      >
        <View style={styles.facebookButtonContent}>
          <View
            style={[
              styles.facebookIcon,
              { backgroundColor: colors.facebook + "15" },
            ]}
          >
            <Ionicons name="logo-facebook" size={24} color={colors.facebook} />
          </View>
          <View style={styles.facebookText}>
            <Text style={[styles.facebookTitle, { color: colors.text }]}>
              Facebook
            </Text>
            <Text
              style={[styles.facebookSubtitle, { color: colors.textLight }]}
            >
              Follow us for updates
            </Text>
          </View>
        </View>
        <Ionicons name="open-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderPointsCard = () => (
    <View
      style={[
        styles.tipsSection,
        {
          backgroundColor: colors.primary + "08",
          borderColor: colors.primary + "20",
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.tipsHeader}>
          <Ionicons
            name="checkmark-circle-outline"
            size={22}
            color={colors.primary}
          />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Why Choose Kazibufast?
          </Text>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textLight }]}>
          Our key advantages
        </Text>
      </View>

      <View style={styles.tipsContainer}>
        {aboutPoints.map((point, index) => (
          <View key={index} style={styles.tipItem}>
            <View
              style={[styles.tipDot, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.tipText, { color: colors.text }]}>
              {point}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPoweredBy = () => (
    <View
      style={[
        styles.poweredBySection,
        {
          backgroundColor: colors.primary + "05",
          borderColor: colors.primary + "20",
        },
      ]}
    >
      <View style={styles.poweredByHeader}>
        <Text style={[styles.poweredByLabel, { color: colors.textLight }]}>
          Powered By
        </Text>
        <View style={styles.igniteContainer}>
          <Text style={[styles.igniteText, { color: colors.primary }]}>
            ignite
          </Text>
          <Text style={[styles.telecomsText, { color: colors.text }]}>
            TELECOMS
          </Text>
        </View>
        <Text style={[styles.igniteTagline, { color: colors.textLight }]}>
          Changing the way we connect
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Gradient Header - Matching Security screen design */}
      <LinearGradient
        colors={[
          colors.gradientEnd,
          colors.gradientEnd,
          colors.gradientEnd,
          colors.gradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          {/* Back Button and Title */}
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>About KazibuFast</Text>
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
        {renderHeroSection()}

        {/* About Card */}
        {renderAboutCard()}

        {/* Mission Card */}
        {renderMissionCard()}

        {/* Contact Information */}
        {renderSection(
          "Contact Information",
          "Get in touch with our team",
          contactItems,
          true,
        )}

        {/* Why Choose Kazibufast */}
        {renderPointsCard()}

        {/* Social Card */}
        {renderSocialCard()}

        {/* Powered By Section */}
        {renderPoweredBy()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            © 2020 Kazibufast Network. All rights reserved.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default AboutKazibufast;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Gradient Header Styles - Matching Security screen
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  headerSafeArea: {
    paddingTop: Platform.OS === "ios" ? 50 : 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerRightPlaceholder: {
    width: 40,
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
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
    width: "100%",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  logoBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 3,
    borderColor: "rgba(33, 199, 185, 0.3)",
  },
  logoTextContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  taglineContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  companyTagline: {
    fontSize: 13,
    fontWeight: "600",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  socialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  itemsContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
  },
  itemDivider: {
    height: 1,
    marginLeft: 68,
  },
  aboutCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  aboutHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  aboutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  aboutTitleContainer: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  aboutSubtitle: {
    fontSize: 13,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
  },
  missionCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  missionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  missionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  missionTitleContainer: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  missionSubtitle: {
    fontSize: 13,
  },
  missionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  tipsSection: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  tipsContainer: {
    gap: 14,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  socialCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  facebookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  facebookButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  facebookIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  facebookText: {
    flex: 1,
  },
  facebookTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  facebookSubtitle: {
    fontSize: 13,
  },
  poweredBySection: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  poweredByHeader: {
    alignItems: "center",
  },
  poweredByLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  igniteContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  igniteText: {
    fontSize: 32,
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: 2,
  },
  telecomsText: {
    fontSize: 18,
    fontWeight: "700",
  },
  igniteTagline: {
    fontSize: 12,
    fontStyle: "italic",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  footerSubtext: {
    fontSize: 11,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 20,
  },
});
