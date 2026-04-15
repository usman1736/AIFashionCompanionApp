import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth } from "../../firebaseConfig";
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
};

export default function OutfitScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const { topId, bottomId, shoesId, accessoryId } = useLocalSearchParams<{
    topId?: string;
    bottomId?: string;
    shoesId?: string;
    accessoryId?: string;
  }>();
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wornToday, setWornToday] = useState(false);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchItems = async () => {
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
      setLoading(false);
    };
    fetchItems();
  }, [user]);

  const selectedIds = [topId, bottomId, shoesId, accessoryId].filter(Boolean);
  const outfit = selectedIds.length > 0
    ? selectedIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as ClosetItem[]
    : items.filter((i) => ["tops", "bottoms", "shoes"].includes(i.category?.toLowerCase() ?? "")).slice(0, 3);

  const getImage = (item: ClosetItem) => item.imageUrl || item.image || "";

  const getOccasion = (item: ClosetItem) => {
    if (Array.isArray(item.occasions) && item.occasions.length > 0)
      return item.occasions.join(", ");
    return item.occasion || "—";
  };

const handleWearThis = async () => {
    if (!user || outfit.length === 0) return;
    setLogging(true);
    try {
      await addDoc(collection(db, "wornOutfits"), {
        userId: user.uid,
        date: new Date().toDateString(),
        wornAt: new Date(),
        pieces: outfit.map((item) => ({
          id: item.id,
          category: item.category || "",
          color: item.color || "",
        })),
      });
      setWornToday(true);
      Alert.alert("Nice!", "Outfit logged as worn today ✅");
    } catch (e) {
      Alert.alert("Error", "Could not log outfit.");
    } finally {
      setLogging(false);
    }
  };



  return (
    <AppScreenWrapper>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.buttonPrimary} />
        </Pressable>
        <Text style={styles.title}>Today's Outfit</Text>
      </View>
      <Text style={styles.sub}>Picked from your wardrobe</Text>

      {loading ? (
        <ActivityIndicator
          color={colors.buttonPrimary}
          style={{ marginTop: 40 }}
        />
      ) : outfit.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No items in your closet yet. Add some clothes first!
          </Text>
        </View>
      ) : (
        outfit.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            {getImage(item) ? (
              <Image source={{ uri: getImage(item) }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.detail}>Color: {item.color || "—"}</Text>
              <Text style={styles.detail}>Occasion: {getOccasion(item)}</Text>
            </View>
          </View>
        ))
      )}

{outfit.length > 0 && (
        <Pressable
          style={[styles.wearBtn, wornToday && styles.wearBtnDone]}
          onPress={handleWearThis}
          disabled={wornToday || logging}
        >
          <Text style={styles.wearBtnText}>
            {wornToday ? "✅ Worn Today" : logging ? "Logging..." : "👕 Wear This"}
          </Text>
        </Pressable>
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
    marginBottom: spacing.xs,
  },
  sub: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.xxl,
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
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    marginRight: spacing.md,
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    backgroundColor: "#ECE7E3",
    marginRight: spacing.md,
  },
  itemInfo: { flex: 1 },
  category: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: spacing.xs,
    textTransform: "capitalize",
  },
  detail: {
    ...typography.caption,
    color: colors.mutedText,
    marginBottom: spacing.xs,
    textTransform: "capitalize",
  },
wearBtn: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  wearBtnDone: {
    backgroundColor: "#C4B9B0",
  },
  wearBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },

});
