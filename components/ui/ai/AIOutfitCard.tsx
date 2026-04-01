import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../../styles/colors";
import { radius, spacing } from "../../../styles/spacing";
import { typography } from "../../../styles/typography";
import { AIOutfit } from "../../../types/ai";

type Props = {
  outfit: AIOutfit;
  onSave: () => void;
};

export default function AIOutfitCard({ outfit, onSave }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{outfit.title}</Text>

        {typeof outfit.matchPercentage === "number" ? (
          <Text style={styles.match}>{outfit.matchPercentage}%</Text>
        ) : null}
      </View>

      {outfit.occasion ? (
        <Text style={styles.occasion}>{outfit.occasion}</Text>
      ) : null}

      <View style={styles.piecesWrap}>
        {outfit.pieces.map((p) => (
          <View key={p.id} style={styles.pieceChip}>
            <Text style={styles.pieceText}>{p.label}</Text>
          </View>
        ))}
      </View>

      {outfit.reason ? (
        <Text style={styles.reason}>{outfit.reason}</Text>
      ) : null}

      {Array.isArray(outfit.suggestedSizes) &&
      outfit.suggestedSizes.length > 0 ? (
        <View style={styles.sizesSection}>
          <Text style={styles.sizesLabel}>Suggested sizes</Text>

          <View style={styles.sizesWrap}>
            {outfit.suggestedSizes.map((size) => (
              <View key={size} style={styles.sizeChip}>
                <Text style={styles.sizeText}>{size}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>Wear This</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.darkText,
    flex: 1,
  },
  match: {
    ...typography.caption,
    color: colors.buttonPrimary,
    fontWeight: "700",
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
    fontWeight: "600",
    color: colors.darkText,
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
  button: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
});
