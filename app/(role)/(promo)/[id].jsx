import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../../store/user";

const PromoDetails = () => {
  const { id } = useLocalSearchParams(); // Gets the dynamic ID from URL (e.g., 1, 2, 3, or 4)
  const router = useRouter();
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();
  const user = useUserStore((state) => state.user);
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = {
    light: {
      primary: "#21C7B9",
      background: "#F5F8FA",
      surface: "#FFFFFF",
      text: "#136350",
      textLight: "#64748B",
      danger: "#FF6B6B",
    },
    dark: {
      primary: "#1f6f68",
      background: "#121212",
      surface: "#1E1E1E",
      text: "#FFFFFF",
      textLight: "#B0B0B0",
      danger: "#FF6B6B",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  useEffect(() => {
    fetchPromoDetails();
  }, [id]); // Refetch when ID changes

  const fetchPromoDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      const subdomain = user?.branch?.subdomain;

      if (!token || !subdomain) {
        throw new Error("Authentication required");
      }

      // Fetch specific promo details from your API using the dynamic ID
      const response = await fetch(
        `https://${subdomain}.kazibufastnet.com/api/app/promos/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 404) {
        throw new Error("Promo not found");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch promo details");
      }

      const data = await response.json();
      setPromo(data.promo);
    } catch (err) {
      setError(err.message);
      
      // Fallback to mock data with dynamic content based on ID
      const mockPromos = {
        "1": {
          id: "1",
          title: "Fiber Unlimited Plan",
          description: "Get up to 300Mbps for only ₱1,299/month",
          image: require("../../../assets/images/promo1.png"),
          validUntil: "2024-12-31",
          fullDescription: "Experience lightning-fast internet with our Fiber Unlimited Plan. Perfect for streaming 4K content, online gaming, and working from home with multiple devices simultaneously. This plan offers the perfect balance of speed and affordability for modern households.",
          benefits: [
            "Up to 300Mbps symmetrical speed",
            "Truly unlimited data (no Fair Usage Policy)",
            "Free WiFi 6 modem/router",
            "24/7 priority customer support",
            "Free installation worth ₱1,500",
            "30-day money-back guarantee",
          ],
          price: "₱1,299/month",
          terms: "12-month contract required. Standard installation fees may apply in select areas.",
          specifications: {
            speed: "300Mbps",
            dataCap: "Unlimited",
            contractLength: "12 months",
            installation: "Free",
          },
        },
        "2": {
          id: "2",
          title: "Family Bundle",
          description: "Internet + Mobile Data + Streaming",
          image: require("../../../assets/images/promo2.jpg"),
          validUntil: "2024-11-30",
          fullDescription: "The ultimate package for the whole family. Enjoy high-speed fiber internet, mobile data for everyone, and premium streaming services all in one convenient bundle. Keep everyone connected and entertained with this all-in-one solution.",
          benefits: [
            "100Mbps fiber internet",
            "5GB mobile data per line (up to 4 lines)",
            "Netflix Basic (1-screen) included",
            "Free installation and setup",
            "Unlimited calls to landline and mobile",
            "Family WiFi mesh system included",
          ],
          price: "₱1,999/month",
          terms: "24-month contract. Mobile lines must be under the same account holder.",
          specifications: {
            speed: "100Mbps",
            dataCap: "Unlimited",
            contractLength: "24 months",
            mobileData: "5GB per line",
          },
        },
        "3": {
          id: "3",
          title: "Gamer's Special",
          description: "Low latency fiber for gaming",
          image: require("../../../assets/images/promo3.jpg"),
          validUntil: "2025-01-15",
          fullDescription: "Optimized specifically for gamers! Experience ultra-low latency and high-speed connection with dedicated gaming features. Our gaming-optimized routing ensures you get the best connection for competitive gaming, with priority traffic for gaming packets.",
          benefits: [
            "500Mbps high-speed connection",
            "Ultra-low latency (as low as 5ms)",
            "Gaming-optimized router with QoS",
            "Priority gaming traffic routing",
            "Free gaming server boosters",
            "Dedicated gaming support line",
            "Static IP address included",
          ],
          price: "₱2,499/month",
          terms: "12-month contract. Gaming router provided on loan basis.",
          specifications: {
            speed: "500Mbps",
            latency: "5ms",
            router: "Gaming-optimized",
            staticIP: "Included",
          },
        },
        "4": {
          id: "4",
          title: "Work From Home",
          description: "Reliable connection for remote work",
          image: require("../../../assets/images/promo4.png"),
          validUntil: "2024-10-31",
          fullDescription: "Stay productive with our comprehensive work-from-home package. Includes reliable high-speed internet, productivity software, and cloud storage to ensure you have everything you need for seamless remote work.",
          benefits: [
            "200Mbps symmetrical speed",
            "1TB cloud storage (Google Drive)",
            "Microsoft 365 Business subscription",
            "Static IP address for VPN access",
            "Priority business support",
            "99.9% uptime SLA guarantee",
            "Free backup LTE connection",
          ],
          price: "₱1,799/month",
          terms: "12-month business contract. Microsoft 365 subscription for 1 user.",
          specifications: {
            speed: "200Mbps",
            cloudStorage: "1TB",
            productivitySuite: "Microsoft 365",
            uptime: "99.9%",
          },
        },
      };

      // Get the mock data for this specific ID
      const mockPromo = mockPromos[id];
      
      if (mockPromo) {
        setPromo(mockPromo);
      } else {
        setError("Promo not found");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textLight }]}>
          Loading promo details...
        </Text>
      </View>
    );
  }

  if (error || !promo) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error || "Promo not found"}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchPromoDetails}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 10 }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Go Back to Promos
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={promo.image} style={styles.image} />
        
        <SafeAreaView style={styles.headerAbsolute} edges={["top"]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, styles.backButtonAbsolute]}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{promo.title}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: colors.primary }]}>{promo.price}</Text>
            <View style={styles.validContainer}>
              <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
              <Text style={[styles.validText, { color: colors.textLight }]}>
                Valid until {new Date(promo.validUntil).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

          {/* Specifications Section (if available) */}
          {promo.specifications && (
            <View style={styles.specsContainer}>
              {Object.entries(promo.specifications).map(([key, value]) => (
                <View key={key} style={[styles.specItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.specLabel, { color: colors.textLight }]}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Text style={[styles.specValue, { color: colors.primary }]}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Description
            </Text>
            <Text style={[styles.description, { color: colors.textLight }]}>
              {promo.fullDescription}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              What's Included
            </Text>
            {promo.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.benefitText, { color: colors.textLight }]}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Terms & Conditions
            </Text>
            <Text style={[styles.terms, { color: colors.textLight }]}>
              {promo.terms}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              // Pass promo data to subscription plan screen
              router.push({
                pathname: "/(role)/(subscriptionPlan)/plan",
                params: { promoId: promo.id, promoPrice: promo.price }
              });
            }}
          >
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: "100%",
    height: 300,
  },
  headerAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  backButtonAbsolute: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
  },
  validContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  validText: {
    fontSize: 14,
  },
  specsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  specItem: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  specLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  specValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  terms: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default PromoDetails;