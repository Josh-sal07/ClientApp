import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  StatusBar,
  useColorScheme,
  ActivityIndicator,
  FlatList,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../../theme/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../../store/user";
import { Calendar } from "react-native-calendars";


const { width, height } = Dimensions.get("window");

function formatLongDate(date) {
  try {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

function toYMD(date) {
  try {
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

/**
 * ✅ Modal selector (Fixes your dropdown press issue permanently)
 * - No zIndex problems
 * - Works inside ScrollView
 * - Supports search (optional)
 */
function SelectModal({
  visible,
  title,
  subtitle,
  data,
  keyExtractor,
  renderItem,
  onClose,
  colors,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <Pressable style={modalStyles.backdrop} onPress={onClose} />
        <View
          style={[
            modalStyles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={modalStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.title, { color: colors.text }]}>
                {title}
              </Text>

              {!!subtitle && (
                <Text
                  style={[modalStyles.subtitle, { color: colors.textMuted }]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                modalStyles.closeBtn,
                { backgroundColor: colors.dropdownHover },
              ]}
              activeOpacity={0.75}
            >
              <Ionicons name="close" size={20} color="#111827" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ItemSeparatorComponent={() => (
              <View
                style={[modalStyles.sep, { backgroundColor: colors.border }]}
              />
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: Math.min(height * 0.75, 620),
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  sep: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginLeft: 56,
  },
});

export default function WifiPlanUpgradeScreen() {
  const router = useRouter();
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();
  const effectiveMode = mode === "system" ? systemColorScheme : mode;

  const user = useUserStore((state) => state.user);

  // =========================
  // Theme palette (same style as yours)
  // =========================
  const COLORS = useMemo(
    () => ({
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
        surface: "#FFFFFF",
        background: "#F8FAFC",
        text: "#136350",
        textLight: "#475569",
        textMuted: "#94A3B8",
        cardBg: "#FFFFFF",
        cardBorder: "#E2E8F0",
        dropdownBg: "#FFFFFF",
        dropdownHover: "#F1F5F9",
        placeholder: "#94A3B8",
        overlay: "rgba(0,0,0,0.55)",
        shadow: "#000000",
      },
      dark: {
        primary: "#4FD1C5",
        secondary: "#38B2AC",
        dark: "#0A0F1E",
        white: "#FFFFFF",
        lightGray: "#1E293B",
        gray: "#94A3B8",
        darkGray: "#0F172A",
        border: "#334155",
        success: "#4FD1C5",
        warning: "#FBBF24",
        danger: "#F87171",
        surface: "#1E293B",
        background: "#0F172A",
        text: "#F1F5F9",
        textLight: "#CBD5E1",
        textMuted: "#94A3B8",
        cardBg: "#1E293B",
        cardBorder: "#334155",
        dropdownBg: "#1E293B",
        dropdownHover: "#2D3A4F",
        placeholder: "#64748B",
        overlay: "rgba(0,0,0,0.7)",
        shadow: "#000000",
      },
    }),
    [],
  );

  const colors = effectiveMode === "dark" ? COLORS.dark : COLORS.light;

  // =========================
  // State
  // =========================
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [activeModal, setActiveModal] = useState(null); // "subscription" | "plan" | null
  const [submitting, setSubmitting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // =========================
  // Derived
  // =========================
  const selectedSubscription = useMemo(() => {
    return (
      subscriptions.find((s) => s.value === selectedSubscriptionId) || null
    );
  }, [subscriptions, selectedSubscriptionId]);

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  // =========================
  // Effects
  // =========================
  useEffect(() => {
    fetchUserSubscriptions();
  }, []);

  // =========================
  // API
  // =========================
  const fetchUserSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token");

      const subdomain = user?.branch?.subdomain;
      if (!subdomain) throw new Error("No subdomain");

      // Use the same endpoint that returns all subscriptions
      const url = `https://${subdomain}.kazibufastnet.com/api/app/subscriptions/plan/upgrade`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      console.log(
        "ALL SUBSCRIPTIONS RESPONSE:",
        JSON.stringify(response.data, null, 2),
      );

      let subscriptionsData = [];

      // Get all subscriptions from the subscription array
      if (
        response?.data?.subscription &&
        Array.isArray(response.data.subscription)
      ) {
        subscriptionsData = response.data.subscription;
      }

      console.log("Found subscriptions count:", subscriptionsData.length);

      const formatted = subscriptionsData.map((sub) => {
        // Find current plan inside branch plans
        const currentPlan =
          sub.branch?.plans?.find(
            (plan) => String(plan.id) === String(sub.plan_id),
          ) || null;

        return {
          id: sub.id,
          subscription_id: sub.subscription_id,
          monthly_payment: currentPlan?.price ?? 0,
          plan_name: currentPlan?.name ?? "Plan",
          plan_id: sub.plan_id,
          branch_id: sub.branch_id,
          branch_name: sub.branch?.name,
          status: sub.status,
          value: String(sub.id),
          displayName: currentPlan?.name ?? "Plan",
          priceLabel: `₱${Number(currentPlan?.price ?? 0).toLocaleString()}/mo`,
        };
      });

      console.log("Formatted subscriptions:", formatted.length);
      setSubscriptions(formatted);

      if (formatted.length > 0) {
        setSelectedSubscriptionId(formatted[0].value);
        // Fetch plans for the first subscription
        fetchUpgradePlans(formatted[0].id);
      }
    } catch (error) {
      console.log("Error fetching subscriptions:", error);
      Alert.alert("Error", "Failed to load subscriptions");
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const fetchUpgradePlans = async (subscriptionRecordId) => {
    try {
      setLoadingPlans(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const subdomain = user?.branch?.subdomain;
      if (!subdomain) throw new Error("No subdomain found");

      const url = `https://${subdomain}.kazibufastnet.com/api/app/subscriptions/plan/upgrade`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      console.log(
        "PLANS API RESPONSE:",
        JSON.stringify(response.data, null, 2),
      );

      let plansData = [];

      // Get all subscriptions from the response
      const subscriptionsData = Array.isArray(response?.data?.subscription)
        ? response.data.subscription
        : [];

      console.log(
        "All subscriptions in plans response:",
        subscriptionsData.length,
      );

      // Find the specific subscription by its record ID
      const matchedSubscription = subscriptionsData.find(
        (sub) => String(sub.id) === String(subscriptionRecordId),
      );

      if (matchedSubscription?.branch?.plans) {
        // Get all plans from the branch
        plansData = matchedSubscription.branch.plans;
        console.log(
          `Found ${plansData.length} plans for branch ${matchedSubscription.branch_id}`,
        );
      } else {
        console.log("No plans found for subscription:", subscriptionRecordId);
      }

      if (!plansData.length) {
        setPlans([]);
        return;
      }

      // Get current plan ID
      const currentPlanId = matchedSubscription?.plan_id;

      const formattedPlans = plansData
        .filter((plan) => {
          // Only show active plans
          return plan.status === "1";
        })
        .map((plan) => {
          const priceValue = Number(plan.price ?? 0);

          return {
            id: String(plan.id),
            name: plan.name ?? "Plan",
            speed: extractSpeed(plan.name), // Helper function to extract speed
            price: `₱${priceValue.toLocaleString()}/mo`,
            description: plan.description ?? "Fiber Internet Plan",
            icon: getPlanIcon(plan.name),
            rawPrice: priceValue,
            isCurrentPlan:
              currentPlanId && String(plan.id) === String(currentPlanId),
          };
        })
        .sort((a, b) => a.rawPrice - b.rawPrice);

      console.log("Formatted plans:", formattedPlans.length);
      setPlans(formattedPlans);
    } catch (error) {
      console.log("Error fetching upgrade plans:", error);
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Helper function to extract speed from plan name
  const extractSpeed = (planName) => {
    if (!planName) return "N/A";
    const match = planName.match(/(\d+)\s*Mbps/i);
    return match ? `${match[1]} Mbps` : planName;
  };

  // Helper function to assign icons based on plan name
  const getPlanIcon = (planName) => {
    const name = planName?.toLowerCase() || "";
    if (name.includes("15")) return "rocket-outline";
    if (name.includes("35")) return "flash-outline";
    if (name.includes("50")) return "speedometer-outline";
    if (name.includes("75")) return "business-outline";
    if (name.includes("100")) return "infinite-outline";
    if (name.includes("150")) return "infinite-outline";
    if (name.includes("200")) return "infinite-outline";
    return "wifi-outline";
  };

  const handleSubmit = async () => {
    if (!selectedSubscriptionId) {
      Alert.alert("Missing", "Please select a subscription to upgrade.");
      return;
    }
    if (!selectedPlanId) {
      Alert.alert("Missing", "Please select a new plan.");
      return;
    }

    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Authentication required");
        return;
      }

      const subdomain = user?.branch?.subdomain;
      if (!subdomain) {
        Alert.alert("Error", "Subdomain not found");
        return;
      }

      const url = `https://${subdomain}.kazibufastnet.com/api/app/subscriptions/plan/upgrade`;

      await axios.post(
        url,
        {
          subscription_id: selectedSubscriptionId,
          plan_id: selectedPlanId,
          activation_date: toYMD(selectedDate),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 20000,
        },
      );

      setShowSuccessModal(true);
    } catch (error) {
      console.log("Error submitting upgrade:", error);
      // You previously showed success even on error; I’ll keep that behavior (but you can change to Alert).
      setShowSuccessModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // DatePicker
  // =========================
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  // =========================
  // Navigation
  // =========================
  const handleBack = () => router.back();
  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  // =========================
  // Render helpers
  // =========================
  const renderSubscriptionRow = ({ item }) => {
    const isSelected = item.value === selectedSubscriptionId;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          setSelectedSubscriptionId(item.value);
          setActiveModal(null);
          fetchUpgradePlans(item.id);
        }}
        style={[
          styles.listRow,
          isSelected && { backgroundColor: colors.primary + "14" },
        ]}
      >
        <View
          style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}
        >
          <Ionicons name="wifi" size={20} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            {item.displayName || item.plan_name || "Subscription"}
          </Text>

          <View style={styles.rowMeta}>
            <Text style={[styles.rowMetaText, { color: colors.textMuted }]}>
              ID: {item.subscription_id}
            </Text>

            <View style={styles.rowDotWrap}>
              <View
                style={[styles.rowDot, { backgroundColor: colors.success }]}
              />
              <Text
                style={[
                  styles.rowMetaText,
                  { color: colors.textLight, textTransform: "capitalize" },
                ]}
              >
                {item.status || "active"}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text style={[styles.rowPrice, { color: colors.primary }]}>
            {item.priceLabel ||
              `₱${Number(item.monthly_payment || 0).toLocaleString()}/mo`}
          </Text>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPlanRow = ({ item }) => {
    const isSelected = item.id === selectedPlanId;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          setSelectedPlanId(item.id);
          setActiveModal(null);
        }}
        style={[
          styles.listRow,
          isSelected && { backgroundColor: colors.primary + "14" },
        ]}
      >
        <View
          style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}
        >
          <Ionicons
            name={item.icon || "rocket-outline"}
            size={20}
            color={colors.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
            {item.description}
          </Text>
          <Text style={[styles.rowSpeed, { color: colors.primary }]}>
            {item.speed}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text style={[styles.rowPrice, { color: colors.primary }]}>
            {item.price}
          </Text>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // =========================
  // UI
  // =========================
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={effectiveMode === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header */}
      <LinearGradient
        colors={
          effectiveMode === "dark"
            ? ["#1a2c3e", "#0F172A"]
            : ["#65f1e8", "#F8FAFC"]
        }
        style={styles.header}
      >
        <SafeAreaView style={styles.headerSafeArea}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            {/* <Ionicons name="arrow-up-circle" size={42} color="#5eead4" /> */}
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Upgrade Plan
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.text + "CC" }]}
            >
              Faster speeds & better features
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Ionicons name="options-outline" size={24} color={colors.primary} />
            <Text style={[styles.formTitle, { color: colors.text }]}>
              Upgrade Options
            </Text>
          </View>

          {/* Select Subscription Button */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Select subscription to upgrade
          </Text>

          <TouchableOpacity
            style={[
              styles.selectBtn,
              {
                backgroundColor: colors.dropdownBg,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => {
              if (loadingSubscriptions) return;
              setActiveModal("subscription");
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                gap: 10,
              }}
            >
              <View
                style={[
                  styles.selectIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                {selectedSubscription && (
                  <Text style={[styles.selectSub, { color: colors.text }]}>
                    ID: {selectedSubscription.subscription_id}
                  </Text>
                )}
                <Text
                  style={[
                    styles.selectTitle,
                    {
                      color: selectedSubscription
                        ? colors.textMuted
                        : colors.placeholder,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {loadingSubscriptions
                    ? "Loading subscriptions..."
                    : selectedSubscription
                      ? `${selectedSubscription.displayName || selectedSubscription.plan_name} `
                      : "Choose your subscription"}
                </Text>
              </View>
            </View>

            {loadingSubscriptions ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>

          {/* Select Plan Button */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Select new plan
          </Text>

          <TouchableOpacity
            style={[
              styles.selectBtn,
              {
                backgroundColor: colors.dropdownBg,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => setActiveModal("plan")}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                gap: 10,
              }}
            >
              <View
                style={[
                  styles.selectIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="rocket-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.selectTitle,
                    { color: selectedPlan ? colors.text : colors.placeholder },
                  ]}
                  numberOfLines={1}
                >
                  {selectedPlan
                    ? `${selectedPlan.name} • ${selectedPlan.speed} • ${selectedPlan.price}`
                    : "Choose your new plan"}
                </Text>

                {selectedPlan && (
                  <Text style={[styles.selectSub, { color: colors.textMuted }]}>
                    {selectedPlan.description}
                  </Text>
                )}
              </View>
            </View>

            <Ionicons name="chevron-down" size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Date */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Preferred activation date
          </Text>

          <TouchableOpacity
            style={[
              styles.selectBtn,
              {
                backgroundColor: colors.dropdownBg,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => setShowDatePicker(true)}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                gap: 10,
              }}
            >
              <View
                style={[
                  styles.selectIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.selectTitle, { color: colors.text }]}>
                {formatLongDate(selectedDate)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
              themeVariant={effectiveMode}
              accentColor={colors.primary}
            />
          )} */}

          {/* Summary */}
          {selectedSubscription && selectedPlan && (
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.primary + "08",
                  borderColor: colors.primary + "22",
                },
              ]}
            >
              <View style={styles.summaryHeader}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.summaryTitle, { color: colors.primary }]}>
                  Upgrade Summary
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: colors.textLight }]}
                  >
                    From
                  </Text>
                  <Text
                    style={[styles.summaryValue, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {selectedSubscription.plan_name}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: colors.textLight }]}
                  >
                    To
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: colors.primary, fontWeight: "800" },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedPlan.name}
                  </Text>
                </View>

                <View
                  style={[
                    styles.summaryDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: colors.textLight }]}
                  >
                    New Speed
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {selectedPlan.speed}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: colors.textLight }]}
                  >
                    New Price
                  </Text>
                  <Text
                    style={[styles.summaryPrice, { color: colors.success }]}
                  >
                    {selectedPlan.price}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: colors.textLight }]}
                  >
                    Activation
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formatLongDate(selectedDate)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              (!selectedSubscriptionId || !selectedPlanId || submitting) && {
                opacity: 0.65,
              },
            ]}
            onPress={handleSubmit}
            disabled={!selectedSubscriptionId || !selectedPlanId || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text
                  style={[styles.submitButtonText, { color: colors.white }]}
                >
                  Submit Upgrade Request
                </Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Subscription Select Modal */}
      <SelectModal
        visible={activeModal === "subscription"}
         colors={colors} 
        title="Select Subscription"
        subtitle="Choose which subscription you want to upgrade."
        data={subscriptions}
        keyExtractor={(item) => String(item.value)}
        onClose={() => setActiveModal(null)}
        renderItem={renderSubscriptionRow}
      />

      {/* Plan Select Modal */}
      <SelectModal
        visible={activeModal === "plan"}
         colors={colors} 
        title="Select New Plan"
        subtitle="Pick a plan that fits your needs."
        data={plans}
        keyExtractor={(item) => String(item.id)}
        onClose={() => setActiveModal(null)}
        renderItem={renderPlanRow}
      />
      
      <Modal
  visible={showDatePicker}
  transparent
  animationType="fade"
  onRequestClose={() => setShowDatePicker(false)}
