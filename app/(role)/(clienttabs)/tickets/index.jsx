import { useFocusEffect } from "expo-router";
import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
  Animated,
  Alert,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../theme/ThemeContext";
import { useColorScheme } from "react-native";
import { useUserStore } from "../../../../store/user";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { sharedScrollY } from "../../../../shared/sharedScroll";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Correct API base URLs
const API_BASE_URL = "https://staging.kazibufastnet.com/api/app/tickets";

// Helper function for user-specific keys
const getUserTicketsKey = (userId) => `kazi_support_tickets_${userId}`;

const Ticket = () => {
  const scrollY = sharedScrollY;
  const user = useUserStore((state) => state.user);
  const { mode } = useTheme();
  const systemColorScheme = useColorScheme();

  // Determine effective theme mode
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
      surface: "#FFFFFF",
      background: "#F5F8FA",
      text: "#1E293B",
      textLight: "#64748B",
      ticketSubmitted: "#21C7B9",
      ticketClosed: "#999",
      ticketPending: "#FF9500",
      ticketInProgress: "#FF9500",
      ticketResolved: "#aaa9be",
      ticketCompleted: "#5AC8FA",
      modalOverlay: "rgba(0,0,0,0.5)",
      skeleton: "#e5e7eb",
      imageOverlay: "rgba(0,0,0,0.6)",
      clearButton: "#ff4444",
      lowPriority: "#FF9500",
      mediumPriority: "#FFA726",
      highPriority: "#FF3B30",
      criticalPriority: "#D70015",
    },
    dark: {
      primary: "#35958d",
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
      surface: "#1E1E1E",
      background: "#121212",
      text: "#FFFFFF",
      textLight: "#B0B0B0",
      ticketSubmitted: "#1f6f68",
      ticketClosed: "#666",
      ticketPending: "#FF9500",
      ticketInProgress: "#FF9500",
      ticketResolved: "#666",
      ticketCompleted: "#5AC8FA",
      modalOverlay: "rgba(0,0,0,0.7)",
      skeleton: "#2d2d2d",
      imageOverlay: "rgba(0,0,0,0.8)",
      clearButton: "#ff4444",
      lowPriority: "#FF9500",
      mediumPriority: "#FFA726",
      highPriority: "#FF3B30",
      criticalPriority: "#D70015",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];

  // State management
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [ticketStats, setTicketStats] = useState({
    resolved: 0,
    close: 0,
    in_progress: 0,
    submitted: 0,
  });

  const normalizeStatusForUser = (status) => {
    switch ((status || "").toLowerCase()) {
      case "for-approval":
      case "submitted":
        return "submitted";

      case "in progress":
      case "in_progress":
        return "in_progress";

      case "close":
      case "resolved":
        return "resolved";

      default:
        return "submitted";
    }
  };

  // ==================== GET AUTH TOKEN ====================
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return token;
    } catch (err) {
      return null;
    }
  };

  // ==================== FIXED: VIEW SINGLE TICKET DETAILS ====================
  const viewTicket = async (ticketId) => {
    try {

      if (!ticketId) {
        Alert.alert("Error", "Ticket ID is required");
        return null;
      }

      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "Authentication required");
        return null;
      }

      // FIRST: Try to get the ticket from our state to see what ID we have
      const localTicket = tickets.find(
        (t) =>
          t.id === ticketId ||
          t.backendId === ticketId ||
          t.ticketNumber === ticketId,
      );

      // Determine which ID to send to backend
      // PRIORITY: backendId > id > ticketNumber
      let idToSend = null;

      if (localTicket?.backendId) {
        idToSend = localTicket.backendId; // This is the actual database ID
      } else if (
        localTicket?.id &&
        !localTicket.id.toString().includes("TKT-")
      ) {
        // Use id only if it doesn't look like a display number
        idToSend = localTicket.id;
      } else {
        idToSend = ticketId; // Use whatever was passed
      }

      // Ensure it's a string (some backends prefer strings)
      idToSend = idToSend.toString();

      // Now call the API with the CORRECT ID
      const response = await axios.get(`${API_BASE_URL}/view/${idToSend}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      let ticketData = null;

      // Check different response structures
      if (response.data) {
        // Structure 1: response.data.ticket (what your API returns)
        if (response.data.ticket) {
          ticketData = response.data.ticket;
        }
        // Structure 2: response.data.data (common API pattern)
        else if (response.data.data) {
          ticketData = response.data.data;
        }
        // Structure 3: response.data itself is the ticket
        else if (response.data.id || response.data.ticket_number) {
          ticketData = response.data;
        }
      }

      if (!ticketData) {
        throw new Error("No ticket data in response");
      }

      // Format the ticket data
      const createdAt = ticketData.created_at
        ? new Date(ticketData.created_at)
        : ticketData.createdAt
          ? new Date(ticketData.createdAt)
          : new Date();

      const updatedAt = ticketData.updated_at
        ? new Date(ticketData.updated_at)
        : ticketData.updatedAt
          ? new Date(ticketData.updatedAt)
          : createdAt;

      // Extract subscription data
      let subscriptionData = null;
      if (ticketData.subscription) {
        subscriptionData = ticketData.subscription;
      } else if (
        ticketData.subscription_id &&
        typeof ticketData.subscription_id === "object"
      ) {
        subscriptionData = ticketData.subscription?.subscription_id;
      }

      const formattedTicket = {
        id: ticketData.id, // This is the actual backend database ID
        backendId: ticketData.id, // Store it here too
        ticketNumber: ticketData.ticket_number || ticketData.id,
        subject: ticketData.subject || ticketData.title || "No Subject",
        status: (ticketData.status || "submitted").toLowerCase().trim(),
        priority: (
          ticketData.priority_level ||
          ticketData.priority ||
          "medium"
        ).toLowerCase(),
        category: ticketData.type || ticketData.category || "General",
        createdAt: createdAt,
        updatedAt: updatedAt,
        attachments: ticketData.picture
          ? [ticketData.picture]
          : ticketData.attachments || ticketData.images || [],
        assignedTo:
          ticketData.team_id ||
          ticketData.assigned_to ||
          ticketData.assigned_agent ||
          null,
        lastResponse: null,
        responseCount: 0,
        formattedDate: createdAt.toLocaleDateString(),
        formattedTime: createdAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: "api",
        subscription_id: ticketData.subscription?.subscription_id,
        subscription_name:
          subscriptionData?.plan?.[0]?.name ||
          subscriptionData?.plan?.name ||
          subscriptionData?.subscription?.subscription_id ||
          "Unknown",
      };
      return formattedTicket;
    } catch (error) {

      // Return the local ticket as fallback
      if (user && user.id) {
        try {
          const userTicketsKey = getUserTicketsKey(user.id);
          const storedTickets = await AsyncStorage.getItem(userTicketsKey);

          if (storedTickets) {
            const localTickets = JSON.parse(storedTickets);
            const foundTicket = localTickets.find(
              (t) =>
                t.id === ticketId ||
                t.backendId === ticketId ||
                t.ticketNumber === ticketId,
            );

            if (foundTicket) {
              return foundTicket;
            }
          }
        } catch (storageError) {
        }
      }

      Alert.alert("Error", `Failed to load ticket: ${error.message}`);

      return null;
    }
  };
  // ==================== FETCH TICKETS FROM API ====================
  const fetchTicketsFromAPI = async () => {
    try {
      const token = await getToken();

      const response = await axios.get(API_BASE_URL, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        let ticketsData = [];

        // Handle different response structures
        if (Array.isArray(response.data.data)) {
          ticketsData = response.data.data;
        } else if (
          response.data.data &&
          Array.isArray(response.data.data.tickets)
        ) {
          ticketsData = response.data.data.tickets;
        } else if (
          response.data.tickets &&
          Array.isArray(response.data.tickets)
        ) {
          ticketsData = response.data.tickets;
        }

        // Process API tickets - CRITICAL: Use actual database ID
        const apiTickets = ticketsData.map((ticket) => {
          // The actual database ID from backend
          const backendId = ticket.id || ticket.ticket_id;

          // Use the backendId as the primary ID
          const ticketId = backendId || `API-${Date.now()}-${Math.random()}`;

          const status = ticket.status
            ? ticket.status.toLowerCase().trim()
            : null;

          let createdAt = new Date();
          if (ticket.created_at) {
            createdAt = new Date(ticket.created_at);
          } else if (ticket.createdAt) {
            createdAt = new Date(ticket.createdAt);
          }

          return {
            id: ticketId, // Use backend database ID
            backendId: backendId, // Store it separately
            ticketNumber: ticket.ticket_number || ticketId,
            subject: ticket.subject || ticket.title || "No Subject",
            status: status,
            priority: (ticket.priority || "medium").toLowerCase(),
            category: ticket.category || ticket.type || "General",
            createdAt: createdAt,
            updatedAt: ticket.updated_at
              ? new Date(ticket.updated_at)
              : createdAt,
            attachments: ticket.attachments || ticket.images || [],
            assignedTo: ticket.assigned_to || ticket.assigned_agent || null,
            lastResponse: ticket.last_response || null,
            responseCount: ticket.response_count || ticket.replies || 0,
            formattedDate: createdAt.toLocaleDateString(),
            formattedTime: createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            source: "api",
            subscription_id: ticket.subscription?.subscription_id,
            subscription_name: ticket.subscription_name,
          };
        });

        return apiTickets;
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  // ==================== LOAD TICKETS FROM BOTH SOURCES ====================
  const loadTickets = async () => {
    try {
      setLoading(true);

      if (!user || !user.id) {
        setTickets([]);
        setFilteredTickets([]);
        calculateStats([]);
        return;
      }

      let allTickets = [];

      // 1. First, fetch from API
      const apiTickets = await fetchTicketsFromAPI();
      if (apiTickets.length === 0) {
        const userTicketsKey = getUserTicketsKey(user.id);
        await AsyncStorage.removeItem(userTicketsKey);

        setTickets([]);
        setFilteredTickets([]);
        calculateStats([]);
        setLastRefresh(new Date());
        return;
      }

      // Process API tickets to ensure they have backendId
      const processedApiTickets = apiTickets.map((ticket) => ({
        ...ticket,
        backendId: ticket.id, // Store the actual database ID
        id: ticket.id, // Use the actual database ID as id
      }));

      // 2. Load from local storage
      try {
        const userTicketsKey = getUserTicketsKey(user.id);
        const storedTickets = await AsyncStorage.getItem(userTicketsKey);

        if (storedTickets) {
          const localTickets = JSON.parse(storedTickets);

          // Process local tickets
          const processedLocalTickets = localTickets.map((ticket) => {
            // Check if this local ticket has a backendId
            const hasBackendId =
              ticket.backendId ||
              (ticket.id && !ticket.id.toString().includes("TKT-"));

            return {
              ...ticket,
              id: hasBackendId ? ticket.backendId || ticket.id : ticket.id,
              backendId: ticket.backendId || ticket.id,
            };
          });

          // Merge tickets, preferring API tickets
          const apiTicketIds = new Set(
            processedApiTickets.map((t) => t.backendId || t.id),
          );
          const uniqueLocalTickets = processedLocalTickets.filter(
            (localTicket) =>
              !apiTicketIds.has(localTicket.backendId || localTicket.id),
          );

          allTickets =
            processedApiTickets.length > 0
              ? [...processedApiTickets, ...uniqueLocalTickets]
              : processedApiTickets;
        } else {
          allTickets = processedApiTickets;
        }
      } catch (storageError) {
        allTickets = processedApiTickets;
      }

      // Sort by date
      allTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTickets(allTickets);
      setFilteredTickets(allTickets);
      calculateStats(allTickets);
      setLastRefresh(new Date());
    } catch (error) {
      Alert.alert("Error", "Failed to load tickets. Please try again.");
      setTickets([]);
      setFilteredTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER TICKET IMAGES ====================
  const renderTicketImages = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    // Filter out invalid attachments and extract URIs
    const validAttachments = attachments
      .filter((attachment) => {
        if (!attachment) return false;

        // Check various possible image source formats
        const hasUri = attachment.uri || attachment.url || attachment.path;
        const isString = typeof attachment === "string";

        return hasUri || isString;
      })
      .map((attachment) => {
        // Handle different attachment formats
        if (typeof attachment === "string") {
          // If it's already a string URL
          return attachment;
        } else if (attachment.uri) {
          return attachment.uri;
        } else if (attachment.url) {
          return attachment.url;
        } else if (attachment.path) {
          return attachment.path;
        }
        return null;
      })
      .filter((uri) => uri && uri.length > 0);

    if (validAttachments.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        <Text style={[styles.imagesLabel, { color: colors.textLight }]}>
          Attached Images ({validAttachments.length}):
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesScroll}
        >
          {validAttachments.map((imageUri, index) => {

            return (
              <TouchableOpacity
                key={index}
                style={styles.imageThumbnailContainer}
                onPress={() => {
                  setViewingImage(imageUri);
                  setImageModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imageThumbnail}
                  resizeMode="cover"
                  onError={(e) => {
                  }}
                  onLoad={() => {
                  }}
                />
                <View
                  style={[
                    styles.imageOverlay,
                    { backgroundColor: colors.imageOverlay },
                  ]}
                >
                  <Ionicons name="expand" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ==================== HELPER FUNCTIONS ====================

  // Calculate ticket statistics
  const calculateStats = (ticketsList) => {
    const stats = {
      resolved: ticketsList.filter((t) => t.status === "resolved").length,
      close: ticketsList.filter((t) => t.status === "close").length,
      in_progress: ticketsList.filter((t) => t.status === "in_progress").length,
      submitted: ticketsList.filter((t) => t.status === "submitted").length,
    };
    setTicketStats(stats);
  };

  // Get status color
  const getStatusColor = (status) => {
    const normalized = normalizeStatusForUser(status);

    return {
      submitted: colors.ticketSubmitted, // teal
      in_progress: colors.ticketInProgress, // blue
      resolved: colors.ticketResolved, // purple
    }[normalized];
  };

  // Format status text for display
  const formatStatusText = (status) => {
    const normalized = normalizeStatusForUser(status);

    return {
      submitted: "Submitted",
      in_progress: "In Progress",
      resolved: "Resolved",
    }[normalized];
  };

  // Handle viewing a specific ticket
  const handleViewTicket = async (ticket) => {

    // Show the local ticket immediately
    setSelectedTicket(ticket);

    // Fetch latest from API in background
    if (ticket.id) {
      const latestTicket = await viewTicket(ticket.id);
      if (latestTicket) {


        // CRITICAL FIX: Preserve local attachments if API returns empty
        if (
          latestTicket.attachments &&
          latestTicket.attachments.length === 0 &&
          ticket.attachments &&
          ticket.attachments.length > 0
        ) {
          latestTicket.attachments = ticket.attachments;
        }

        // Merge the best data: API data with local attachments
        const mergedTicket = {
          ...latestTicket,
          // Keep attachments from local if API doesn't have them
          attachments:
            latestTicket.attachments && latestTicket.attachments.length > 0
              ? latestTicket.attachments
              : ticket.attachments || [],
          // Also merge other fields that might be better in local version
          category: latestTicket.category || ticket.category,
          priority: latestTicket.priority || ticket.priority,
        };
        setSelectedTicket(mergedTicket);
      }
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTickets();
    setTimeout(() => setRefreshing(false), 1000);
  }, [user]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setLoading(true);
    await loadTickets();
    setTimeout(() => setLoading(false), 500);
  };

  // Load tickets on focus
  useFocusEffect(
    useCallback(() => {
      if (user && user.id) {
        loadTickets();
      }
    }, [user]),
  );

  // Format time since last refresh
  const formatTimeSinceRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastRefresh) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
  };

  // Render ticket card
  const renderTicketCard = (ticket) => (
    <TouchableOpacity
      key={ticket.id}
      style={[
        styles.ticketCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary,
          borderLeftWidth: 4,
          borderLeftColor: getStatusColor(
            normalizeStatusForUser(ticket.status),
          ),
        },
      ]}
      onPress={() => handleViewTicket(ticket)}
      activeOpacity={0.7}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketIdContainer}>
          <Text style={[styles.ticketNumber, { color: colors.primary }]}>
            #{ticket.ticketNumber}
          </Text>
          {ticket.source === "local" && (
            <View
              style={[
                styles.localBadge,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <Text style={[styles.localBadgeText, { color: colors.warning }]}>
                LOCAL
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(
                normalizeStatusForUser(ticket.status),
              ),
            },
          ]}
        >
          <Text style={styles.statusText}>
            {formatStatusText(normalizeStatusForUser(ticket.status))}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.subjectText, { color: colors.text }]}
        numberOfLines={2}
      >
        {ticket.subject}
      </Text>

      <View
        style={[styles.ticketFooter, { borderTopColor: colors.border + "30" }]}
      >
        <View style={styles.footerLeft}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar" size={12} color={colors.textLight} />
            <Text style={[styles.dateText, { color: colors.textLight }]}>
              {ticket.formattedDate} • {ticket.formattedTime}
            </Text>
          </View>
          {ticket.category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: colors.primary + "10" },
              ]}
            >
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {ticket.category}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footerRight}>
          {ticket.responseCount > 0 && (
            <View style={styles.responseContainer}>
              <Ionicons name="chatbubble" size={12} color={colors.textLight} />
              <Text style={[styles.responseText, { color: colors.textLight }]}>
                {ticket.responseCount}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state with refresh button
  const renderEmptyState = () => (
    <View
      style={[
        styles.emptyContainer,
        { backgroundColor: colors.surface },
      ]}
    >
      {/* Sad face emoji */}
      <Text style={styles.sadEmoji}>🧾</Text>
      
      <Text style={[styles.emptyText, { color: colors.text }]}>
        No tickets found
      </Text>
      <Text
        style={[styles.emptySubtext, { color: colors.textLight }]}
      >
        {statusFilter !== "all"
          ? `No ${formatStatusText(statusFilter).toLowerCase()} tickets`
          : "You don't have any support tickets yet"}
      </Text>
      
      {/* Refresh Button */}
      <TouchableOpacity
        style={[
          styles.refreshButton,
          { backgroundColor: colors.primary },
        ]}
        onPress={handleManualRefresh}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={20} color={colors.white} />
        <Text style={[styles.refreshButtonText, { color: colors.white }]}>
          Refresh Tickets
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent={true}
        />

        {/* Header Section - Same as Profile */}
        <View
          style={[styles.profileHeader, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.headerTitle, { color: colors.white }]}>
            Support Tickets
          </Text>
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title="Pull to refresh"
              titleColor={colors.textLight}
            />
          }
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
        >
          {/* Tickets List */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                My Tickets
                {statusFilter !== "all" &&
                  ` (${formatStatusText(statusFilter)})`}
              </Text>

              <View style={styles.headerRight}>
                <Text style={[styles.ticketCount, { color: colors.primary }]}>
                  {filteredTickets.length} tickets
                </Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textLight }]}>
                  Loading tickets...
                </Text>
              </View>
            ) : filteredTickets.length === 0 ? (
              renderEmptyState()
            ) : (
              filteredTickets.map(renderTicketCard)
            )}
          </View>
        </Animated.ScrollView>

        {/* Ticket Detail Modal */}
        <Modal
          visible={!!selectedTicket}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <SafeAreaView
            style={[
              styles.modalOverlay,
              { backgroundColor: colors.modalOverlay },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text style={styles.modalTitle}>Ticket Details</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedTicket(null)}
                >
                  <Ionicons name="close" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {/* Ticket ID */}
                <Text style={[styles.modalLabel, { color: colors.textLight }]}>
                  TICKET NUMBER
                </Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>
                  #{selectedTicket?.ticketNumber}
                </Text>

                {/* Status */}
                <View style={styles.modalStatusRow}>
                  <View style={styles.modalStatusColumn}>
                    <Text
                      style={[styles.modalLabel, { color: colors.textLight }]}
                    >
                      STATUS
                    </Text>
                    <View
                      style={[
                        styles.modalStatusBadge,
                        {
                          backgroundColor: getStatusColor(
                            selectedTicket?.status,
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.modalStatusText}>
                        {formatStatusText(selectedTicket?.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Source Badge */}
                {selectedTicket?.source === "local" && (
                  <View style={styles.sourceInfo}>
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={colors.warning}
                    />
                    <Text
                      style={[styles.sourceText, { color: colors.warning }]}
                    >
                      This ticket is stored locally and may not be synced with
                      the server
                    </Text>
                  </View>
                )}

                {/* Subject */}
                <Text style={[styles.modalLabel, { color: colors.textLight }]}>
                  SUBJECT
                </Text>
                <Text style={[styles.modalSubject, { color: colors.text }]}>
                  {selectedTicket?.subject}
                </Text>

                {/* Subscription Info */}
                {selectedTicket?.subscription_id && (
                  <>
                    <Text
                      style={[styles.modalLabel, { color: colors.textLight }]}
                    >
                      SUBSCRIPTION
                    </Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>
                      ID: {selectedTicket.subscription_id}
                      {selectedTicket.subscription_name &&
                        ` • ${selectedTicket.subscription_name}`}
                    </Text>
                  </>
                )}

                {/* Images/Attachments - FIXED: This should now display properly */}
                {selectedTicket?.attachments &&
                  selectedTicket.attachments.length > 0 &&
                  renderTicketImages(selectedTicket.attachments)}

                {/* Date Information */}
                <Text style={[styles.modalLabel, { color: colors.textLight }]}>
                  CREATED ON
                </Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>
                  {selectedTicket?.createdAt
                    ? selectedTicket.createdAt.toLocaleString()
                    : "Date not available"}
                </Text>

                {/* Response Count */}
                {selectedTicket?.responseCount > 0 && (
                  <>
                    <Text
                      style={[styles.modalLabel, { color: colors.textLight }]}
                    >
                      RESPONSES
                    </Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>
                      {selectedTicket.responseCount} response
                      {selectedTicket.responseCount !== 1 ? "s" : ""}
                    </Text>
                  </>
                )}

                {/* Assigned To */}
                {selectedTicket?.assignedTo && (
                  <>
                    <Text
                      style={[styles.modalLabel, { color: colors.textLight }]}
                    >
                      ASSIGNED TO
                    </Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>
                      {selectedTicket.assignedTo}
                    </Text>
                  </>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Full Screen Image Modal */}
        <Modal
          visible={imageModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={[styles.fullImageModal, { backgroundColor: "#000" }]}>
            <SafeAreaView style={styles.fullImageSafeArea}>
              <View style={styles.fullImageHeader}>
                <TouchableOpacity
                  style={[
                    styles.fullImageCloseButton,
                    { backgroundColor: colors.imageOverlay },
                  ]}
                  onPress={() => setImageModalVisible(false)}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              {viewingImage && (
                <Image
                  source={{ uri: viewingImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                  onError={(e) => {
                    Alert.alert("Error", "Failed to load image");
                  }}
                />
              )}

              <View style={styles.fullImageFooter}>
                <Text style={styles.fullImageInfo}>
                  Pinch to zoom • Swipe to close
                </Text>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Consistent Header with Profile Screen
  profileHeader: {
    paddingTop: 45,
    paddingBottom: 25,
    paddingHorizontal: 24,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  ticketCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  ticketCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  ticketIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  ticketNumber: {
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "monospace",
  },
  localBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  localBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 22,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 11,
    marginLeft: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "500",
  },
  responseContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  responseText: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  sadEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
    maxHeight: "90%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScroll: {
    padding: 20,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalStatusRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 5,
  },
  modalStatusColumn: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 11,
    marginTop: 16,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modalValue: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  modalSubject: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 24,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  modalStatusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  sourceInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FFA72620",
    marginVertical: 10,
  },
  sourceText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  imagesContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  imagesLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  imagesScroll: {
    flexDirection: "row",
  },
  imageThumbnailContainer: {
    position: "relative",
    marginRight: 10,
  },
  imageThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fullImageModal: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullImageSafeArea: {
    flex: 1,
  },
  fullImageHeader: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  fullImageCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: "100%",
  },
  fullImageFooter: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fullImageInfo: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
  },
});

export default Ticket;