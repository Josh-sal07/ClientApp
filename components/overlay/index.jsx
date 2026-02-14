import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserStore } from "../../store/user";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeContext";
import { useColorScheme } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BUTTON_SIZE = 60;

// ==================== CRITICAL: MUST MATCH TICKETS SCREEN KEYS ====================
const getUserMessagesKey = (userId) => `kazi_chat_messages_${userId}`;
const getUserTicketsKey = (userId) => `kazi_support_tickets_${userId}`;

// Custom styles generator based on theme
const getStyles = (colors) => ({
  // Floating Button
  floatingButton: {
    position: "absolute",
    backgroundColor: colors.primary,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 9999,
  },
  unreadBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: colors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  unreadText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },

  // Modal Container
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 8,
  },

  // Chat Area
  chatContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Message Bubbles
  messageWrapper: {
    marginVertical: 4,
    maxWidth: "85%",
  },
  botMessageWrapper: {
    alignSelf: "flex-start",
  },
  userMessageWrapper: {
    alignSelf: "flex-end",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  botMessageBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
  },
  botMessageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  userMessageText: {
    fontSize: 15,
    color: colors.white,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
    alignSelf: "flex-end",
  },

  // Typing Indicator
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  typingDots: {
    flexDirection: "row",
    marginLeft: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 14,
    color: colors.textLight,
  },

  // Quick Replies
  quickRepliesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginLeft: 8,
  },
  quickReplyButton: {
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickReplyText: {
    color: colors.primary,
    fontSize: 14,
  },

  // Yes/No Buttons
  yesNoContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 8,
    marginLeft: 8,
  },
  yesButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  noButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  yesNoButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },

  // Contact Info Box
  contactInfoBox: {
    backgroundColor: colors.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  contactDetail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  contactNote: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: "italic",
    marginTop: 8,
  },

  // Suggestions
  suggestionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textLight,
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  suggestionButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
  },
  createTicketSuggestion: {
    backgroundColor: colors.danger + "10",
    borderColor: colors.danger,
    marginTop: 12,
  },
  createTicketText: {
    color: colors.danger,
    fontWeight: "600",
  },

  // Input Area
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    padding: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray,
  },

  // Ticket Modal
  ticketModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  ticketHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 12,
  },
  ticketSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
    marginBottom: 20,
  },
  ticketForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },

  // Subscription Dropdown Styles
  dropdownContainer: {
    position: "relative",
  },
  dropdownButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  dropdownButtonPlaceholder: {
    color: colors.textLight,
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "20",
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary + "20",
  },
  noSubscriptionsText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 16,
  },

  subjectInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    textAlignVertical: "top",
  },
  // Attachment in ticket form
  attachmentContainer: {
    marginTop: 16,
  },
  attachmentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  attachmentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  attachmentButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 12,
    fontWeight: "500",
  },
  selectedAttachment: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedAttachmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedAttachmentName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
  },
  removeAttachmentButton: {
    padding: 4,
  },
  submitTicketButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 32,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitTicketButtonDisabled: {
    backgroundColor: colors.gray,
  },
  submitTicketText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