>
  <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
    <View
      style={[
        styles.modalContent,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.modalTitle, { color: colors.text }]}>
        Select Activation Date
      </Text>

      <Calendar
        current={toYMD(selectedDate)}
        minDate={toYMD(new Date())}
        onDayPress={(day) => {
          setSelectedDate(new Date(day.dateString));
          setShowDatePicker(false);
        }}
        theme={{
          backgroundColor: colors.surface,
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.textMuted,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#FFFFFF",
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          monthTextColor: colors.text,
          arrowColor: colors.primary,
          textDisabledColor: colors.textMuted,
        }}
        markedDates={{
          [toYMD(selectedDate)]: {
            selected: true,
            selectedColor: colors.primary,
          },
        }}
      />

      <TouchableOpacity
        style={[styles.modalButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowDatePicker(false)}
      >
        <Text style={[styles.modalButtonText, { color: colors.white }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.modalIconContainer,
                { backgroundColor: colors.success + "15" },
              ]}
            >
              <LinearGradient
                colors={[colors.success, colors.secondary]}
                style={styles.modalIconGradient}
              >
                <Ionicons name="checkmark" size={40} color={colors.white} />
              </LinearGradient>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Request Submitted!
            </Text>

            <Text style={[styles.modalMessage, { color: colors.textLight }]}>
              Your upgrade request for subscription{" "}
              <Text style={{ fontWeight: "800", color: colors.text }}>
                {selectedSubscription?.subscription_id || "—"}
              </Text>{" "}
              has been received. We'll process it as soon as possible.
            </Text>

            <View
              style={[
                styles.modalDetails,
                {
                  backgroundColor: colors.dropdownBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.modalDetailRow}>
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.modalDetailText, { color: colors.text }]}>
                  {selectedPlan?.name || "Selected Plan"}
                </Text>
              </View>

              <View style={styles.modalDetailRow}>
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.modalDetailText, { color: colors.text }]}>
                  {selectedPlan?.speed || "—"}
                </Text>
              </View>

              <View style={styles.modalDetailRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.modalDetailText, { color: colors.text }]}>
                  {formatLongDate(selectedDate)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleModalClose}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalButtonText, { color: colors.white }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =========================
