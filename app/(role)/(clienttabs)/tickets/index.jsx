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
    if (!status) return "submitted";

    const s = status.toString().toLowerCase().trim();

    // SUBMITTED GROUP
    if (s === "submitted" || s === "for-approval" || s === "for approval") {
      return "submitted";
    }

    // IN PROGRESS GROUP
    if (s === "in progress" || s === "in_progress" || s === "processing") {
      return "in_progress";
    }

    // RESOLVED GROUP
    if (s === "resolved" || s === "close" || s === "closed" || s === "done") {
      return "resolved";
    }

    // FALLBACK
    return "submitted";
  };

  const normalizeImageUrl = (uri) => {
    if (!uri) return null;

    // Remove quotes if present
    uri = uri.toString().replace(/['"]/g, "");

    // Already absolute URL
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return uri;
    }

    // Try different base paths
    const basePaths = [
      "uploads/",
      "storage/",
      "public/",
      "images/",
      "causes/",
      "",
    ];

    const cleanUri = uri.startsWith("/") ? uri.slice(1) : uri;

    if (user?.branch?.subdomain) {
      // Try multiple URL patterns
      const possibleUrls = [
        `https://${user.branch.subdomain}.kazibufastnet.com/storage/${cleanUri}`,
        `https://${user.branch.subdomain}.kazibufastnet.com/uploads/${cleanUri}`,
        `https://${user.branch.subdomain}.kazibufastnet.com/public/${cleanUri}`,
        `https://${user.branch.subdomain}.kazibufastnet.com/${cleanUri}`,
        // Try without the "causes/" prefix if already in URI
        cleanUri.startsWith("causes/")
          ? `https://${user.branch.subdomain}.kazibufastnet.com/${cleanUri.replace("causes/", "")}`
          : null,
      ].filter(Boolean);

      // Return the first one (we'll handle testing in the component)
      return possibleUrls[0];
    }

    return `https://staging.kazibufastnet.com/${cleanUri}`;
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

      // Check if user has subdomain
      if (!user?.branch?.subdomain) {
        Alert.alert("Error", "Subdomain not found");
        console.log("User object:", user);
        return null;
      }

      const subdomain = user.branch.subdomain;

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

      // ============ TRY DIFFERENT ENDPOINT PATTERNS ============
      const possibleEndpoints = [
        // App-specific endpoints (most likely)
        `https://${subdomain}.kazibufastnet.com/api/app/tickets/${idToSend}`,
        `https://${subdomain}.kazibufastnet.com/api/app/tickets/view/${idToSend}`,
        `https://${subdomain}.kazibufastnet.com/api/app/tickets/show/${idToSend}`,

        // Generic endpoints
        `https://${subdomain}.kazibufastnet.com/api/tickets/${idToSend}`,
        `https://${subdomain}.kazibufastnet.com/api/tickets/view/${idToSend}`,
        `https://${subdomain}.kazibufastnet.com/api/tickets/show/${idToSend}`,

        // User-specific endpoints
        `https://${subdomain}.kazibufastnet.com/api/user/tickets/${idToSend}`,
      ];

      console.log("🔍 Trying to view ticket with ID:", idToSend);
      console.log("Available endpoints to try:", possibleEndpoints);

      let ticketData = null;
      let successfulEndpoint = "";
      let lastError = null;

      // Try each endpoint until one works
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);

          const response = await axios.get(endpoint, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          });

          console.log(`✅ ${endpoint} - Status:`, response.status);
          console.log("Response data:", response.data);

          if (response.data) {
            // Check different response structures
            if (response.data.ticket) {
              ticketData = response.data.ticket;
              successfulEndpoint = endpoint;
              break;
            } else if (response.data.data) {
              ticketData = response.data.data;
              successfulEndpoint = endpoint;
              break;
            } else if (response.data.id || response.data.ticket_number) {
              ticketData = response.data;
              successfulEndpoint = endpoint;
              break;
            } else if (response.data.success && response.data.ticket) {
              ticketData = response.data.ticket;
              successfulEndpoint = endpoint;
              break;
            } else if (response.data.success && response.data.data) {
              ticketData = response.data.data;
              successfulEndpoint = endpoint;
              break;
            }
          }
        } catch (endpointError) {
          lastError = endpointError;
          console.log(`❌ ${endpoint} failed:`, endpointError.message);
          if (endpointError.response) {
            console.log("Response status:", endpointError.response.status);
            console.log("Response data:", endpointError.response.data);
          }
          continue; // Try next endpoint
        }
      }

      if (!ticketData) {
        console.log("❌ All endpoints failed. Last error:", lastError?.message);
        throw new Error(
          `Ticket not found. Please check the ticket ID: ${idToSend}`,
        );
      }

      console.log(`✅ Using endpoint: ${successfulEndpoint}`);
      console.log("Ticket data found:", ticketData);

      // Format the ticket data
      const createdAt = ticketData.created_at
        ? new Date(ticketData.created_at)
        : ticketData.createdAt
          ? new Date(ticketData.createdAt)
          : ticketData.created_date
            ? new Date(ticketData.created_date)
            : new Date();

      const updatedAt = ticketData.updated_at
        ? new Date(ticketData.updated_at)
        : ticketData.updatedAt
          ? new Date(ticketData.updatedAt)
          : ticketData.updated_date
            ? new Date(ticketData.updated_date)
            : createdAt;

      // Extract subscription data
      let subscriptionData = null;
      let subscriptionId = null;
      let subscriptionName = "Unknown";

      if (ticketData.subscription) {
        subscriptionData = ticketData.subscription;
        subscriptionId =
          ticketData.subscription.subscription_id || ticketData.subscription.id;
        subscriptionName =
          ticketData.subscription.plan?.name ||
          ticketData.subscription.name ||
          "Unknown";
      } else if (ticketData.subscription_id) {
        if (typeof ticketData.subscription_id === "object") {
          subscriptionData = ticketData.subscription_id;
          subscriptionId =
            ticketData.subscription_id.subscription_id ||
            ticketData.subscription_id.id;
          subscriptionName =
            ticketData.subscription_id.plan?.name ||
            ticketData.subscription_id.name ||
            "Unknown";
        } else {
          subscriptionId = ticketData.subscription_id;
        }
      }

      // Format ticket number properly
      const formattedTicketNumber = (ticketNumber, id) => {
        if (ticketNumber) return ticketNumber;

        if (id) {
          return `TKT-${id.toString().padStart(6, "0")}`;
        }

        return "TKT-UNKNOWN";
      };

      const formattedTicket = {
        id: ticketData.id, // This is the actual backend database ID
        backendId: ticketData.id, // Store it here too
        ticketNumber: formattedTicketNumber(
          ticketData.ticket_number,
          ticketData.id,
        ),
        subject: ticketData.subject || ticketData.title || "No Subject",
        description:
          ticketData.description ||
          ticketData.message ||
          ticketData.content ||
          "",
        status: (ticketData.status || "submitted").toLowerCase().trim(),
        priority: (
          ticketData.priority_level ||
          ticketData.priority ||
          "medium"
        ).toLowerCase(),
        category: ticketData.type || ticketData.category || "General",
        createdAt: createdAt,
        updatedAt: updatedAt,
        attachments: [
          ...(ticketData.picture
            ? ticketData.picture
                .toString()
                .split(",")
                .map((p) => p.trim())
            : []),

          ...(ticketData.picture_reading
            ? ticketData.picture_reading
                .toString()
                .split(",")
                .map((p) => p.trim())
            : []),

          ...(Array.isArray(ticketData.attachments)
            ? ticketData.attachments
            : []),

          ...(Array.isArray(ticketData.images) ? ticketData.images : []),

          ...(Array.isArray(ticketData.files) ? ticketData.files : []),
        ],

        assignedTo:
          ticketData.team_id ||
          ticketData.assigned_to ||
          ticketData.assigned_agent ||
          ticketData.assigned_to_id ||
          null,
        lastResponse: ticketData.last_response || null,
        responseCount: ticketData.response_count || ticketData.replies || 0,
        formattedDate: createdAt.toLocaleDateString(),
        formattedTime: createdAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: "api",
        subscription_id: subscriptionId,
        subscription_name: subscriptionName,
        rawApiResponse: ticketData, // Store raw data for debugging
      };

      console.log("✅ Formatted ticket:", formattedTicket);
      return formattedTicket;
    } catch (error) {
      console.log("❌ View ticket error:", error.message);
      console.log("Error details:", error);

      if (error.response) {
        console.log("Error status:", error.response.status);
        console.log("Error data:", error.response.data);

        if (error.response.status === 404) {
          console.log(
            "⚠️ Ticket not found in backend, trying local storage...",
          );
        }
      }

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
              console.log("✅ Using fallback local ticket");
              return foundTicket;
            }
          }
        } catch (storageError) {
          console.log("Storage error:", storageError);
        }
      }

      Alert.alert(
        "Error",
        `Failed to load ticket: ${error.message || "Unknown error"}`,
      );

      return null;
    }
  };
  // ==================== FETCH TICKETS FROM API ====================
  const fetchTicketsFromAPI = async () => {
    try {
      const token = await getToken();

      if (!token) {
        console.log("❌ No token found for API fetch");
        return [];
      }

      // Check if user has subdomain
      if (!user?.branch?.subdomain) {
        console.log("❌ No subdomain found in user:", user);
        return [];
      }

      const subdomain = user.branch.subdomain;

      // TRY DIFFERENT ENDPOINTS
      const possibleEndpoints = [
        `https://${subdomain}.kazibufastnet.com/api/app/tickets`,
      ];

      console.log("🔍 Testing ticket API endpoints...");
      console.log("User ID:", user?.id);
      console.log("Subdomain:", subdomain);
      console.log("Token exists:", !!token);
      console.log("Token first 10 chars:", token.substring(0, 10) + "...");

      let ticketsData = [];
      let successfulEndpoint = "";

      // Try each endpoint until one works
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);

          const response = await axios.get(endpoint, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
            params: {
              user_id: user?.id, // Some APIs need user_id parameter
            },
          });

          console.log(`✅ ${endpoint} - Status:`, response.status);
          console.log("Full response:", response.data);

          if (response.data) {
            // Handle different response structures
            if (Array.isArray(response.data.data)) {
              ticketsData = response.data.data;
              successfulEndpoint = endpoint;
              break;
            } else if (
              response.data.data &&
              Array.isArray(response.data.data.tickets)
            ) {
              ticketsData = response.data.data.tickets;
              successfulEndpoint = endpoint;
              break;
            } else if (
              response.data.tickets &&
              Array.isArray(response.data.tickets)
            ) {
              ticketsData = response.data.tickets;
              successfulEndpoint = endpoint;
              break;
            } else if (Array.isArray(response.data)) {
              ticketsData = response.data;
              successfulEndpoint = endpoint;
              break;
            } else if (
              response.data.success &&
              Array.isArray(response.data.data)
            ) {
              ticketsData = response.data.data;
              successfulEndpoint = endpoint;
              break;
            }
          }
        } catch (endpointError) {
          console.log(`❌ ${endpoint} failed:`, endpointError.message);
          if (endpointError.response) {
            console.log("Response status:", endpointError.response.status);
            console.log("Response data:", endpointError.response.data);
          }
          continue; // Try next endpoint
        }
      }

      if (!successfulEndpoint) {
        console.log("❌ All endpoints failed");
        return [];
      }

      console.log(`✅ Using endpoint: ${successfulEndpoint}`);
      console.log("Found tickets data:", ticketsData);
      console.log("Number of tickets:", ticketsData.length);

      // Process API tickets
      const apiTickets = ticketsData.map((ticket, index) => {
        // The actual database ID from backend
        const backendId = ticket.id || ticket.ticket_id;

        // Use the backendId as the primary ID
        const ticketId = backendId || `API-${Date.now()}-${index}`;

        const status = ticket.status
          ? ticket.status.toLowerCase().trim()
          : "unknown";

        let createdAt = new Date();
        if (ticket.created_at) {
          createdAt = new Date(ticket.created_at);
        } else if (ticket.createdAt) {
          createdAt = new Date(ticket.createdAt);
        } else if (ticket.created_date) {
          createdAt = new Date(ticket.created_date);
        }

        return {
          id: ticketId,
          backendId: backendId,
          ticketNumber: ticket.ticket_number || ticket.ticketNumber || ticketId,
          subject: ticket.subject || ticket.title || "No Subject",
          status: status,
          priority: (ticket.priority || "medium").toLowerCase(),
          category: ticket.category || ticket.type || "General",
          createdAt: createdAt,
          updatedAt: ticket.updated_at
            ? new Date(ticket.updated_at)
            : ticket.updatedAt
              ? new Date(ticket.updatedAt)
              : createdAt,
          attachments:
            ticket.attachments || ticket.images || ticket.pictures || [],
          assignedTo:
            ticket.assigned_to ||
            ticket.assigned_agent ||
            ticket.assigned_to_id ||
            null,
          lastResponse: ticket.last_response || null,
          responseCount: ticket.response_count || ticket.replies || 0,
          formattedDate: createdAt.toLocaleDateString(),
          formattedTime: createdAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          source: "api",
          subscription_id:
            ticket.subscription?.subscription_id || ticket.subscription_id,
          subscription_name:
            ticket.subscription_name || ticket.subscription?.name,
        };
      });

      console.log("✅ Processed API tickets:", apiTickets.length);
      return apiTickets;
    } catch (error) {
      console.log("❌ Fetch tickets error:", error.message);
      if (error.response) {
        console.log("Error status:", error.response.status);
        console.log("Error data:", error.response.data);
      }
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
  // DEBUG: Log ticket data
  useEffect(() => {
    if (selectedTicket) {
      console.log("Selected Ticket Attachments:", selectedTicket.attachments);
      console.log("User Subdomain:", user?.branch?.subdomain);
    }
  }, [selectedTicket]);

  // ==================== RENDER TICKET IMAGES ====================
  const renderTicketImages = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    // ✅ EXPAND comma-separated images into real arrays
    const expandedAttachments = attachments.flatMap((attachment) => {
      if (!attachment) return [];

      // Case: "img1.jpg,img2.jpg"
      if (typeof attachment === "string" && attachment.includes(",")) {
        return attachment.split(",").map((p) => p.trim());
      }

      return [attachment];
    });

    // ✅ Normalize every possible image shape
    const validAttachments = expandedAttachments
      .map((attachment) => {
        if (!attachment) return null;

        if (typeof attachment === "string") {
          return normalizeImageUrl(attachment);
        }

        if (attachment?.uri) return normalizeImageUrl(attachment.uri);
        if (attachment?.url) return normalizeImageUrl(attachment.url);
        if (attachment?.path) return normalizeImageUrl(attachment.path);

        return null;
      })
      .filter(Boolean)
      .slice(0, 2); // 🔒 LIMIT TO 2 IMAGES ONLY

    console.log("FINAL IMAGE LIST:", validAttachments);

    if (validAttachments.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        <Text style={[styles.imagesLabel, { color: colors.textLight }]}>
          Attached Images ({validAttachments.length})
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {validAttachments.map((imageUri, index) => (
            <TouchableOpacity
              key={`ticket-image-${index}`}
              style={styles.imageThumbnailContainer}
              activeOpacity={0.85}
              onPress={() => {
                setViewingImage(imageUri);
                setImageModalVisible(true);
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.imageThumbnail}
                resizeMode="cover"
                onError={(e) =>
                  console.log("❌ Image load failed:", imageUri, e.nativeEvent)
                }
              />
            </TouchableOpacity>
          ))}
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
    <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
      {/* Sad face emoji */}
      <Text style={styles.sadEmoji}>🎟️</Text>

      <Text style={[styles.emptyText, { color: colors.text }]}>
        No tickets found
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
        {statusFilter !== "all"
          ? `No ${formatStatusText(statusFilter).toLowerCase()} tickets`
          : "You don't have any support tickets yet"}
      </Text>

      {/* Refresh Button */}
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: colors.primary }]}
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

                {/* Subject */}
                <Text style={[styles.modalLabel, { color: colors.textLight }]}>
                  SUBJECT
                </Text>
                <Text style={[styles.modalSubject, { color: colors.text }]}>
                  {selectedTicket?.subject}
                </Text>

                {/* DESCRIPTION - Add this if not showing */}
                {selectedTicket?.description && (
                  <>
                    <Text
                      style={[styles.modalLabel, { color: colors.textLight }]}
                    >
                      DESCRIPTION
                    </Text>
                    <Text
                      style={[styles.modalDescription, { color: colors.text }]}
                    >
                      {selectedTicket.description}
                    </Text>
                  </>
                )}

                {/* READINGS SECTION - Add this */}
                {selectedTicket?.readings && (
                  <>
                    <Text
                      style={[styles.modalLabel, { color: colors.textLight }]}
                    >
                      METER READINGS
                    </Text>
                    <View
                      style={[
                        styles.readingsContainer,
                        { backgroundColor: colors.surface + "80" },
                      ]}
                    >
                      {typeof selectedTicket.readings === "string" ? (
                        <Text
                          style={[styles.readingText, { color: colors.text }]}
                        >
                          {selectedTicket.readings}
                        </Text>
                      ) : Array.isArray(selectedTicket.readings) ? (
                        selectedTicket.readings.map((reading, index) => (
                          <View key={index} style={styles.readingItem}>
                            <Text
                              style={[
                                styles.readingLabel,
                                { color: colors.textLight },
                              ]}
                            >
                              Reading {index + 1}:
                            </Text>
                            <Text
                              style={[
                                styles.readingValue,
                                { color: colors.text },
                              ]}
                            >
                              {typeof reading === "object"
                                ? JSON.stringify(reading)
                                : reading}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text
                          style={[styles.readingText, { color: colors.text }]}
                        >
                          {JSON.stringify(selectedTicket.readings)}
                        </Text>
                      )}
                    </View>
                  </>
                )}

                {/* Alternative: Check for meter_readings property */}
                {!selectedTicket?.readings &&
                  selectedTicket?.meter_readings && (
                    <>
                      <Text
                        style={[styles.modalLabel, { color: colors.textLight }]}
                      >
                        METER READINGS
                      </Text>
                      <View
                        style={[
                          styles.readingsContainer,
                          { backgroundColor: colors.surface + "80" },
                        ]}
                      >
                        <Text
                          style={[styles.readingText, { color: colors.text }]}
                        >
                          {selectedTicket.meter_readings}
                        </Text>
                      </View>
                    </>
                  )}

                {/* Alternative: Check raw API response for readings */}
                {!selectedTicket?.readings &&
                  !selectedTicket?.meter_readings &&
                  selectedTicket?.rawApiResponse?.readings && (
                    <>
                      <Text
                        style={[styles.modalLabel, { color: colors.textLight }]}
                      >
                        METER READINGS
                      </Text>
                      <View
                        style={[
                          styles.readingsContainer,
                          { backgroundColor: colors.surface + "80" },
                        ]}
                      >
                        <Text
                          style={[styles.readingText, { color: colors.text }]}
                        >
                          {selectedTicket.rawApiResponse.readings}
                        </Text>
                      </View>
                    </>
                  )}

                {/* Images/Attachments */}
                {selectedTicket?.attachments &&
                  selectedTicket.attachments.length > 0 &&
                  renderTicketImages(selectedTicket.attachments)}

                {/* Date Information */}
                <Text style={[styles.modalLabel, { color: colors.textLight }]}>
                  SUBMITTED ON
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
                  onError={() => {
                    Alert.alert("Error", "Failed to load image");
                  }}
                />
              )}
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
  readingsContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  readingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  readingLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  readingValue: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  readingText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default Ticket;
