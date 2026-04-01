import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { SavedStyle } from "../../types/savedStyles";

type Props = {
  item: SavedStyle;
  onDelete?: (id: string) => void;
};

function getSourceLabel(source: SavedStyle["source"]) {
  switch (source) {
    case "home":
      return "Home";
    case "ai_companion":
      return "AI Companion";
    case "outfit_suggestions":
      return "Outfit Suggestions";
    default:
      return "Saved";
  }
}

export default function SavedStyleCard({ item, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getSourceLabel(item.source)}</Text>
        </View>

        {typeof item.matchPercentage === "number" ? (
          <Text style={styles.matchText}>{item.matchPercentage}% match</Text>
        ) : null}
      </View>

      <Text style={styles.title}>{item.title}</Text>

      {!!item.occasion ? (
        <Text style={styles.occasion}>{item.occasion}</Text>
      ) : null}

      <View style={styles.piecesWrap}>
        {item.pieces.map((piece) => (
          <View key={piece.id} style={styles.pieceChip}>
            <Text style={styles.pieceText}>{piece.label}</Text>
          </View>
        ))}
      </View>

      {!!item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}

      {Array.isArray(item.suggestedSizes) && item.suggestedSizes.length > 0 ? (
        <View style={styles.sizesSection}>
          <Text style={styles.sizesLabel}>Suggested sizes</Text>

          <View style={styles.sizesWrap}>
            {item.suggestedSizes.map((size) => (
              <View key={size} style={styles.sizeChip}>
                <Text style={styles.sizeText}>{size}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {onDelete ? (
        <Pressable
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.buttonPrimary,
    fontWeight: "700",
  },
  matchText: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: "700",
  },
  title: {
    ...typography.bodyMedium,
    color: colors.darkText,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  occasion: {
    ...typography.caption,
    color: colors.mutedText,
    marginBottom: spacing.sm,
  },
  piecesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pieceChip: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pieceText: {
    ...typography.caption,
    color: colors.darkText,
    fontWeight: "600",
  },
  reason: {
    ...typography.body,
    color: colors.darkText,
    marginBottom: spacing.md,
  },
  sizesSection: {
    marginBottom: spacing.md,
  },
  sizesLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  sizesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sizeChip: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  sizeText: {
    ...typography.caption,
    color: colors.darkText,
    fontWeight: "600",
  },
  deleteButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.buttonSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deleteButtonText: {
    ...typography.caption,
    color: colors.buttonSecondaryText,
    fontWeight: "700",
  },
});