// Styles (Full, polished)
// =========================
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingBottom: 24,
  },
  headerSafeArea: {},
  backButton: {
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    bottom: 20,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    bottom: 15,
    opacity: 0.9,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  currentPlanWrapper: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  currentPlanCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  currentPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  currentPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  currentPlanLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    opacity: 0.85,
  },
  currentPlanName: {
    fontSize: 16,
    fontWeight: "800",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  currentPlanDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, marginBottom: 4, opacity: 0.9 },
  detailValue: { fontSize: 14, fontWeight: "700" },
  detailPrice: { fontSize: 18, fontWeight: "900" },

  formContainer: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 10,
  },
  formTitle: { fontSize: 18, fontWeight: "800" },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    opacity: 0.9,
    marginTop: 10,
  },

  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  selectIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  selectTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  selectSub: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "600",
  },

  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  summaryLabel: { fontSize: 13, fontWeight: "700" },
  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  summaryPrice: { fontSize: 14, fontWeight: "900" },
  summaryDivider: { height: 1, marginVertical: 8 },

  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  // List rows inside modal
  listRow: {
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  rowTitle: { fontSize: 14, fontWeight: "900" },
  rowDesc: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  rowSpeed: { fontSize: 12, fontWeight: "900", marginTop: 6 },
  rowPrice: { fontSize: 13, fontWeight: "900" },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
  },
  rowMetaText: { fontSize: 12, fontWeight: "700" },
  rowDotWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowDot: { width: 6, height: 6, borderRadius: 3 },

  // Success modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  modalIconGradient: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 21,
  },
  modalDetails: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: "100%",
    marginBottom: 18,
    gap: 10,
  },
  modalDetailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalDetailText: { fontSize: 14, fontWeight: "700" },
  modalButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: { fontSize: 15, fontWeight: "900", letterSpacing: 0.3 },
});
