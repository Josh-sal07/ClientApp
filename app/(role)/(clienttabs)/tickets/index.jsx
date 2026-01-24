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
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
  Animated,
  Alert,
  Image,
  Dimensions,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Overlay from "../../../../components/overlay";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../theme/ThemeContext";
import { useColorScheme } from "react-native";
import { useUserStore } from "../../../../store/user";
import axios from "axios";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const API_BASE_URL = "https://staging.kazibufastnet.com/api/app";

// Helper function for user-specific keys - MUST MATCH CHATBOT
const getUserTicketsKey = (userId) => `kazi_support_tickets_${userId}`;

const Ticket = () => {
  const user = useUserStore((state) => state.user);
  const { mode, theme } = useTheme();
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
      ticketInProgress: "#007AFF",
      ticketResolved: "#5856D6",
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
      surface: "#1E1E1E",
      background: "#121212",
      text: "#FFFFFF",
      textLight: "#B0B0B0",
      ticketSubmitted: "#1f6f68",
      ticketClosed: "#666",
      ticketPending: "#FF9500",
      ticketInProgress: "#007AFF",
      ticketResolved: "#5856D6",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [ticketStats, setTicketStats] = useState({
    resolved: 0,
    closed: 0,
    in_progress: 0,
    submitted: 0,
  });

  const scrollY = useRef(new Animated.Value(0)).current;

  // Status options for filtering
  const statusOptions = [
    { label: "Submitted", value: "submitted", icon: "document-text" },
    { label: "In Progress", value: "in_progress", icon: "sync" },
    { label: "Resolved", value: "resolved", icon: "checkmark-circle" },
    { label: "Closed", value: "closed", icon: "close-circle" },
  ];

  // ==================== VIEW SINGLE TICKET ====================
  const viewTicket = async (ticketId) => {
    try {
      if (!ticketId) {
        Alert.alert("Error", "Ticket ID is required");
        return null;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Authentication required");
        return null;
      }

      // Try to fetch from API first
      try {
        const response = await axios.get(`${API_BASE_URL}/tickets/view/${ticketId}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.success) {
          const ticketData = response.data.data;
          
          // Format the ticket data similar to loadTickets
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

          const formattedTicket = {
            id: ticketData.id || ticketId,
            ticketNumber: ticketData.ticket_number || ticketData.id || ticketId,
            subject: ticketData.subject || ticketData.title || "No Subject",
            description: ticketData.description || ticketData.message || "No description provided",
            status: (ticketData.status || "submitted").toLowerCase().trim(),
            priority: (ticketData.priority || "medium").toLowerCase(),
            category: ticketData.category || ticketData.type || "General",
            createdAt: createdAt,
            updatedAt: updatedAt,
            attachments: ticketData.attachments || ticketData.images || [],
            assignedTo: ticketData.assigned_to || ticketData.assigned_agent || null,
            lastResponse: ticketData.last_response || null,
            responseCount: ticketData.response_count || ticketData.replies || 0,
            formattedDate: createdAt.toLocaleDateString(),
            formattedTime: createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            source: "api",
            subscription_id: ticketData.subscription_id,
            subscription_name: ticketData.subscription_name,
          };

       
          return formattedTicket;
        }
      } catch (apiError) {
        
        
        // If API fails, try to find in local storage
        const userTicketsKey = getUserTicketsKey(user.id);
        const storedTickets = await AsyncStorage.getItem(userTicketsKey);
        
        if (storedTickets) {
          const localTickets = JSON.parse(storedTickets);
          const foundTicket = localTickets.find(t => 
            t.id === ticketId || t.ticketNumber === ticketId
          );
          
          if (foundTicket) {
            return foundTicket;
          }
        }
      }

      // If not found anywhere
      Alert.alert("Not Found", "Ticket not found or you don't have permission to view it.");
      return null;

    } catch (error) {
      Alert.alert("Error", "Failed to load ticket details.");
      return null;
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

      // 1. First, try to load from API
      try {
        const response = await axios.get(`${API_BASE_URL}/tickets`, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 8000,
        });

        if (response.data && response.data.success) {
          

          let ticketsData = [];

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

          // Process API tickets
          const apiTickets = ticketsData.map((ticket, index) => {
            const ticketId = ticket.id || `TKT-API-${Date.now()}-${index}`;
            
            // Fix: Extract status from ticket data
            const status = (ticket.status || "submitted").toLowerCase().trim();
            
            let createdAt = new Date();
            if (ticket.created_at) {
              createdAt = new Date(ticket.created_at);
            } else if (ticket.createdAt) {
              createdAt = new Date(ticket.createdAt);
            } else if (ticket.date_created) {
              createdAt = new Date(ticket.date_created);
            }

            const priority = (ticket.priority || "medium").toLowerCase();

            return {
              id: ticketId,
              ticketNumber: ticket.ticket_number || ticketId,
              subject: ticket.subject || ticket.title || "No Subject",
              description:
                ticket.description ||
                ticket.message ||
                "No description provided",
              status: status, // Fixed: using the extracted status
              priority: priority,
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
            };
          });

          allTickets = [...apiTickets];
         
        }
      } catch (apiError) {
       
      }

      // 2. Load from local storage (where chatbot saves)
      try {
        const userTicketsKey = getUserTicketsKey(user.id);
        const storedTickets = await AsyncStorage.getItem(userTicketsKey);

        if (storedTickets) {
          const localTickets = JSON.parse(storedTickets);

          // Process local tickets
          const processedLocalTickets = localTickets.map((ticket) => {
            // Convert date strings to Date objects
            const createdAt = ticket.createdAt 
              ? new Date(ticket.createdAt)
              : ticket.created_at 
                ? new Date(ticket.created_at)
                : new Date(Date.now());
                
            const updatedAt = ticket.updatedAt
              ? new Date(ticket.updatedAt)
              : ticket.updated_at
                ? new Date(ticket.updated_at)
                : createdAt;

            const status = (ticket.status || "submitted").toLowerCase().trim();

            return {
              id: ticket.id || `TKT-LOCAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ticketNumber: ticket.ticketNumber || ticket.id || `TKT-${Date.now()}`,
              subject: ticket.subject || "No Subject",
              description: ticket.description || "No description provided",
              status: status,
              priority: (ticket.priority || "medium").toLowerCase(),
              category: ticket.category || "Technical Support",
              createdAt: createdAt,
              updatedAt: updatedAt,
              attachments: ticket.attachments || [],
              assignedTo: ticket.assignedTo || null,
              lastResponse: ticket.lastResponse || null,
              responseCount: ticket.responseCount || 0,
              formattedDate: createdAt.toLocaleDateString(),
              formattedTime: createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              source: "local",
              subscription_id: ticket.subscription_id,
              subscription_name: ticket.subscription_name,
            };
          });

          // Merge local tickets with API tickets, avoiding duplicates by ticketNumber
          const existingTicketNumbers = new Set(allTickets.map(t => t.ticketNumber));
          const uniqueLocalTickets = processedLocalTickets.filter(
            t => !existingTicketNumbers.has(t.ticketNumber)
          );

          allTickets = [...allTickets, ...uniqueLocalTickets];
        }
      } catch (storageError) {
  
      }

      // Sort tickets by creation date (newest first)
      allTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTickets(allTickets);
      setFilteredTickets(allTickets);
      calculateStats(allTickets);
      setLastRefresh(new Date());

      if (allTickets.length === 0) {
      
      }
    } catch (error) {
      
      Alert.alert("Error", "Failed to load tickets. Please try again.");
      setTickets([]);
      setFilteredTickets([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER TICKET IMAGES ====================
  const renderTicketImages = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        <Text style={[styles.imagesLabel, { color: colors.textLight }]}>
          Attached Images:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesScroll}
        >
          {attachments.map((attachment, index) => {
            const imageUri = attachment.uri || attachment.url;
            if (!imageUri) return null;

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

  // ==================== CLEAR ALL TICKETS ====================
  const clearAllTickets = async () => {
    Alert.alert(
      "Clear All Tickets",
      "Are you sure you want to clear all your tickets? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              if (!user || !user.id) {
                Alert.alert(
                  "Error",
                  "You need to be logged in to clear tickets."
                );
                return;
              }

              // Clear local storage
              const userTicketsKey = getUserTicketsKey(user.id);
              await AsyncStorage.removeItem(userTicketsKey);

              // Clear state
              setTickets([]);
              setFilteredTickets([]);
              calculateStats([]);

              Alert.alert("Cleared", "All your tickets have been cleared.");
            } catch (error) {
             
              Alert.alert("Error", "Failed to clear tickets.");
            }
          },
        },
      ]
    );
  };

  // ==================== HELPER FUNCTIONS ====================

  // Calculate ticket statistics
  const calculateStats = (ticketsList) => {
    const stats = {
      resolved: ticketsList.filter((t) => t.status === "resolved").length,
      closed: ticketsList.filter((t) => t.status === "closed").length,
      in_progress: ticketsList.filter((t) => t.status === "in_progress").length,
      submitted: ticketsList.filter((t) => t.status === "submitted").length,
    };
    setTicketStats(stats);
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusMap = {
      pending: colors.ticketPending,
      in_progress: colors.ticketInProgress,
      resolved: colors.ticketResolved,
      closed: colors.ticketClosed,
      submitted: colors.ticketSubmitted,
      completed: colors.ticketCompleted,
    };
    return statusMap[status] || colors.primary;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const priorityMap = {
      low: colors.lowPriority,
      medium: colors.mediumPriority,
      high: colors.highPriority,
      critical: colors.criticalPriority,
    };
    return priorityMap[priority] || colors.mediumPriority;
  };

  // Format status text for display
  const formatStatusText = (status) => {
    const statusMap = {
      pending: "Pending",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
      submitted: "Submitted",
      completed: "Completed",
    };
    return statusMap[status] || String(status ?? "").replace(/_/g, " ").toUpperCase();

  };

  // Format priority text
  const formatPriorityText = (priority) => {
    return String(priority ?? "").charAt(0).toUpperCase() + String(priority ?? "").slice(1);

  };

  // Apply status filter
  const applyStatusFilter = (status) => {
    setStatusFilter(status);
    setShowStatusFilter(false);

    if (status === "all") {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter(
        (ticket) => ticket.status.toLowerCase() === status.toLowerCase()
      );
      setFilteredTickets(filtered);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTickets();
    setTimeout(() => setRefreshing(false), 1000);
  }, [user]);

  // Handle viewing a specific ticket
  const handleViewTicket = async (ticket) => {
    // First show the ticket from local data
    setSelectedTicket(ticket);
    
    // Then try to fetch latest details from API
    if (ticket.id) {
      const latestTicket = await viewTicket(ticket.id);
      if (latestTicket) {
        setSelectedTicket(latestTicket);
      }
    }
  };

  // Load tickets on focus
  useFocusEffect(
    useCallback(() => {
      if (user && user.id) {
        loadTickets();
      }
    }, [user])
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

  // Render status filter options
  const renderStatusFilter = () => {
    if (!showStatusFilter) return null;

    return (
      <View
        style={[
          styles.statusFilterContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.statusOption,
              statusFilter === option.value && styles.statusOptionSelected,
              statusFilter === option.value && {
                backgroundColor: colors.primary + "20",
              },
            ]}
            onPress={() => applyStatusFilter(option.value)}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={
                statusFilter === option.value
                  ? colors.primary
                  : colors.textLight
              }
            />
            <Text
              style={[
                styles.statusOptionText,
                {
                  color:
                    statusFilter === option.value
                      ? colors.primary
                      : colors.text,
                },
              ]}
            >
              {option.label}
            </Text>
            {option.value !== "all" && (
              <Text
                style={[styles.statusOptionCount, { color: colors.textLight }]}
              >
                {ticketStats[option.value] || 0}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
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
          borderLeftColor: getStatusColor(ticket.status),
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
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(ticket.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {formatStatusText(ticket.status)}
          </Text>
        </View>
      </View>
      
      {ticket.subscription_id && (
        <Text
          style={[styles.subjectText1, { color: colors.textLight }]}
          numberOfLines={1}
        >
          Subscription ID: {ticket.subscription_id}
        </Text>
      )}

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

  // Render skeleton loading cards
  const SkeletonTicket = () => (
    <View
      style={[
        styles.skeletonCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[styles.skeletonHeader, { backgroundColor: colors.skeleton }]}
      />
      <View
        style={[styles.skeletonLine, { backgroundColor: colors.skeleton }]}
      />
      <View
        style={[styles.skeletonFooter, { backgroundColor: colors.skeleton }]}
      />
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
      <Ionicons
        name={isSearching ? "search" : user ? "document-text" : "person-circle"}
        size={60}
        color={colors.gray}
      />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        {isSearching
          ? `No tickets found for "${searchQuery}"`
          : user
            ? "No tickets found"
            : "Please login to view tickets"}
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
        {isSearching
          ? "Try a different search term"
          : user
            ? "Create your first support ticket"
            : "Login to create and view tickets"}
      </Text>

      {isSearching && (
        <TouchableOpacity
          onPress={clearSearch}
          style={[styles.backButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.backButtonText}>Clear Search</Text>
        </TouchableOpacity>
      )}

      {!isSearching && user && (
        <TouchableOpacity
          onPress={onRefresh}
          style={[
            styles.refreshEmptyButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            },
          ]}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
          <Text
            style={[styles.refreshEmptyButtonText, { color: colors.primary }]}
          >
            Refresh
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
       
        <Overlay />

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
            { useNativeDriver: false }
          )}
        >
          <View style={styles.titleSection}>
            <Text style={[styles.mainTitle, { color: colors.text }]}>
              Kazibufast Network
            </Text>
            <Text style={[styles.subTitle, { color: colors.textLight }]}>
              Support Tickets
            </Text>
          </View>

          {/* Tickets List */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                My Tickets
                {statusFilter !== "all" &&
                  ` (${formatStatusText(statusFilter)})`}
              </Text>

              <View style={styles.headerRight}>
                {refreshing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.ticketCount, { color: colors.primary }]}>
                    {filteredTickets.length} shown
                  </Text>
                )}
              </View>
            </View>

            {loading || refreshing ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <SkeletonTicket key={i} />
                ))}
              </>
            ) : filteredTickets.length === 0 ? (
              renderEmptyState()
            ) : (
              filteredTickets.map(renderTicketCard)
            )}
          </View>

          {/* Last Updated Info */}
          {tickets.length > 0 && (
            <View
              style={[
                styles.infoMessage,
                {
                  backgroundColor: colors.surface,
                  borderLeftColor: colors.primary,
                },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.infoText, { color: colors.textLight }]}>
                Last updated {formatTimeSinceRefresh()}
              </Text>
            </View>
          )}

          {/* Clear All Button */}
          {user && user.id && tickets.length > 0 && (
            <TouchableOpacity
              onPress={clearAllTickets}
              style={[
                styles.clearAllButton,
                {
                  backgroundColor: colors.clearButton + "20",
                  borderColor: colors.clearButton,
                },
              ]}
            >
              <Text
                style={[
                  styles.clearAllButtonText,
                  { color: colors.clearButton },
                ]}
              >
                Clear All Tickets
              </Text>
            </TouchableOpacity>
          )}
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
                <Text
                  style={[styles.modalLabel, { color: colors.textLight }]}
                >
                  TICKET NUMBER
                </Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>
                  #{selectedTicket?.ticketNumber}
                </Text>

                {/* Status & Priority */}
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
                            selectedTicket?.status
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
                  <>
                  </>
                )}

                {/* Subject */}
                <Text
                  style={[styles.modalLabel, { color: colors.textLight }]}
                >
                  SUBJECT
                </Text>
                <Text style={[styles.modalSubject, { color: colors.text }]}>
                  {selectedTicket?.subject}
                </Text>

                {/* Description */}
                <Text
                  style={[styles.modalLabel, { color: colors.textLight }]}
                >
                  DESCRIPTION
                </Text>
                <Text
                  style={[styles.modalDescription, { color: colors.text }]}
                >
                  {selectedTicket?.description}
                </Text>

                {/* Subscription Info */}
                {selectedTicket?.subscription_id && (
                  <>
                    <Text
                      style={[styles.modalLabel, { color: colors.textLight }]}
                    >
                      SUBSCRIPTION ID/PLAN
                    </Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>
                      ID: {selectedTicket.subscription_id}
                      {selectedTicket.subscription_name && 
                        ` • ${selectedTicket.subscription_name}`}
                    </Text>
                  </>
                )}

                {/* Images/Attachments */}
                {selectedTicket?.attachments &&
                  selectedTicket.attachments.length > 0 &&
                  renderTicketImages(selectedTicket.attachments)}

                {/* Date Information */}
                <Text
                  style={[styles.modalLabel, { color: colors.textLight }]}
                >
                  CREATED ON
                </Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>
                  {selectedTicket?.createdAt.toLocaleString()}
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
          <SafeAreaView style={[styles.fullImageModal, { backgroundColor: '#000' }]}>
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
              />
            )}

            <View style={styles.fullImageFooter}>
              <Text style={styles.fullImageInfo}>
                Pinch to zoom • Swipe to close
              </Text>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 5,
  },
  statsContainer: {
    marginBottom: 20,
    paddingVertical: 5,
  },
  statCard: {
    width: 80,
    height: 80,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  searchFilterContainer: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusFilterContainer: {
    position: "absolute",
    top: 180,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 8,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusOptionSelected: {
    borderWidth: 1,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
    flex: 1,
  },
  statusOptionCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  searchInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  searchResultsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: "500",
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
  subjectText1: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 10,
    lineHeight: 22,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
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
    paddingVertical: 50,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  emptySubtext: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  refreshEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  refreshEmptyButtonText: {
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
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
  skeletonCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  skeletonHeader: {
    height: 14,
    width: "40%",
    borderRadius: 6,
    marginBottom: 12,
  },
  skeletonLine: {
    height: 16,
    width: "80%",
    borderRadius: 6,
    marginBottom: 10,
  },
  skeletonFooter: {
    height: 12,
    width: "30%",
    borderRadius: 6,
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
  modalPriorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  modalPriorityText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  localSourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  localSourceText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  clearAllButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: "600",
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