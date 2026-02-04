import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from "react-native";
import { useTheme } from "../../../../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Platform, useColorScheme } from "react-native";

export default function Settings() {
  const router = useRouter();
  const { mode, setMode, theme } = useTheme();
  const systemColorScheme = useColorScheme(); // Get system color scheme
  
  // Fix: Use system color scheme when mode is 'system'
  const effectiveMode = mode === 'system' ? systemColorScheme : mode;
  
  // Define theme colors for dark/light modes
  const themeColors = {
    light: {
      background: "#F5F8FA",
      surface: "#FFFFFF",
      primary: "#21C7B9",
      primaryDark: "#1a9d91",
      text: "#1E293B",
      textSecondary: "#64748B",
      border: "#E2E8F0",
      infoBg: "#EFF6FF",
      infoBorder: "#DBEAFE",
      tipsBg: "#FFF7ED",
      tipsBorder: "#FFEDD5",
    },
    dark: {
      background: "rgb(10, 10, 10)",
      surface: "#1E1E1E",
      primary: "#1f6f68",
      primaryDark: "#166775",
      text: "#FFFFFF",
      textSecondary: "#B0B0B0",
      border: "#333333",
      infoBg: "#1E293B",
      infoBorder: "#334155",
      tipsBg: "#2C1810",
      tipsBorder: "#422006",
    }
  };
  
  const colors = themeColors[effectiveMode] || themeColors.light;

  const themeOptions = [
    { 
      key: "system", 
      label: "System Default", 
      icon: "phone-portrait-outline", 
      description: `Follow your device theme (${systemColorScheme === 'dark' ? 'Dark' : 'Light'})` 
    },
    { key: "light", label: "Light Mode", icon: "sunny-outline", description: "Always use light theme" },
    { key: "dark", label: "Dark Mode", icon: "moon-outline", description: "Always use dark theme" },
  ];

  const handleSetMode = (selectedMode) => {
    setMode(selectedMode);
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={effectiveMode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.primary} 
      />
      
      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          {/* Left side - Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          
          {/* Center - Title */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>App Settings</Text>
            <Text style={styles.headerSubtitle}>Choose your preferred app appearance</Text>
          </View>
          
          {/* Right side - Placeholder for alignment */}
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Options Card */}
        <View style={[styles.card, { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: effectiveMode === 'dark' ? 'transparent' : '#000',
        }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>App Appearance</Text>
          </View>
          
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Select how you want the app to look. You can follow your device settings or choose a specific theme.
          </Text>

          <View style={styles.optionsContainer}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionItem,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  mode === option.key && [
                    styles.optionItemActive,
                    { 
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + '15',
                    }
                  ],
                ]}
                onPress={() => handleSetMode(option.key)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.optionIconContainer,
                    { 
                      backgroundColor: mode === option.key ? colors.primary + '15' : colors.background 
                    }
                  ]}>
                    <Ionicons 
                      name={option.icon} 
                      size={22} 
                      color={mode === option.key ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionTitle,
                      { color: colors.text },
                      mode === option.key && [
                        styles.optionTitleActive,
                        { color: colors.primary }
                      ]
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                
                {mode === option.key ? (
                  <View style={styles.selectedIndicator}>
                    <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  </View>
                ) : (
                  <View style={styles.unselectedIndicator}>
                    <View style={[styles.unselectedDot, { borderColor: colors.textSecondary }]} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current Theme Info */}
        <View style={[styles.infoCard, { 
          backgroundColor: colors.infoBg,
          borderColor: colors.infoBorder,
        }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.primary }]}>Current Selection</Text>
          </View>
          <View style={styles.currentTheme}>
            <Text style={[styles.currentThemeLabel, { color: colors.text }]}>Active Theme:</Text>
            <View style={[styles.currentThemeBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.currentThemeText}>
                {mode === 'system' ? `System Default (${systemColorScheme === 'dark' ? 'Dark' : 'Light'})` : 
                 mode === 'light' ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </View>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {mode === 'system' 
              ? `Following your device's ${systemColorScheme} theme. Change will update when device theme changes.`
              : 'Using custom theme setting. Changes take effect immediately.'}
          </Text>
        </View>

        {/* Tips Card */}
        <View style={[styles.tipsCard, { 
          backgroundColor: colors.tipsBg,
          borderColor: colors.tipsBorder,
        }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={22} color="#FFA726" />
            <Text style={[styles.tipsTitle, { color: colors.mode === 'dark' ? '#FFA726' : '#C2410C' }]}>Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.tipText, { color: colors.text }]}>
                System Default will automatically switch between light and dark modes based on your device settings
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.tipText, { color: colors.text }]}>
                Dark mode can help reduce eye strain in low-light conditions
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.tipText, { color: colors.text }]}>
                Your preference will be saved and remembered across app sessions
              </Text>
            </View>
          </View>
        </View>
        
        {/* System Info */}
        <View style={[styles.systemInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.systemInfoTitle, { color: colors.text }]}>Device Information</Text>
          <View style={styles.systemInfoRow}>
            <Text style={[styles.systemInfoLabel, { color: colors.textSecondary }]}>System Theme:</Text>
            <Text style={[styles.systemInfoValue, { color: colors.text }]}>
              {systemColorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <View style={styles.systemInfoRow}>
            <Text style={[styles.systemInfoLabel, { color: colors.textSecondary }]}>Selected Mode:</Text>
            <Text style={[styles.systemInfoValue, { color: colors.text }]}>
              {mode === 'system' ? 'System Default' : mode === 'light' ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  headerRight: {
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionItemActive: {
    borderWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionTitleActive: {
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unselectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentTheme: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  currentThemeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  currentThemeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentThemeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tipsList: {
    gap: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  systemInfoCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  systemInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  systemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  systemInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  systemInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});