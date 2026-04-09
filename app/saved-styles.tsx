import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import AppScreenWrapper from "../components/layout/AppScreenWrapper";
import Loading from "../components/states/Loading";
import SavedStyleCard from "../components/ui/SavedStyleCard";
import { auth } from "../firebaseConfig";
import {
  deleteSavedStyle,
  getUserSavedStyles,
} from "../services/firebase/savedStylesService";
import { colors } from "../styles/colors";
import { radius, spacing } from "../styles/spacing";
import { typography } from "../styles/typography";
import { SavedStyle, SavedStyleSource } from "../types/savedStyles";

type FilterKey = "all" | SavedStyleSource;

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "home", label: "Home" },
  { key: "ai_companion", label: "AI Companion" },
  { key: "outfit_suggestions", label: "Outfit Suggestions" },
];

export default function SavedStylesScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");
  const [savedStyles, setSavedStyles] = useState<SavedStyle[]>([]);

  const contentWidth = isLargeTablet
    ? Math.min(width - 80, 1040)
    : isTablet
      ? Math.min(width - 64, 900)
      : Math.min(width - 32, 420);

  const columns = isLargeTablet ? 2 : isTablet ? 2 : 1;
  const gap = isTablet ? spacing.lg : spacing.md;
  const cardWidth = columns === 1 ? contentWidth : (contentWidth - gap) / 2;

  useEffect(() => {
    const loadSavedStyles = async () => {
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserSavedStyles(user.uid);
        setSavedStyles(data);
      } catch (error) {
        console.log("Saved styles load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedStyles();
  }, []);

  const filteredStyles = useMemo(() => {
    if (selectedFilter === "all") return savedStyles;
    return savedStyles.filter((item) => item.source === selectedFilter);
  }, [savedStyles, selectedFilter]);

  const handleDelete = async (savedStyleId: string) => {
    try {
      await deleteSavedStyle(savedStyleId);
      setSavedStyles((prev) => prev.filter((item) => item.id !== savedStyleId));
    } catch (error) {
      console.log("Delete saved style error:", error);
      Alert.alert("Error", "Could not remove this saved style.");
    }
  };

  if (loading) {
    return (
      <AppScreenWrapper>
        <Loading />
      </AppScreenWrapper>
    );
  }

  return (
    <AppScreenWrapper>
      <Text style={styles.title}>Saved Styles</Text>
      <Text style={styles.subtitle}>
        Revisit looks you saved from Home, the AI Companion, and Outfit
        Suggestions.
      </Text>

      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const active = selectedFilter === filter.key;

          return (
            <Pressable
              key={filter.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filteredStyles.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No saved styles yet</Text>
          <Text style={styles.emptyText}>
            When you save looks from Home, Aura, or Outfit Suggestions, they’ll
            appear here in organized sections.
          </Text>
        </View>
      ) : (
        <View style={[styles.grid, { gap }]}>
          {filteredStyles.map((item) => (
            <View
              key={item.id}
              style={[
                styles.cardWrap,
                {
                  width: cardWidth,
                  marginBottom: gap,
                },
              ]}
            >
              <SavedStyleCard item={item} onDelete={handleDelete} />
            </View>
          ))}
        </View>
      )}
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  filterChip: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: "#E3D9CE",
  },
  filterChipActive: {
    backgroundColor: colors.buttonPrimary,
    borderColor: colors.buttonPrimary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.darkText,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    ...typography.bodyMedium,
    color: colors.darkText,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardWrap: {},
});
