import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
  const user = getAuth().currentUser;
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const top = items.find((i) => i.category?.toLowerCase() === "tops");
  const bottom = items.find((i) => i.category?.toLowerCase() === "bottoms");
  const shoes = items.find((i) => i.category?.toLowerCase() === "shoes");
  const outfit = [top, bottom, shoes].filter(Boolean) as ClosetItem[];

  const getImage = (item: ClosetItem) => item.imageUrl || item.image || "";

  const getOccasion = (item: ClosetItem) => {
    if (Array.isArray(item.occasions) && item.occasions.length > 0)
      return item.occasions.join(", ");
    return item.occasion || "—";
  };

  return (
    <AppScreenWrapper>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Today's Outfit</Text>
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
});
