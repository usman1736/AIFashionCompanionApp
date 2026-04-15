import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppScreenWrapper from "../../components/layout/AppScreenWrapper";
import { auth } from "../../firebaseConfig";
import { getClosetItemsForUser } from "../../services/closetService";
import { createSavedStyle } from "../../services/firebase/savedStylesService";
import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

type ClosetItem = {
  id: string;
  userId?: string;
  image?: string;
  imageUrl?: string;
  imagePath?: string;
  category?: string;
  color?: string;
  occasion?: string;
  occasions?: string[];
  season?: string;
  seasons?: string[];
  brand?: string;
  dateAdded?: number;
  wearCount?: number;
};

type OutfitPiece = {
  id: string;
  label: string;
  imageUrl?: string;
  category?: string;
  color?: string;
  brand?: string;
};

type GeneratedOutfit = {
  id: string;
  title: string;
  occasion: string;
  matchPercentage: number;
  reason: string;
  pieces: OutfitPiece[];
};

const MINIMUM_COUNTS = {
  Tops: 4,
  Bottoms: 3,
  Shoes: 2,
} as const;

function getItemImage(item: ClosetItem) {
  return item.imageUrl || item.image || "";
}

function normalizeCategory(category?: string) {
  return (category || "").trim().toLowerCase();
}

function itemMatchesCategory(item: ClosetItem, category: string) {
  return normalizeCategory(item.category) === category.toLowerCase();
}

function getCategoryCount(items: ClosetItem[], category: string) {
  return items.filter((item) => itemMatchesCategory(item, category)).length;
}

