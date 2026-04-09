import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { auth } from "../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import AppScreenWrapper from "../../components/layout/AppScreenWrapper";
import { db } from "../../firebaseConfig";
import { createSavedStyle } from "../../services/firebase/savedStylesService";
import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

type ClosetItem = {
  id: string;
  imageUrl?: string;
  image?: string;
  category?: string;
  color?: string;
  occasion?: string;
  occasions?: string[];
  brand?: string;
};

type Outfit = {
  top: ClosetItem | null;
  bottom: ClosetItem | null;
  shoes: ClosetItem | null;
  occasion: string;
};

const MAX_REFRESHES = 5;
const STORAGE_KEY = "outfit_refresh_data";

function getImage(item: ClosetItem) {
  return item.imageUrl || item.image || "";
}

function getOccasion(item: ClosetItem) {
  if (Array.isArray(item.occasions) && item.occasions.length > 0)
    return item.occasions[0];
  return item.occasion || "Casual";
}

function buildOutfits(items: ClosetItem[]): Outfit[] {
  const tops = items.filter((i) => i.category?.toLowerCase() === "tops");
  const bottoms = items.filter((i) => i.category?.toLowerCase() === "bottoms");
  const shoes = items.filter((i) => i.category?.toLowerCase() === "shoes");

  const count = Math.min(Math.max(tops.length, bottoms.length, 1), 5);
  const outfits: Outfit[] = [];

  for (let i = 0; i < count; i++) {
    outfits.push({
      top: tops[i % tops.length] || null,
      bottom: bottoms[i % bottoms.length] || null,
      shoes: shoes[i % shoes.length] || null,
      occasion: tops[i % tops.length]
        ? getOccasion(tops[i % tops.length])
        : "Casual",
    });
  }

  return outfits;
}

function calculateMatch(outfit: Outfit): number {
  const pieces = [outfit.top, outfit.bottom, outfit.shoes].filter(Boolean);
  if (pieces.length === 0) return 0;
  const colors = pieces.map((i) => i!.color?.toLowerCase()).filter(Boolean);
  const uniqueColors = new Set(colors).size;
  if (uniqueColors === 1) return 95;
  if (uniqueColors === 2) return 80;
  return 65;
}

export default function SuggestionsScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadRefreshData();
    fetchItems();
  }, []);

  const loadRefreshData = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const today = new Date().toDateString();
      if (parsed.date !== today) {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ date: today, count: 0 }),
        );
        setRefreshCount(0);
        setLimitReached(false);
      } else {
        setRefreshCount(parsed.count);
        setLimitReached(parsed.count >= MAX_REFRESHES);
      }
    } catch (e) {
      console.log("Refresh load error:", e);
    }
  };

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "closetItems"),
        where("userId", "==", user.uid),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ClosetItem, "id">),
      }));
      setItems(data);
      setOutfits(buildOutfits(data));
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (limitReached) {
      Alert.alert(
        "Limit Reached",
        "You've used all 5 refreshes for today. Come back tomorrow!",
      );
      return;
    }
    const newCount = refreshCount + 1;
    const today = new Date().toDateString();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, count: newCount }),
    );
    setRefreshCount(newCount);
    if (newCount >= MAX_REFRESHES) setLimitReached(true);
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setOutfits(buildOutfits(shuffled));
  };

  const handleSave = async (outfit: Outfit, index: number) => {
    if (!user) return;
    setSavingIndex(index);
    try {
      const pieces = [outfit.top, outfit.bottom, outfit.shoes]
        .filter(Boolean)
        .map((item) => ({
          id: item!.id,
          label: item!.category || "Item",
          imageUrl: getImage(item!),
          category: item!.category || "",
          color: item!.color || "",
          brand: item!.brand || "",
        }));

      await createSavedStyle({
        userId: user.uid,
        title: `${outfit.occasion} Outfit`,
        occasion: outfit.occasion,
        source: "outfit_suggestions",
        reason: "Saved from Outfit Suggestions",
        pieces,
        suggestedSizes: ["Based on your saved measurements"],
      });

      Alert.alert("Saved!", "Outfit saved to your Saved Styles in Profile.");
    } catch (e) {
      console.log("Save error:", e);
      Alert.alert("Error", "Could not save outfit.");
    } finally {
      setSavingIndex(null);
    }
  };

  return (
    <AppScreenWrapper>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Outfit Suggestions</Text>

      <View style={styles.refreshRow}>
        <Text style={styles.refreshInfo}>
          {limitReached
            ? "⚠️ Limit reached — resets tomorrow"
            : `🔄 ${MAX_REFRESHES - refreshCount} refreshes left today`}
        </Text>
        <Pressable
          style={[styles.refreshBtn, limitReached && styles.refreshDisabled]}
          onPress={handleRefresh}
          disabled={limitReached}
        >
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.buttonPrimary}
          style={{ marginTop: 40 }}
        />
      ) : outfits.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No items in your closet yet. Add some clothes first!
          </Text>
        </View>
      ) : (
        outfits.map((outfit, index) => (
          <View key={index} style={styles.outfitCard}>
            <Text style={styles.outfitTitle}>Outfit {index + 1}</Text>
            <Text style={styles.matchText}>🎯 {calculateMatch(outfit)}% Match</Text>
            <Text style={styles.occasion}>Occasion: {outfit.occasion}</Text>

            <View style={styles.itemsRow}>
              {[outfit.top, outfit.bottom, outfit.shoes].map((item, i) =>
                item ? (
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
                ) : null,
              )}
            </View>

            <Pressable
              style={[
                styles.saveBtn,
                savingIndex === index && styles.saveBtnDisabled,
              ]}
              onPress={() => handleSave(outfit, index)}
              disabled={savingIndex === index}
            >
              <Text style={styles.saveBtnText}>
                {savingIndex === index ? "Saving..." : "Save Outfit"}
              </Text>
            </Pressable>
          </View>
        ))
      )}
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    marginBottom: spacing.md,
    alignSelf: "flex-start",
  },
  backText: {
    ...typography.body,
    color: colors.buttonPrimary,
    fontWeight: "600",
  },
  title: {
    ...typography.titleLarge,
    color: colors.darkText,
    marginBottom: spacing.lg,
  },
  refreshRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  refreshInfo: {
    ...typography.caption,
    color: colors.mutedText,
    flex: 1,
    marginRight: spacing.md,
  },
  refreshBtn: {
    backgroundColor: colors.buttonPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  refreshDisabled: {
    backgroundColor: "#C4B9B0",
  },
  refreshBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxxl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: "center",
  },
  outfitCard: {
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
  outfitTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: spacing.xs,
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
  matchText: {
    ...typography.caption,
    color: colors.buttonPrimary,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
});
