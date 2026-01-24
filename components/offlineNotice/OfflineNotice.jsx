import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function OfflineNotice({ onRetry }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#F8FAFC",
      }}
    >
      <Ionicons name="wifi-off" size={48} color="#94A3B8" />
      <Text style={{ fontSize: 18, fontWeight: "700", marginTop: 16 }}>
        No Internet Connection
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#64748B",
          textAlign: "center",
          marginTop: 8,
        }}
      >
        Please check your connection and try again.
      </Text>

      <TouchableOpacity
        onPress={onRetry}
        style={{
          marginTop: 20,
          paddingHorizontal: 24,
          paddingVertical: 12,
          backgroundColor: "#00AFA1",
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#FFF", fontWeight: "700" }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
