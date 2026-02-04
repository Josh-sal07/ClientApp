import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function WifiPlansPosterScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ================= HERO ================= */}
        <LinearGradient
          colors={["#0f2a44", "#143d66"]}
          style={styles.hero}
        >
          <Ionicons name="wifi" size={52} color="#5eead4" />
          <Text style={styles.brand}>KazibuFast Networks</Text>
          <Text style={styles.heroTitle}>WiFi Subscription Plans</Text>

          {/* Fake network illustration substitute */}
          <View style={styles.networkVisual}>
            <Ionicons name="business" size={42} color="#5eead4" />
            <View style={styles.houseRow}>
              <Ionicons name="home" size={24} color="#93c5fd" />
              <Ionicons name="home" size={24} color="#93c5fd" />
              <Ionicons name="home" size={24} color="#93c5fd" />
              <Ionicons name="home" size={24} color="#93c5fd" />
            </View>
          </View>
        </LinearGradient>

        {/* ================= PLANS ================= */}
        <View style={styles.plansWrapper}>
          {PLAN_DATA.map((p, i) => (
            <View key={i} style={styles.planCard}>
              <Text style={styles.planName}>{p.name}</Text>
              <Text style={styles.planTag}>{p.tag}</Text>
              <Text style={styles.speed}>{p.speed}</Text>

              {p.features.map((f, idx) => (
                <View key={idx} style={styles.row}>
                  <Ionicons name="checkmark" size={16} color="#22c55e" />
                  <Text style={styles.text}>{f}</Text>
                </View>
              ))}

              <Text style={styles.price}>{p.price}</Text>
            </View>
          ))}
        </View>

        {/* ================= LOWER SECTION ================= */}
        <View style={styles.bottomGrid}>

          {/* Network Features */}
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Network Features</Text>
            {NETWORK_FEATURES.map((f, i) => (
              <View key={i} style={styles.row}>
                <Ionicons name="wifi" size={18} color="#38bdf8" />
                <Text style={styles.text}>{f}</Text>
              </View>
            ))}
          </View>

          {/* App Features */}
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Manage Your Plan</Text>
            {APP_FEATURES.map((f, i) => (
              <View key={i} style={styles.row}>
                <Ionicons name="phone-portrait" size={18} color="#38bdf8" />
                <Text style={styles.text}>{f}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= DATA ================= */

const PLAN_DATA = [
  {
    name: "Basic",
    tag: "Home Starter",
    speed: "10 Mbps",
    price: "₱799 / month",
    features: ["3–5 devices", "Unlimited data", "Free router", "24/7 support"],
  },
  {
    name: "Standard",
    tag: "Family Plus",
    speed: "25 Mbps",
    price: "₱1,299 / month",
    features: ["8–10 devices", "Unlimited data", "Dual-band WiFi", "Free install"],
  },
  {
    name: "Premium",
    tag: "Power User",
    speed: "50 Mbps",
    price: "₱1,999 / month",
    features: ["15+ devices", "Unlimited data", "Fiber", "Priority support"],
  },
  {
    name: "Business",
    tag: "Enterprise",
    speed: "100 Mbps",
    price: "₱3,999 / month",
    features: ["Multi access", "Static IP", "Monitoring", "SLA uptime"],
  },
];

const NETWORK_FEATURES = [
  "Fiber-optic backbone",
  "Stable & low latency",
  "Secure WPA3 network",
  "Scalable coverage per area",
];

const APP_FEATURES = [
  "View active subscription",
  "Upgrade / downgrade plan",
  "Billing & payment history",
  "Speed test",
  "Ticket & support chat",
];

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  hero: {
    padding: 24,
    alignItems: "center",
  },
  brand: {
    color: "#e5e7eb",
    marginTop: 8,
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 4,
  },
  networkVisual: {
    marginTop: 24,
    alignItems: "center",
  },
  houseRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  plansWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
  },
  planCard: {
    width: width / 2 - 20,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    margin: 8,
  },
  planName: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  planTag: {
    color: "#94a3b8",
    marginBottom: 6,
  },
  speed: {
    fontSize: 20,
    fontWeight: "800",
    color: "#38bdf8",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  text: {
    color: "#e5e7eb",
    fontSize: 12,
  },
  price: {
    marginTop: 10,
    textAlign: "center",
    fontWeight: "800",
    color: "#22c55e",
  },
  bottomGrid: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  box: {
    flex: 1,
    backgroundColor: "#020617",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  boxTitle: {
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 10,
  },
});
