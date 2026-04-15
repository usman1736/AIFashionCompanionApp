import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

type ClosetItem = {
  id: string;
  imageUrl?: string;
  image?: string;
  category?: string;
  color?: string;
  brand?: string;
};

type OutfitCardProps = {
  top: ClosetItem | null;
  bottom: ClosetItem | null;
  shoes: ClosetItem | null;
  occasion: string;
  onSave?: () => void;
  saving?: boolean;
};

function getImage(item: ClosetItem) {
  return item.imageUrl || item.image || "";
}

export default function OutfitCard({
  top,
  bottom,
  shoes,
  occasion,
  onSave,
  saving,
}: OutfitCardProps) {
  const items = [top, bottom, shoes].filter(Boolean) as ClosetItem[];

  return (
    <View style={styles.card}>
      <Text style={styles.occasion}>Occasion: {occasion}</Text>

      <View style={styles.itemsRow}>
        {items.map((item, i) => (
          <View key={i} style={styles.itemThumb}>
            {getImage(item) ? (
              <Image
                source={{ uri: getImage(item) }}
                style={styles.thumbImage}
              />
            ) : (
              <View style={styles.thumbPlaceholder} />
            )}
            <Text style={styles.thumbLabel}>{item.category}</Text>
          </View>
        ))}
      </View>

      {onSave && (
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : "Save Outfit"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  occasion: {
    ...typography.caption,
    color: colors.mutedText,
    marginBottom: spacing.md,
    textTransform: "capitalize",
  },
  itemsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemThumb: {
    alignItems: "center",
  },
  thumbImage: {
    width: 75,
    height: 75,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  thumbPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: radius.md,
    backgroundColor: "#ECE7E3",
    marginBottom: spacing.xs,
  },
  thumbLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "capitalize",
  },
  saveBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#C4B9B0",
  },
  saveBtnText: {
    ...typography.button,
    color: colors.white,
  },
});
