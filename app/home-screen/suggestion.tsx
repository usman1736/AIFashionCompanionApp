import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

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
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

type RefreshData = {
  count: number;
  cooldownStartedAt: number | null;
};

function getDefaultRefreshData(): RefreshData {
  return {
    count: 0,
    cooldownStartedAt: null,
  };
}

function getTimeLeftFromCooldown(startedAt: number | null) {
  if (!startedAt) return 0;
  const resetTime = startedAt + COOLDOWN_MS;
  return resetTime - Date.now();
}

function getImage(item: ClosetItem) {
  return item.imageUrl || item.image || "";
}

function getOccasion(item: ClosetItem) {
  if (Array.isArray(item.occasions) && item.occasions.length > 0) {
    return item.occasions[0];
  }
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
      top: tops.length > 0 ? tops[i % tops.length] : null,
      bottom: bottoms.length > 0 ? bottoms[i % bottoms.length] : null,
      shoes: shoes.length > 0 ? shoes[i % shoes.length] : null,
      occasion: tops.length > 0 ? getOccasion(tops[i % tops.length]) : "Casual",
    });
  }

  return outfits;
}

function calculateMatch(outfit: Outfit): number {
  const pieces = [outfit.top, outfit.bottom, outfit.shoes].filter(Boolean);
  if (pieces.length === 0) return 0;

  const colorList = pieces
    .map((piece) => piece?.color?.toLowerCase())
    .filter(Boolean) as string[];

  const uniqueColors = new Set(colorList).size;

  if (uniqueColors === 1) return 95;
  if (uniqueColors === 2) return 80;
  return 65;
}

function formatTimeLeft(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;
}

export default function SuggestionsScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const storageKey = useMemo(() => {
    return user?.uid ? `outfit_refresh_data_${user.uid}` : null;
  }, [user?.uid]);

  const [items, setItems] = useState<ClosetItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState("24:00:00");

  useEffect(() => {
    if (!storageKey) return;
    loadRefreshData();
    fetchItems();
  }, [storageKey]);

  useEffect(() => {
    if (!limitReached || !storageKey) return;

    const interval = setInterval(async () => {
      const raw = await AsyncStorage.getItem(storageKey);
      const parsed = raw
        ? (JSON.parse(raw) as RefreshData)
        : getDefaultRefreshData();
      const timeLeft = getTimeLeftFromCooldown(parsed.cooldownStartedAt);

      if (timeLeft <= 0) {
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(getDefaultRefreshData()),
        );
        setRefreshCount(0);
        setLimitReached(false);
        setCountdown("24:00:00");
        return;
      }

      setCountdown(formatTimeLeft(timeLeft));
    }, 1000);

    return () => clearInterval(interval);
  }, [limitReached, storageKey]);

  const loadRefreshData = async () => {
    if (!storageKey) return;

    try {
      const raw = await AsyncStorage.getItem(storageKey);

      if (!raw) {
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(getDefaultRefreshData()),
        );
        setRefreshCount(0);
        setLimitReached(false);
        setCountdown("24:00:00");
        return;
      }

      const parsed = JSON.parse(raw) as RefreshData;
      const count = Number(parsed?.count || 0);
      const cooldownStartedAt = parsed?.cooldownStartedAt || null;

      if (count >= MAX_REFRESHES) {
        const timeLeft = getTimeLeftFromCooldown(cooldownStartedAt);

        if (timeLeft <= 0) {
          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify(getDefaultRefreshData()),
          );
          setRefreshCount(0);
          setLimitReached(false);
          setCountdown("24:00:00");
        } else {
          setRefreshCount(count);
          setLimitReached(true);
          setCountdown(formatTimeLeft(timeLeft));
        }
      } else {
        setRefreshCount(count);
        setLimitReached(false);
        setCountdown("24:00:00");
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
    if (!storageKey) return;

    const raw = await AsyncStorage.getItem(storageKey);
    let parsed: RefreshData = raw ? JSON.parse(raw) : getDefaultRefreshData();

    if (parsed.count >= MAX_REFRESHES) {
      const timeLeft = getTimeLeftFromCooldown(parsed.cooldownStartedAt);

      if (timeLeft <= 0) {
        parsed = getDefaultRefreshData();
        await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
        setRefreshCount(0);
        setLimitReached(false);
        setCountdown("24:00:00");
      } else {
        setRefreshCount(parsed.count);
        setLimitReached(true);
        setCountdown(formatTimeLeft(timeLeft));
        Alert.alert(
          "Limit Reached",
          "You have used all 5 refreshes for today.",
        );
        return;
      }
    }

    const newCount = parsed.count + 1;
    const updatedData: RefreshData = {
      count: newCount,
      cooldownStartedAt:
        newCount >= MAX_REFRESHES
          ? parsed.cooldownStartedAt || Date.now()
          : null,
    };

    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedData));

    setRefreshCount(newCount);

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setOutfits(buildOutfits(shuffled));

    if (newCount >= MAX_REFRESHES) {
      setLimitReached(true);
      setCountdown("24:00:00");
    } else {
      setLimitReached(false);
      setCountdown("24:00:00");
    }
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
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.buttonPrimary} />
        </Pressable>
        <Text style={styles.title}>Outfit Suggestions</Text>
      </View>

      <View style={styles.refreshRow}>
        <Text style={styles.refreshInfo}>
          {limitReached
            ? "⚠️ Limit reached"
            : `🔄 ${MAX_REFRESHES - refreshCount} refreshes left today`}
        </Text>

        <Pressable
          style={[styles.refreshBtn, limitReached && styles.refreshDisabled]}
          onPress={handleRefresh}
        >
          <Text style={styles.refreshBtnText}>
            {limitReached ? "Refresh Locked" : "Refresh"}
          </Text>
        </Pressable>
      </View>

      {limitReached && (
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>You can generate again in</Text>
          <Text style={styles.timerText}>{countdown}</Text>
        </View>
      )}

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
            <Text style={styles.matchText}>
              🎯 {calculateMatch(outfit)}% Match
            </Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backBtn: {
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
    marginBottom: spacing.lg,
  },
  refreshRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
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
  timerCard: {
    backgroundColor: "#F7F1ED",
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  timerLabel: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  timerText: {
    color: colors.buttonPrimary,
    fontSize: 28,
    fontWeight: "800",
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
