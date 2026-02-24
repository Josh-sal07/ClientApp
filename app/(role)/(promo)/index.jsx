import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../../theme/ThemeContext";
import { useColorScheme } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../../store/user";

const PromoIndex = () => {
  const router = useRouter();
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();
  const user = useUserStore((state) => state.user);
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = {
    light: {
      primary: "#21C7B9",
      surface: "#FFFFFF",
      text: "#136350",
      textLight: "#64748B",
      gray: "#718096",
      background: "#F5F8FA",
    },
    dark: {
      primary: "#1f6f68",
      surface: "#1E1E1E",
      text: "#FFFFFF",
      textLight: "#B0B0B0",
      gray: "#9E9E9E",
      background: "#121212",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      const subdomain = user?.branch?.subdomain;

      if (!token || !subdomain) {
        throw new Error("Authentication required");
      }

      // Fetch promos from your API
      const response = await fetch(
        `https://${subdomain}.kazibufastnet.com/api/app/promos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch promos");
      }

      const data = await response.json();
      setPromos(data.promos || []);
    } catch (err) {
      setError(err.message);
      // Fallback to mock data if API fails
      setPromos([
        {
          id: "1",
          title: "Fiber Unlimited Plan",
          description: "Get up to 300Mbps for only ₱1,299/month",
          image: require("../../../assets/images/promo1.png"),
          validUntil: "2024-12-31",
          price: "₱1,299/month",
        },
        {
          id: "2",
          title: "Family Bundle",
          description: "Internet + Mobile Data + Streaming",
          image: require("../../../assets/images/promo2.jpg"),
          validUntil: "2024-11-30",
          price: "₱1,999/month",
        },
        {
          id: "3",
          title: "Gamer's Special",
          description: "Low latency fiber for gaming",
          image: require("../../../assets/images/promo3.jpg"),
          validUntil: "2025-01-15",
          price: "₱2,499/month",
        },
        {
          id: "4",
          title: "Work From Home",
          description: "Reliable connection for remote work",
          image: require("../../../assets/images/promo4.png"),
          validUntil: "2024-10-31",
          price: "₱1,799/month",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getHeaderGradientColors = () => {
    if (effectiveMode === "dark") {
      return ["#121212", "#1a4a4b", "#2d6c6d"];
    } else {
      return ["#F5F8FA", "#21C7B9", "#65f1e8"];
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderPromoCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.promoCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/(role)/(promo)/${item.id}`)}
      activeOpacity={0.7}
    >
      <Image source={item.image} style={styles.promoImage} resizeMode="cover" />
      <View style={styles.promoContent}>
        <Text style={[styles.promoTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.promoDescription, { color: colors.textLight }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        <View style={styles.promoMeta}>
          <Text style={[styles.priceText, { color: colors.primary }]}>
            {item.price}
          </Text>
          <View style={styles.validContainer}>
            <Ionicons name="calendar-outline" size={14} color={colors.gray} />
            <Text style={[styles.validText, { color: colors.gray }]}>
              {formatDate(item.validUntil)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.detailsButton, { backgroundColor: colors.primary }]}
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/(role)/(promo)/${item.id}`);
          }}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textLight }]}>
          Loading promos...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <View style={styles.headerContainer}>
        <LinearGradient
          colors={getHeaderGradientColors()}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Promos & Offers</Text>
                <View style={{ width: 40 }} />
              </View>
              <Text style={styles.headerSubtitle}>
                Exclusive deals just for you
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <FlatList
        data={promos}
        renderItem={renderPromoCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchPromos}
      />
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
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  headerGradient: {
    width: "100%",
    paddingBottom: 30,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
  },
  listContent: {
    padding: 20,
    paddingTop: 25,
  },
  promoCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  promoImage: {
    width: "100%",
    height: 180,
  },
  promoContent: {
    padding: 16,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  promoDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  promoMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
  },
  validContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  validText: {
    fontSize: 12,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  detailsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default PromoIndex;