function getDominantOccasion(items: ClosetItem[]) {
  const counts: Record<string, number> = {};

  items.forEach((item) => {
    const values = Array.isArray(item.occasions)
      ? item.occasions
      : item.occasion
        ? [item.occasion]
        : [];

    values.forEach((value) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      counts[trimmed] = (counts[trimmed] || 0) + 1;
    });
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "Everyday";
}

function getMissingItemsMessage(items: ClosetItem[]) {
  const messages: string[] = [];

  (Object.keys(MINIMUM_COUNTS) as Array<keyof typeof MINIMUM_COUNTS>).forEach(
    (category) => {
      const currentCount = getCategoryCount(items, category);
      const needed = Math.max(0, MINIMUM_COUNTS[category] - currentCount);

      if (needed > 0) {
        messages.push(`Add ${needed} more ${category.toLowerCase()}`);
      }
    },
  );

  return messages.join(" and ");
}

function getReadablePieceLabel(item: ClosetItem) {
  const parts = [item.category, item.color, item.brand].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "Closet Item";
}

function buildReason(
  top?: ClosetItem,
  bottom?: ClosetItem,
  shoes?: ClosetItem,
  accent?: ClosetItem,
) {
  const lines: string[] = [];

  if (top?.color) {
    lines.push(`${top.color} on top helps create the main focus of the outfit`);
  }

  if (bottom?.color) {
    lines.push(
      `${bottom.color} on the bottom keeps the look balanced and easy to wear`,
    );
  }

  if (shoes?.color) {
    lines.push(`${shoes.color} shoes help ground the overall look`);
  }

  if (accent?.category) {
    lines.push(
      `the ${accent.category.toLowerCase()} adds a polished finishing touch`,
    );
  }

  if (lines.length === 0) {
    return "This combination works well because it feels balanced, practical, and pulled together using pieces from your closet.";
  }

  return `${lines.join(", ")}. Together, the outfit feels intentional and visually balanced.`;
}

function buildGeneratedOutfits(items: ClosetItem[]): GeneratedOutfit[] {
  const tops = items.filter((item) => itemMatchesCategory(item, "Tops"));
  const bottoms = items.filter((item) => itemMatchesCategory(item, "Bottoms"));
  const shoes = items.filter((item) => itemMatchesCategory(item, "Shoes"));
  const outerwear = items.filter((item) =>
    itemMatchesCategory(item, "Outerwear"),
  );
  const accessories = items.filter((item) =>
    itemMatchesCategory(item, "Accessories"),
  );

  const extras = [...outerwear, ...accessories];
  const occasion = getDominantOccasion(items);

  const totalToGenerate = Math.min(4, Math.max(tops.length, bottoms.length));
  const outfits: GeneratedOutfit[] = [];

  for (let i = 0; i < totalToGenerate; i += 1) {
    const top = tops[i % tops.length];
    const bottom = bottoms[i % bottoms.length];
    const shoe = shoes[i % shoes.length];
    const accent = extras.length > 0 ? extras[i % extras.length] : undefined;

    const sourceItems = [top, bottom, shoe, accent].filter(
      Boolean,
    ) as ClosetItem[];

    outfits.push({
      id: `outfit-${Date.now()}-${i}`,
      title:
        i === 0
          ? "Today’s Best Match"
          : i === 1
            ? "Everyday Outfit Pick"
            : i === 2
              ? "Balanced Closet Combo"
              : "Easy Styled Look",
      occasion,
      matchPercentage: Math.max(84, 95 - i * 3),
      reason: buildReason(top, bottom, shoe, accent),
      pieces: sourceItems.map((item, index) => ({
        id: `${item.id}-${index}`,
        label: getReadablePieceLabel(item),
        imageUrl: getItemImage(item),
        category: item.category,
        color: item.color,
        brand: item.brand,
      })),
    });
  }

  return outfits;
}

export default function OutfitSuggestionsScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [generatedOutfits, setGeneratedOutfits] = useState<GeneratedOutfit[]>(
    [],
  );
  const [selectedOutfit, setSelectedOutfit] = useState<GeneratedOutfit | null>(
    null,
  );
  const [emptyHint, setEmptyHint] = useState("");

  const summaryText = useMemo(() => {
    if (closetItems.length === 0) return "";
    return `${closetItems.length} closet item${closetItems.length === 1 ? "" : "s"} found`;
  }, [closetItems.length]);

  const handleGenerate = async () => {
    if (!user) {
      Alert.alert("Login required", "Please log in to generate suggestions.");
      return;
    }

    setLoading(true);
    setGeneratedOutfits([]);
    setEmptyHint("");

    try {
      const items = (await getClosetItemsForUser(user.uid)) as ClosetItem[];
      setClosetItems(items);

      const topCount = getCategoryCount(items, "Tops");
      const bottomCount = getCategoryCount(items, "Bottoms");
      const shoeCount = getCategoryCount(items, "Shoes");

      const hasEnoughItems =
        items.length >= 5 && topCount > 0 && bottomCount > 0 && shoeCount > 0;

      if (!hasEnoughItems) {
        setEmptyHint(getMissingItemsMessage(items));
        return;
      }

      setGeneratedOutfits(buildGeneratedOutfits(items));
    } catch (error) {
      console.log("GENERATE OUTFITS ERROR:", error);
      Alert.alert("Error", "Could not generate outfit suggestions.");
    } finally {
      setLoading(false);
    }
  };

  const handleWearThis = async (outfit: GeneratedOutfit) => {
    if (!user) {
      Alert.alert("Login required", "Please log in first.");
      return;
    }

    try {
      await createSavedStyle({
        userId: user.uid,
        title: outfit.title,
        occasion: outfit.occasion,
        matchPercentage: outfit.matchPercentage,
        source: "outfit_suggestions",
        reason: outfit.reason,
        pieces: outfit.pieces.map((piece) => ({
          id: piece.id,
          label: piece.label,
          imageUrl: piece.imageUrl || "",
          category: piece.category || "",
          color: piece.color || "",
          brand: piece.brand || "",
        })),
        suggestedSizes: [],
      });

      Alert.alert("Saved", "This outfit was added to Saved Styles.");
    } catch (error) {
      console.log("SAVE STYLE ERROR:", error);
      Alert.alert("Error", "Could not save this outfit.");
    }
  };

  return (
    <AppScreenWrapper>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.buttonPrimary} />
          </Pressable>
          <Text style={styles.title}>Outfit Suggestions</Text>
        </View>
        <Text style={styles.subtitle}>
          Build outfit ideas from the clothes already in your closet.
        </Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Generate outfit suggestions</Text>
          <Text style={styles.heroText}>
            Tap the button below and we’ll create outfit cards using your closet
            items.
          </Text>

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Start Generating</Text>
            )}
          </Pressable>
        </View>

        {summaryText ? (
          <Text style={styles.summaryText}>{summaryText}</Text>
        ) : null}

        {!loading && emptyHint ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Your closet needs a few more pieces
            </Text>
            <Text style={styles.emptyText}>
              Add more variety so we can build stronger outfit combinations.
            </Text>
            <Text style={styles.emptyHint}>{emptyHint}</Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/closet" as any)}
            >
              <Text style={styles.primaryButtonText}>Go to Closet</Text>
            </Pressable>
          </View>
        ) : null}

        {generatedOutfits.map((outfit) => (
          <View key={outfit.id} style={styles.outfitCard}>
            <View style={styles.outfitHeader}>
              <View style={styles.outfitHeaderText}>
                <Text style={styles.outfitTitle}>{outfit.title}</Text>
                <Text style={styles.outfitOccasion}>{outfit.occasion}</Text>
              </View>

              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>
                  {outfit.matchPercentage}% Match
                </Text>
              </View>
            </View>

            <View style={styles.previewRow}>
              {outfit.pieces.slice(0, 4).map((piece) => (
                <View key={piece.id} style={styles.previewItem}>
                  {piece.imageUrl ? (
                    <Image
                      source={{ uri: piece.imageUrl }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <View style={styles.previewPlaceholder} />
                  )}
                </View>
              ))}
            </View>

            <Text style={styles.reasonText}>{outfit.reason}</Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setSelectedOutfit(outfit)}
              >
                <Text style={styles.secondaryButtonText}>View Details</Text>
              </Pressable>

              <Pressable
                style={styles.primaryHalfButton}
                onPress={() => handleWearThis(outfit)}
              >
                <Text style={styles.primaryButtonText}>Wear This</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Modal
          visible={Boolean(selectedOutfit)}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedOutfit(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{selectedOutfit?.title}</Text>
              <Text style={styles.modalSubtitle}>
                {selectedOutfit?.occasion} • {selectedOutfit?.matchPercentage}%
                Match
              </Text>

              <Text style={styles.modalSectionTitle}>Why this works</Text>
              <Text style={styles.modalReason}>{selectedOutfit?.reason}</Text>

              <Text style={styles.modalSectionTitle}>Full outfit</Text>

              {selectedOutfit?.pieces.map((piece) => (
                <View key={piece.id} style={styles.pieceRow}>
                  {piece.imageUrl ? (
                    <Image
                      source={{ uri: piece.imageUrl }}
                      style={styles.pieceImage}
                    />
                  ) : (
                    <View style={styles.piecePlaceholder} />
                  )}

                  <View style={styles.pieceTextWrap}>
                    <Text style={styles.pieceTitle}>{piece.label}</Text>
                    <Text style={styles.pieceMeta}>
                      {piece.category || "Item"}
                      {piece.brand ? ` • ${piece.brand}` : ""}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setSelectedOutfit(null)}
                >
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </Pressable>

                <Pressable
                  style={styles.primaryHalfButton}
                  onPress={async () => {
                    if (!selectedOutfit) return;
                    await handleWearThis(selectedOutfit);
                    setSelectedOutfit(null);
                  }}
                >
                  <Text style={styles.primaryButtonText}>Wear This</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
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
  backText: {
    ...typography.body,
    color: colors.buttonPrimary,
    fontWeight: "600",
  },
  title: {
    ...typography.titleLarge,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.title,
    color: colors.darkText,
    marginBottom: spacing.sm,
  },
  heroText: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryHalfButton: {
    flex: 1,
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  summaryText: {
    ...typography.caption,
    color: colors.mutedText,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.darkText,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    ...typography.body,
    color: colors.buttonPrimary,
    marginBottom: spacing.lg,
    fontWeight: "600",
  },
  outfitCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  outfitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  outfitHeaderText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  outfitTitle: {
    ...typography.title,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  outfitOccasion: {
    ...typography.caption,
    color: colors.mutedText,
  },
  matchBadge: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  matchBadgeText: {
    ...typography.caption,
    color: colors.buttonPrimary,
    fontWeight: "600",
  },
  previewRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  previewItem: {
    flex: 1,
    marginRight: spacing.sm,
  },
  previewImage: {
    width: "100%",
    height: 92,
    borderRadius: radius.md,
    backgroundColor: colors.offWhite,
  },
  previewPlaceholder: {
    width: "100%",
    height: 92,
    borderRadius: radius.md,
    backgroundColor: colors.offWhite,
  },
  reasonText: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.buttonPrimary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.buttonPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "82%",
  },
  modalTitle: {
    ...typography.titleLarge,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    ...typography.heading,
    color: colors.darkText,
    marginBottom: spacing.sm,
  },
  modalReason: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
  pieceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  pieceImage: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    marginRight: spacing.md,
    backgroundColor: colors.offWhite,
  },
  piecePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    marginRight: spacing.md,
    backgroundColor: colors.offWhite,
  },
  pieceTextWrap: {
    flex: 1,
  },
  pieceTitle: {
    ...typography.bodyMedium,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  pieceMeta: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
