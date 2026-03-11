import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ProfileFieldRow from "../components/ui/ProfileFieldRow";
import { colors } from "../styles/colors";
import { hitSlop, spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

const measurementData = [
  { label: "Height", value: "..." },
  { label: "Weight", value: "..." },
  { label: "Chest / Bust", value: "..." },
  { label: "Waist", value: "..." },
  { label: "Hips", value: "..." },
  { label: "Shoulders", value: "..." },
  { label: "Inseam", value: "..." },
];

export default function ProfileMeasurementsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const contentWidth = isTablet
    ? Math.min(width - 64, 900)
    : Math.min(width - 32, 420);
  const topSpacing = Math.max(insets.top + spacing.sm, spacing.md);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: true,
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topSpacing },
        ]}
      >
        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={hitSlop}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.buttonPrimary}
              />
            </Pressable>

            <Text style={styles.title}>My Measurements</Text>
          </View>

          <Text style={styles.subtitle}>
            These measurements help AURA give more accurate fit and outfit
            suggestions.
          </Text>

          <View style={[styles.layout, isTablet && styles.layoutTablet]}>
            <View
              style={[styles.infoColumn, isTablet && styles.infoColumnTablet]}
            >
              <View style={styles.highlightCard}>
                <Text style={styles.highlightTitle}>Measurement Status</Text>
                <Text style={styles.highlightText}>
                  Your current saved measurements are shown below. You can
                  review them anytime.
                </Text>
              </View>

              <Pressable
                style={styles.primaryButton}
                onPress={() => router.push("/measurements")}
              >
                <Text style={styles.primaryButtonText}>Edit Measurements</Text>
              </Pressable>

              <Text style={styles.helperText}>
                Placeholder values are shown for now. These will later come from
                saved user data.
              </Text>
            </View>

            <View
              style={[styles.dataColumn, isTablet && styles.dataColumnTablet]}
            >
              <View style={styles.card}>
                {measurementData.map((item, index) => (
                  <ProfileFieldRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    showDivider={index !== measurementData.length - 1}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: spacing.xxxl,
  },
  content: {
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.darkText,
  },
  subtitle: {
    ...typography.body,
    lineHeight: 20,
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
  layout: {
    gap: spacing.lg,
  },
  layoutTablet: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },
  infoColumn: {
    width: "100%",
  },
  infoColumnTablet: {
    flex: 0.9,
  },
  dataColumn: {
    width: "100%",
  },
  dataColumnTablet: {
    flex: 1.25,
  },
  highlightCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  highlightTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: spacing.xs,
  },
  highlightText: {
    ...typography.body,
    lineHeight: 18,
    color: colors.mutedText,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  helperText: {
    marginTop: spacing.md,
    ...typography.caption,
    lineHeight: 18,
    color: colors.mutedText,
    textAlign: "center",
  },
});