const FloatingButton = ({
  unreadCount = 0,
  onPress,
  isVisible = true,
  colors,
  pan,
  panHandlers,
}) => {
  if (!isVisible) return null;

  return (
    <Animated.View
      {...panHandlers}
      style={[
        getStyles(colors).floatingButton,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color={colors.white} />

        {unreadCount > 0 && (
          <View style={getStyles(colors).unreadBadge}>
            <Text style={getStyles(colors).unreadText}>
              {Math.min(unreadCount, 9)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Helper function to extract address from subscription
const getSubscriptionAddress = (subscription) => {
  return (
    subscription.installation_address ||
    subscription.address ||
    subscription.install_address ||
    subscription.customer_address ||
    subscription.service_address ||
    subscription.location ||
    subscription.full_address ||
    "No address specified"
  );
};

// Format ticket number for display
const formatTicketNumber = (ticketNum, backendId) => {
  // If we have a proper ticket number (not just ID), use it
  if (ticketNum && ticketNum.toString() !== backendId.toString()) {
    // Ensure it has proper formatting
    if (!ticketNum.toString().includes('TKT-') && !ticketNum.toString().includes('#')) {
      return `TKT-${ticketNum}`;
    }
    return ticketNum.toString();
  }
  
  // Fallback to formatted backend ID
  return `TKT-${backendId}`;
};

// Main Chatbot Component
const ChatBot = () => {
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
      modalOverlay: "rgba(0,0,0,0.5)",
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
      modalOverlay: "rgba(0,0,0,0.7)",
    },
  };

  const colors = COLORS[effectiveMode === "dark" ? "dark" : "light"];
  const styles = getStyles(colors);

  const [modalVisible, setModalVisible] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const router = useRouter();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTicketPrompt, setShowTicketPrompt] = useState(false);
  const [conversationContext, setConversationContext] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showYesNoQuestion, setShowYesNoQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showRestartOptions, setShowRestartOptions] = useState(false);

  // TICKET FORM STATE
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketAttachments, setTicketAttachments] = useState([]);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showSubscriptionDropdown, setShowSubscriptionDropdown] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const EDGE_PADDING = 12;
  const MIN_Y = 80;
  const MAX_Y = SCREEN_HEIGHT - BUTTON_SIZE - 120;

  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - BUTTON_SIZE - 20,
      y: SCREEN_HEIGHT - 200,
    })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const middleX = SCREEN_WIDTH / 2;
        const snapX = pan.x._value + BUTTON_SIZE / 2 < middleX
          ? EDGE_PADDING
          : SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING;
        let snapY = pan.y._value;
        if (snapY < MIN_Y) snapY = MIN_Y;
        if (snapY > MAX_Y) snapY = MAX_Y;
        Animated.spring(pan, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: false,
          friction: 6,
        }).start();
      },
    })
  ).current;

  // Contact information
  const contactInfo = {
    phone: "+639505358971",
    phone2: "+639559844890",
    email: "kazibufast@gmail.com",
  };

  // Initial quick questions
  const initialQuestions = [
    "No internet connection",
    "Slow internet connection",
    "Can't access certain websites or apps",
    "How to change my Wi-Fi password?",
  ];

  // No internet connection follow-up questions
  const noInternetFollowUp = [
    "My router has a blinking red light",
    "My router has no red light, but I still don't have internet",
    "My router is not working at all",
    "My router is working, but I can't see the Wi-Fi name on the list",
  ];

  // Restart follow-up options
  const restartFollowUp = [
    "I've already restarted but still no internet connection",
    "I've restarted the modem and it works now",
  ];

  // Load subscriptions when ticket modal opens
  useEffect(() => {
    if (ticketModalVisible) {
      loadSubscriptions();
    } else {
      setSelectedSubscription(null);
    }
  }, [ticketModalVisible, user]);

  // Load messages when chat modal opens
  useEffect(() => {
    if (modalVisible) {
      loadMessages();
      setConversationContext(null);
      setShowContactInfo(false);
      setShowTicketPrompt(false);
      setShowYesNoQuestion(false);
      setShowRestartOptions(false);
    }
  }, [modalVisible, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (flatListRef.current && modalVisible) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [
    messages,
    isTyping,
    showContactInfo,
    showYesNoQuestion,
    showRestartOptions,
  ]);

  // Load subscriptions
  const loadSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "You need to be logged in.");
        setSubscriptions([]);
        return;
      }

      if (!user?.id) {
        Alert.alert("Error", "User information not found.");
        setSubscriptions([]);
        return;
      }

      // Check for subdomain
      if (!user?.branch?.subdomain) {
        Alert.alert("Error", "Subdomain not found. Please contact support.");
        setSubscriptions([]);
        return;
      }

      const subdomain = user.branch.subdomain;
      const API_URL = `https://${subdomain}.kazibufastnet.com/api/app/subscriptions`;
      console.log("Loading subscriptions from:", API_URL);

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load subscriptions: ${response.status}`);
      }

      const data = await response.json();
      console.log("Subscriptions response:", data);

      let subscriptions = [];

      // Parse subscriptions
      if (Array.isArray(data)) {
        subscriptions = data;
      } else if (data && typeof data === "object") {
        if (data.subscription) {
          if (Array.isArray(data.subscription)) {
            subscriptions = data.subscription;
          } else if (data.subscription.id) {
            subscriptions = [data.subscription];
          }
        } else if (data.data) {
          if (Array.isArray(data.data)) {
            subscriptions = data.data;
          } else if (data.data.subscription) {
            if (Array.isArray(data.data.subscription)) {
              subscriptions = data.data.subscription;
            } else {
              subscriptions = [data.data.subscription];
            }
          } else if (data.data.id && data.data.subscription_id) {
            subscriptions = [data.data];
          }
        } else if (data.id && data.subscription_id) {
          subscriptions = [data];
        }
      }

      // Format for dropdown
      const formattedSubscriptions = subscriptions.map((sub) => {
        let planName = "Unknown Plan";
        if (sub.plan && sub.plan.name) {
          planName = sub.plan.name;
        } else if (sub.plan_name) {
          planName = sub.plan_name;
        } else if (sub.plan?.plan?.name) {
          planName = sub.plan.plan.name;
        }

        return {
          id: sub.id || sub.subscription_id,
          plan: { name: planName },
          status: sub.status || "unknown",
          subscription_id: sub.subscription_id,
          originalData: sub,
        };
      });

      setSubscriptions(formattedSubscriptions);

      // Auto-select first subscription
      if (formattedSubscriptions.length === 1) {
        setSelectedSubscription(formattedSubscriptions[0]);
      } else if (formattedSubscriptions.length === 0) {
        Alert.alert(
          "No Subscriptions",
          "You don't have any active subscriptions.",
        );
      }
    } catch (error) {
      console.log("Load subscriptions error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to load subscriptions. Please try again.",
      );
      setSubscriptions([]);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  // Load messages
  const loadMessages = async () => {
    try {
      if (!user || !user.id) {
        setMessages([
          {
            id: "1",
            text: "Hi there! 👋 I'm Kazi Assistant. I'm here to help you with internet issues. How can I assist you today?",
            sender: "bot",
            timestamp: new Date(),
            type: "greeting",
          },
        ]);
        return;
      }

      const userMessagesKey = getUserMessagesKey(user.id);
      const storedMsgs = await AsyncStorage.getItem(userMessagesKey);

      if (storedMsgs) {
        const parsed = JSON.parse(storedMsgs);
        const messagesWithDates = parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } else {
        setMessages([
          {
            id: "1",
            text: "Hi there! 👋 I'm Kazi Assistant. I'm here to help you with internet issues. How can I assist you today?",
            sender: "bot",
            timestamp: new Date(),
            type: "greeting",
          },
        ]);
      }
    } catch (error) {
      console.log("Error loading messages:", error);
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      if (!user || !user.id) return;
      const userMessagesKey = getUserMessagesKey(user.id);
      await AsyncStorage.setItem(userMessagesKey, JSON.stringify(newMessages));
    } catch (error) {
      console.log("Error saving messages:", error);
    }
  };

  // Handle quick replies
  const handleQuickReply = async (question) => {
    const userMsg = {
      id: Date.now().toString(),
      text: question,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    let context = null;
    if (question === "No internet connection") context = "no_internet";
    else if (question === "Slow internet connection") context = "slow_internet";
    else if (question === "Can't access certain websites or apps")
      context = "cant_access_websites";
    else if (question === "How to change my Wi-Fi password?")
      context = "change_password";

    setConversationContext(context);

    setTimeout(() => {
      const botResponse = generateContextualResponse(context, question);
      const finalMessages = [...updatedMessages, botResponse];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setIsTyping(false);

      if (context === "cant_access_websites" || context === "change_password") {
        setShowContactInfo(true);
        setShowTicketPrompt(true);
      }
    }, 1500);
  };

  // Handle no internet follow-up
  const handleNoInternetFollowUp = async (response) => {
    const userMsg = {
      id: Date.now().toString(),
      text: response,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    setTimeout(() => {
      let botText = "";
      let showYesNo = false;

      if (response === "My router has a blinking red light") {
        botText = "Is there a blinking red light on your router?";
        setCurrentQuestion("red_light");
        showYesNo = true;
      } else if (response === "My router is not working at all") {
        botText = "Is your router powered on and showing any lights?";
        setCurrentQuestion("router_working");
        showYesNo = true;
      } else if (
        response ===
        "My router has no red light, but I still don't have internet"
      ) {
        botText =
          "Please try restarting your modem or router. Unplug both devices, wait 30 seconds, then plug them back in. Did restarting help?";
        setCurrentQuestion("no_internet");
        showYesNo = true;
      } else if (
        response ===
        "My router is working, but I can't see the Wi-Fi name on the list"
      ) {
        botText =
          "If your router is working but you can't see the Wi-Fi name, try moving closer to the router or restarting it. Can you see the Wi-Fi name now?";
        setCurrentQuestion("wifi_name_visible");
        showYesNo = true;
      }

      const botResponse = {
        id: Date.now().toString(),
        text: botText,
        sender: "bot",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botResponse];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setIsTyping(false);
      setShowYesNoQuestion(showYesNo);
    }, 1500);
  };

  // Handle yes/no response
  const handleYesNoResponse = async (response) => {
    const userMsg = {
      id: Date.now().toString(),
      text: response ? "Yes" : "No",
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);
    setShowYesNoQuestion(false);

    setTimeout(() => {
      let botText = "";

      if (currentQuestion === "red_light") {
        if (response) {
          botText =
            "A blinking red light indicates a connection issue with your service provider. Please contact our support team for immediate assistance.";
          setShowContactInfo(true);
          setShowTicketPrompt(true);
        } else {
          botText =
            "Please try these steps:\n\n1. Restart your modem (unplug for 30 seconds)\n2. Restart your router\n3. Check all cable connections\n\nDid restarting help?";
          setShowRestartOptions(true);
        }
      } else if (currentQuestion === "router_working") {
        if (response) {
          botText =
            "Since your router has power lights, the issue might be with your modem or service. Please try restarting both your modem and router.";
          setShowRestartOptions(true);
        } else {
          botText =
            "If your router has no lights, it may not be receiving power. Check the power connection and outlet. If it still doesn't work, please contact our support team.";
          setShowContactInfo(true);
          setShowTicketPrompt(true);
        }
      } else if (currentQuestion === "no_internet") {
        if (response) {
          botText =
            "Great! I'm glad restarting solved the issue. If you experience any more problems, don't hesitate to reach out. Have a great day! 😊";
          setConversationContext(null);
          setShowContactInfo(false);
          setShowTicketPrompt(false);
        } else {
          botText =
            "I understand. Since restarting didn't resolve the issue, there may be a service problem or equipment malfunction. Please contact our support team for further assistance.";
          setShowContactInfo(true);
          setShowTicketPrompt(true);
        }
      } else if (currentQuestion === "wifi_name_visible") {
        if (response) {
          botText =
            "Great! Moving closer solved the issue. If you experience any more problems, don't hesitate to reach out. Have a great day! 😊";
          setConversationContext(null);
          setShowContactInfo(false);
          setShowTicketPrompt(false);
        } else {
          botText =
            "Check if the WLAN/Wi-Fi light is on. If it's off, press and hold the WLAN button at the back of the router for 10 seconds. Did that fix the issue?";
          setCurrentQuestion("wlan_light_check");
          setShowYesNoQuestion(true);
        }
      } else if (currentQuestion === "wlan_light_check") {
        if (response) {
          botText =
            "Great! I'm glad that fixed the issue. If you experience any more problems, don't hesitate to reach out. Have a great day! 😊";
          setConversationContext(null);
          setShowContactInfo(false);
          setShowTicketPrompt(false);
        } else {
          botText =
            "I understand. Since you still can't see the Wi-Fi name, there may be an issue with your router's wireless functionality. Please contact our support team for further assistance.";
          setShowContactInfo(true);
          setShowTicketPrompt(true);
        }
      }

      const botResponse = {
        id: Date.now().toString(),
        text: botText,
        sender: "bot",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botResponse];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setIsTyping(false);
    }, 1500);
  };

  // Handle restart response
  const handleRestartResponse = async (response) => {
    const userMsg = {
      id: Date.now().toString(),
      text: response,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);
    setShowRestartOptions(false);

    setTimeout(() => {
      let botText = "";

      if (
        response === "I've already restarted but still no internet connection"
      ) {
        botText =
          "I understand. Since restarting didn't resolve the issue, there may be a service problem or equipment malfunction. Please contact our support team for further assistance.";
        setShowContactInfo(true);
        setShowTicketPrompt(true);
      } else if (response === "I've restarted the modem and it works now") {
        botText =
          "Great! I'm glad restarting solved the issue. If you experience any more problems, don't hesitate to reach out. Have a great day! 😊";
        setConversationContext(null);
        setShowContactInfo(false);
        setShowTicketPrompt(false);
      }

      const botResponse = {
        id: Date.now().toString(),
        text: botText,
        sender: "bot",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botResponse];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setIsTyping(false);
    }, 1500);
  };

  // Handle slow internet yes/no
  const handleSlowInternetYesNo = async (response) => {
    const userMsg = {
      id: Date.now().toString(),
      text: response
        ? "Yes, I've restarted but still slow"
        : "No, I haven't restarted yet",
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);
    setShowYesNoQuestion(false);
    setShowRestartOptions(false);
    setShowContactInfo(false);
    setShowTicketPrompt(false);

    setTimeout(() => {
      let botText = "";

      if (response) {
        botText =
          "I understand you've already restarted but are still experiencing slow speeds. This could be due to network congestion, equipment issues, or service problems. Please contact our support team for further investigation.";
        setShowContactInfo(true);
        setShowTicketPrompt(true);
        setConversationContext(null);
      } else {
        botText =
          "Please try restarting your modem and router first. Unplug both devices, wait 30 seconds, then plug them back in. This often resolves speed issues. Let me know if this helps!";
        setConversationContext("slow_internet_waiting");
      }

      const botResponse = {
        id: Date.now().toString(),
        text: botText,
        sender: "bot",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botResponse];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setIsTyping(false);

      if (!response) {
        setTimeout(() => {
          setShowRestartOptions(true);
        }, 500);
      }
    }, 1500);
  };

  // Generate contextual response
  const generateContextualResponse = (context, question) => {
    switch (context) {
      case "no_internet":
        return {
          id: Date.now().toString(),
          text: "I understand you have no internet connection. Let's try to diagnose the issue. Please check:",
          sender: "bot",
          timestamp: new Date(),
          quickReplies: noInternetFollowUp,
        };
      case "slow_internet":
        return {
          id: Date.now().toString(),
          text: "Slow internet can be frustrating. Have you already tried restarting your modem and router equipment?",
          sender: "bot",
          timestamp: new Date(),
        };
      case "cant_access_websites":
        return {
          id: Date.now().toString(),
          text: "If you're unable to access certain websites or apps, this could be due to:\n\n• DNS issues\n• Firewall restrictions\n• Website-specific problems\n\nOur technical support team can help diagnose this issue.",
          sender: "bot",
          timestamp: new Date(),
        };
      case "change_password":
        return {
          id: Date.now().toString(),
          text: "To change your Wi-Fi password, you'll need to access your router's admin panel. Since this requires technical configuration, our support team can guide you through the process or do it for you remotely.",
          sender: "bot",
          timestamp: new Date(),
        };
      default:
        return {
          id: Date.now().toString(),
          text: "Thanks for reaching out. How can I help you further?",
          sender: "bot",
          timestamp: new Date(),
        };
    }
  };

  // Send regular message
  const sendMessage = async (text = inputText.trim()) => {
    if (!text) {
      Alert.alert("Empty", "Please type a message.");
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);

    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = {
        id: Date.now().toString(),
        text: "Thanks for the information. How else can I assist you?",
        sender: "bot",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botResponse];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setIsTyping(false);
    }, 1500);
  };

  // Submit ticket
  const submitTicket = async () => {
    if (!ticketSubject.trim()) {
      Alert.alert("Required", "Please describe your issue.");
      return;
    }

    if (!selectedSubscription) {
      Alert.alert("Required", "Please select a subscription.");
      return;
    }

    setIsSubmittingTicket(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "You need to be logged in to create a ticket.");
        setIsSubmittingTicket(false);
        return;
      }

      if (!user || !user.id) {
        Alert.alert("Error", "User information not found.");
        setIsSubmittingTicket(false);
        return;
      }

      // Check for subdomain
      if (!user?.branch?.subdomain) {
        Alert.alert("Error", "Subdomain not found. Please contact support.");
        setIsSubmittingTicket(false);
        return;
      }

      const subdomain = user.branch.subdomain;
      const subscriptionId = selectedSubscription.id;

      if (!subscriptionId) {
        Alert.alert("Error", "No valid subscription ID found.");
        setIsSubmittingTicket(false);
        return;
      }

      // Create FormData for backend submission
      const formData = new FormData();

      // Add text fields
      formData.append("subject", ticketSubject);
      formData.append("description", ticketSubject);
      formData.append("category", "Technical Support");
      formData.append("priority", "medium");
      formData.append("subscription_id", subscriptionId);
      formData.append("user_id", user.id.toString());

      // Append attachments
      if (ticketAttachments && ticketAttachments.length > 0) {
        ticketAttachments.forEach((attachment, index) => {
          const uriParts = attachment.uri.split("/");
          const filename = uriParts[uriParts.length - 1];

          let type = "image/jpeg";
          if (filename.toLowerCase().endsWith(".png")) {
            type = "image/png";
          } else if (filename.toLowerCase().endsWith(".gif")) {
            type = "image/gif";
          }

          formData.append("picture", {
            uri: attachment.uri,
            type: type,
            name: filename,
          });
        });
      }

      console.log("FormData prepared with subscription_id:", subscriptionId);

      // Build URL with subdomain
      const API_URL = `https://${subdomain}.kazibufastnet.com/api/app/tickets/create`;
      console.log("Creating ticket at:", API_URL);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Raw response text:", responseText);

      if (!response.ok) {
        let errorMessage = "Failed to create ticket. Please try again.";
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.errors) {
            errorMessage = Object.values(errorData.errors).flat().join(", ");
          }
        } catch (e) {
          console.log("Could not parse error response as JSON");
        }
        throw new Error(errorMessage);
      }

      let apiResponseData;
      try {
        apiResponseData = JSON.parse(responseText);
        console.log(
          "Parsed API response:",
          JSON.stringify(apiResponseData, null, 2),
        );
      } catch (e) {
        console.log("JSON parse error:", e);
        throw new Error("Invalid JSON response from server");
      }

      // Extract backend ID and ticket number
      let backendId = null;
      let ticketNumber = null;

      // Try to find ticket data in different response structures
      let ticketData = null;

      if (apiResponseData.ticket) {
        ticketData = apiResponseData.ticket;
      } else if (apiResponseData.data) {
        ticketData = apiResponseData.data;
        if (apiResponseData.data.ticket) {
          ticketData = apiResponseData.data.ticket;
        }
      } else if (apiResponseData.success && apiResponseData.ticket) {
        ticketData = apiResponseData.ticket;
      } else if (apiResponseData.success && apiResponseData.data) {
        ticketData = apiResponseData.data;
      } else {
        ticketData = apiResponseData;
      }

      console.log("Extracted ticketData:", ticketData);

      // Extract IDs from ticketData
      if (ticketData) {
        backendId = ticketData.id || ticketData.ticket_id || ticketData.ticketId;
        ticketNumber = ticketData.ticket_number || ticketData.ticketNumber || 
                      ticketData.ticket_no || ticketData.reference_number;
      }

      // If still no ID, try direct response keys
      if (!backendId) {
        backendId = apiResponseData.id || apiResponseData.ticket_id;
        ticketNumber = apiResponseData.ticket_number || apiResponseData.ticketNumber;
      }

      console.log(
        "Final extracted - backendId:",
        backendId,
        "ticketNumber:",
        ticketNumber,
      );

      if (!backendId) {
        backendId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.warn("No backend ID received, using temporary ID:", backendId);
      }

      // Format the ticket number for display
      const displayTicketNumber = formatTicketNumber(ticketNumber, backendId);

      // Create ticket object for local storage
      const newTicket = {
        id: backendId,
        backendId: backendId,
        ticketNumber: displayTicketNumber,
        subject: ticketSubject,
        description: `Support request: ${ticketSubject}`,
        status: "submitted",
        priority: "medium",
        category: "Technical Support",
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: ticketAttachments.map((att) => ({
          uri: att.uri,
          name: att.name,
          type: "image",
        })),
        assignedTo: null,
        lastResponse: null,
        responseCount: 0,
        formattedDate: new Date().toLocaleDateString(),
        formattedTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        source: "api",
        subscription_id: subscriptionId,
        subscription_name:
          selectedSubscription.plan?.name ||
          selectedSubscription.subscription_id ||
          "Unknown",
        isSynced: true,
        syncDate: new Date().toISOString(),
      };

      // Save to AsyncStorage
      const userTicketsKey = getUserTicketsKey(user.id);
      const existingTicketsJson = await AsyncStorage.getItem(userTicketsKey);
      let ticketsArray = [];

      if (existingTicketsJson) {
        try {
          ticketsArray = JSON.parse(existingTicketsJson);
          if (!Array.isArray(ticketsArray)) {
            ticketsArray = [];
          }
        } catch (e) {
          ticketsArray = [];
        }
      }

      // Remove any existing ticket with same ID
      ticketsArray = ticketsArray.filter(
        (t) => t.id !== backendId && t.backendId !== backendId,
      );

      // Add new ticket to beginning
      ticketsArray.unshift(newTicket);
      await AsyncStorage.setItem(userTicketsKey, JSON.stringify(ticketsArray));

      console.log("Ticket saved locally with ID:", backendId);

      // Update chat messages
      const successMsg = {
        id: Date.now().toString(),
        text: `✅ Ticket Created Successfully!\n\nTicket #: ${displayTicketNumber}\nStatus: Submitted\nSubscription: ${selectedSubscription.plan?.name || "N/A"}\n\nYou can view this ticket in the Tickets section.`,
        sender: "bot",
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, successMsg];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);

      // Reset and close
      setTicketSubject("");
      setTicketAttachments([]);
      setTicketModalVisible(false);
      setShowTicketPrompt(false);
      setShowContactInfo(false);
      setConversationContext(null);
      setShowYesNoQuestion(false);
      setShowRestartOptions(false);
      setSelectedSubscription(null);
      setShowSubscriptionDropdown(false);

      // Show success alert
      Alert.alert(
        "Ticket Submitted! 🎫",
        `Ticket #${displayTicketNumber} has been created successfully.\n\nOur support team will review it and contact you soon.`,
        [
          {
            text: "View Tickets",
            onPress: () => {
              router.push("/tickets");
            },
          },
          {
            text: "OK",
            style: "default",
          },
        ],
      );
    } catch (error) {
      console.log("Submit ticket error:", error);
      Alert.alert(
        "Error",
        error.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Open ticket form
  const openTicketForm = () => {
    const lastUserMessage = messages
      .filter((m) => m.sender === "user")
      .slice(-1)[0];
    if (lastUserMessage && lastUserMessage.text) {
      setTicketSubject(lastUserMessage.text);
    }
    setTicketModalVisible(true);
    setShowTicketPrompt(false);
  };

  // Handle ticket attachment
  const pickTicketImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setTicketAttachments((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: "image",
          },
        ]);
      }
    } catch (error) {
      console.log("Error picking image:", error);
    }
  };

  const removeTicketAttachment = (id) => {
    setTicketAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Render subscription dropdown
  const renderSubscriptionDropdown = () => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowSubscriptionDropdown(!showSubscriptionDropdown)}
        disabled={loadingSubscriptions}
      >
        <Text
          style={[
            styles.dropdownButtonText,
            !selectedSubscription && styles.dropdownButtonPlaceholder,
          ]}
        >
          {selectedSubscription
            ? selectedSubscription.subscription_id ||
              `Subscription #${selectedSubscription.id}`
            : loadingSubscriptions
              ? "Loading subscriptions..."
              : "Select a subscription *"}
        </Text>

        {!loadingSubscriptions && (
          <Ionicons
            name={showSubscriptionDropdown ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.text}
          />
        )}
      </TouchableOpacity>

      {showSubscriptionDropdown && (
        <View style={styles.dropdownList}>
          {loadingSubscriptions ? (
            <View style={styles.dropdownItem}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  color: colors.textLight,
                }}
              >
                Loading subscriptions...
              </Text>
            </View>
          ) : subscriptions.length > 0 ? (
            <ScrollView style={{ maxHeight: 200 }}>
              {subscriptions.map((subscription) => {
                const address = getSubscriptionAddress(
                  subscription.originalData,
                );
                return (
                  <TouchableOpacity
                    key={subscription.id}
                    style={[
                      styles.dropdownItem,
                      selectedSubscription?.id === subscription.id &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedSubscription(subscription);
                      setShowSubscriptionDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      {subscription.subscription_id ||
                        `Subscription #${subscription.id}`}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: colors.textLight }}
                      numberOfLines={1}
                    >
                      {address}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textLight,
                        marginTop: 2,
                      }}
                    >
                      Status: {subscription.status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.noSubscriptionsText}>
              No subscriptions found
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // Render message
  const renderMessage = ({ item }) => {
    const isBot = item.sender === "bot";

    return (
      <View
        style={[
          styles.messageWrapper,
          isBot ? styles.botMessageWrapper : styles.userMessageWrapper,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isBot ? styles.botMessageBubble : styles.userMessageBubble,
          ]}
        >
          <Text style={isBot ? styles.botMessageText : styles.userMessageText}>
            {item.text}
          </Text>
          {item.quickReplies && (
            <View style={styles.quickRepliesContainer}>
              {item.quickReplies.map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickReplyButton}
                  onPress={() => handleNoInternetFollowUp(reply)}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.messageTime}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  // Render contact info
  const renderContactInfo = () => {
    if (!showContactInfo) return null;

    return (
      <View style={styles.contactInfoBox}>
        <Text style={styles.contactTitle}>Contact Support</Text>
        <Text style={styles.contactDetail}>📞 Phone: {contactInfo.phone}</Text>
        <Text style={styles.contactDetail}>📞 Phone: {contactInfo.phone2}</Text>
        <Text style={styles.contactDetail}>📧 Email: {contactInfo.email}</Text>
        <Text style={styles.contactNote}>
          For immediate assistance, please call or create a support ticket.
        </Text>
      </View>
    );
  };

  // Render list footer
  const renderListFooter = () => {
    return (
      <>
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={colors.primary}
            />
            <View style={styles.typingDots}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}

        {showYesNoQuestion && !isTyping && (
          <View style={styles.yesNoContainer}>
            <TouchableOpacity
              style={styles.yesButton}
              onPress={() => handleYesNoResponse(true)}
            >
              <Text style={styles.yesNoButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.noButton}
              onPress={() => handleYesNoResponse(false)}
            >
              <Text style={styles.yesNoButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        )}

        {showRestartOptions && !isTyping && (
          <View style={styles.quickRepliesContainer}>
            {restartFollowUp.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyButton}
                onPress={() => handleRestartResponse(reply)}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showContactInfo && renderContactInfo()}

        {conversationContext === "slow_internet" &&
          !showContactInfo &&
          !showTicketPrompt &&
          !showYesNoQuestion &&
          !showRestartOptions &&
          !isTyping && (
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={styles.yesButton}
                onPress={() => handleSlowInternetYesNo(true)}
              >
                <Text style={styles.yesNoButtonText}>Yes, but still slow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noButton}
                onPress={() => handleSlowInternetYesNo(false)}
              >
                <Text style={styles.yesNoButtonText}>No, not yet</Text>
              </TouchableOpacity>
            </View>
          )}

        {!isTyping &&
          !conversationContext &&
          !showYesNoQuestion &&
          !showRestartOptions &&
          !showContactInfo && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Quick questions:</Text>
              <View style={styles.suggestionsGrid}>
                {initialQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => handleQuickReply(question)}
                  >
                    <Text style={styles.suggestionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        {showTicketPrompt && showContactInfo && !isTyping && (
          <View style={styles.suggestionsContainer}>
            <TouchableOpacity
              style={[styles.suggestionButton, styles.createTicketSuggestion]}
              onPress={openTicketForm}
            >
              <Text style={[styles.suggestionText, styles.createTicketText]}>
                🎫 Submit Support Ticket
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(conversationContext === "cant_access_websites" ||
          conversationContext === "change_password") &&
          !showContactInfo &&
          !isTyping && (
            <View style={styles.suggestionsContainer}>
              <TouchableOpacity
                style={[
                  styles.suggestionButton,
                  {
                    backgroundColor: colors.primary + "10",
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  setShowContactInfo(true);
                  setShowTicketPrompt(true);
                }}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    { color: colors.primary, fontWeight: "bold" },
                  ]}
                >
                  Get Contact Information & Create Ticket
                </Text>
              </TouchableOpacity>
            </View>
          )}
      </>
    );
  };

  return (
    <>
      <FloatingButton
        onPress={() => setModalVisible(true)}
        isVisible={!modalVisible && !ticketModalVisible}
        colors={colors}
        pan={pan}
        panHandlers={panResponder.panHandlers}
      />

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={styles.botAvatar}>
                <Ionicons name="wifi" size={24} color={colors.white} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>Kazi Assistant</Text>
                <Text style={styles.headerSubtitle}>
                  {isTyping ? "Typing..." : "Online"}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => {
                  Alert.alert("Clear Chat", "Clear all messages?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear",
                      style: "destructive",
                      onPress: async () => {
                        const initialMsg = [
                          {
                            id: "1",
                            text: "Hi there! 👋 I'm Kazi Assistant. I'm here to help you with internet issues. How can I assist you today?",
                            sender: "bot",
                            timestamp: new Date(),
                          },
                        ];
                        setMessages(initialMsg);
                        if (user && user.id) {
                          const userMessagesKey = getUserMessagesKey(user.id);
                          await AsyncStorage.setItem(
                            userMessagesKey,
                            JSON.stringify(initialMsg),
                          );
                        }
                        setConversationContext(null);
                        setShowContactInfo(false);
                        setShowTicketPrompt(false);
                        setShowYesNoQuestion(false);
                        setShowRestartOptions(false);
                      },
                    },
                  ]);
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              ListFooterComponent={renderListFooter}
            />
          </View>

          {(!conversationContext ||
            (conversationContext === "slow_internet" &&
              !showYesNoQuestion &&
              !showRestartOptions)) && (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={inputRef}
                    style={styles.textInput}
                    placeholder="Type your message..."
                    placeholderTextColor={colors.textLight}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={1000}
                    onSubmitEditing={() => sendMessage()}
                    returnKeyType="send"
                    blurOnSubmit={false}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={() => sendMessage()}
                  disabled={!inputText.trim()}
                >
                  <Ionicons name="send" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={ticketModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          !isSubmittingTicket && setTicketModalVisible(false)
        }
      >
        <SafeAreaView style={styles.ticketModal}>
          <View style={styles.ticketHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                !isSubmittingTicket && setTicketModalVisible(false)
              }
              disabled={isSubmittingTicket}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.ticketTitle}>Submit Support Ticket</Text>
            <Text style={styles.ticketSubtitle}>
              Select subscription and describe your issue
            </Text>
          </View>

          <ScrollView
            style={styles.ticketForm}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Subscription *</Text>
              {renderSubscriptionDropdown()}
              {subscriptions.length > 0 && selectedSubscription && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textLight,
                    marginTop: 8,
                  }}
                >
                  Selected:{" "}
                  {selectedSubscription.subscription_id ||
                    `Subscription #${selectedSubscription.id}`}{" "}
                  - {selectedSubscription.plan?.name || "Unknown Plan"}
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Describe your issue *</Text>
              <TextInput
                style={styles.subjectInput}
                placeholder="What's the problem you're experiencing?"
                placeholderTextColor={colors.textLight}
                value={ticketSubject}
                onChangeText={setTicketSubject}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                editable={!isSubmittingTicket}
              />
            </View>

            <View style={styles.attachmentContainer}>
              <Text style={styles.attachmentLabel}>
                Attach Images (Optional)
              </Text>
              {ticketAttachments.length === 0 ? (
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={pickTicketImage}
                  disabled={isSubmittingTicket}
                >
                  <Ionicons name="image" size={24} color={colors.primary} />
                  <Text style={styles.attachmentButtonText}>Add Image</Text>
                </TouchableOpacity>
              ) : (
                <>
                  {ticketAttachments.map((attachment) => (
                    <View key={attachment.id} style={styles.selectedAttachment}>
                      <Ionicons name="image" size={24} color={colors.primary} />
                      <View style={styles.selectedAttachmentInfo}>
                        <Text style={styles.selectedAttachmentName}>
                          {attachment.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => removeTicketAttachment(attachment.id)}
                        disabled={isSubmittingTicket}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={colors.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {ticketAttachments.length < 5 && (
                    <TouchableOpacity
                      style={[styles.attachmentButton, { marginTop: 12 }]}
                      onPress={pickTicketImage}
                      disabled={isSubmittingTicket}
                    >
                      <Ionicons name="add" size={24} color={colors.primary} />
                      <Text style={styles.attachmentButtonText}>
                        Add Another Image
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitTicketButton,
                (!ticketSubject.trim() ||
                  !selectedSubscription ||
                  isSubmittingTicket) &&
                  styles.submitTicketButtonDisabled,
              ]}
              onPress={submitTicket}
              disabled={
                !ticketSubject.trim() ||
                !selectedSubscription ||
                isSubmittingTicket
              }
            >
              {isSubmittingTicket ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.white}
                  />
                  <Text style={styles.submitTicketText}>Submit Ticket</Text>
                </>
              )}
            </TouchableOpacity>

            <Text
              style={{
                textAlign: "center",
                color: colors.textLight,
                fontSize: 12,
                marginTop: 20,
                paddingHorizontal: 20,
              }}
            >
              Our support team will review your ticket and contact you within 24
              hours.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default ChatBot;