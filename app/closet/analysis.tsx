import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import AppScreenWrapper from "../../components/layout/AppScreenWrapper";
import { db } from "../../firebaseConfig";

type ClosetItem = {
  id: string;
  userId?: string;
  category?: string;
  color?: string;
  occasion?: string;
  occasions?: string[];
  season?: string;
  seasons?: string[];
};

type GapItem = {
  title: string;
  reason: string;
};

const CATEGORY_ORDER = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Shoes",
  "Outerwear",
  "Accessories",
];

function normalizeCategory(category?: string) {
  if (!category) return "Other";

  const c = category.toLowerCase();

  if (c.includes("top")) return "Tops";
  if (c.includes("bottom") || c.includes("pant") || c.includes("jean"))
    return "Bottoms";
  if (c.includes("dress")) return "Dresses";
  if (c.includes("shoe") || c.includes("sneaker") || c.includes("heel"))
    return "Shoes";
  if (c.includes("jacket") || c.includes("coat")) return "Outerwear";
  if (
    c.includes("accessory") ||
    c.includes("bag") ||
    c.includes("belt") ||
    c.includes("jewelry")
  )
    return "Accessories";

  return category;
}

function buildGapAnalysis(
  categoryCounts: Record<string, number>,
  items: ClosetItem[],
) {
  const gaps: GapItem[] = [];

  const tops = categoryCounts["Tops"] || 0;
  const bottoms = categoryCounts["Bottoms"] || 0;
  const shoes = categoryCounts["Shoes"] || 0;
  const outerwear = categoryCounts["Outerwear"] || 0;
  const accessories = categoryCounts["Accessories"] || 0;
  const dresses = categoryCounts["Dresses"] || 0;

  const colors = items.map((i) => i.color?.toLowerCase()).filter(Boolean);

  const neutralColors = ["black", "white", "beige", "gray", "brown"];
  const neutralCount = colors.filter((c) =>
    neutralColors.includes(c || ""),
  ).length;

  const uniqueColors = new Set(colors).size;

  // =========================
  // CORE ESSENTIALS
  // =========================

  if (tops === 0) {
    gaps.push({
      title: "Basic White Tee",
      reason:
        "Your closet is missing tops. A white tee is a foundational piece that works with nearly every outfit.",
    });
  }

  if (bottoms === 0) {
    gaps.push({
      title: "Neutral Pants (Beige or Black)",
      reason:
        "You do not have any bottoms. Neutral pants allow you to create multiple outfit combinations easily.",
    });
  }

  if (shoes === 0) {
    gaps.push({
      title: "Everyday Shoes",
      reason:
        "Shoes complete every outfit. A versatile pair like sneakers or loafers is essential.",
    });
  }

  if (outerwear === 0) {
    gaps.push({
      title: "Light Jacket",
      reason:
        "Layering is important for style and weather. A jacket adds structure and versatility.",
    });
  }

  if (accessories === 0) {
    gaps.push({
      title: "Accessories (Bag, Belt, Jewelry)",
      reason:
        "Accessories elevate outfits from basic to styled. Even one accessory can change a look.",
    });
  }

  // =========================
  // BALANCE RULES
  // =========================

  if (tops > 0 && tops < 3) {
    gaps.push({
      title: "More Tops",
      reason:
        "You have a limited number of tops. Adding more will increase outfit combinations.",
    });
  }

  if (bottoms > 0 && bottoms < 2) {
    gaps.push({
      title: "Second Bottom Option",
      reason:
        "Having only one bottom limits outfit variety. Adding another improves flexibility.",
    });
  }

  if (shoes === 1) {
    gaps.push({
      title: "Second Pair of Shoes",
      reason:
        "Having only one pair of shoes restricts styling options. A second pair adds versatility.",
    });
  }

  // =========================
  // VARIETY RULES
  // =========================

  if (tops > 0 && bottoms > 0 && dresses === 0) {
    gaps.push({
      title: "Versatile Dress",
      reason:
        "A dress provides an easy one-piece outfit option and adds variety to your wardrobe.",
    });
  }

  // =========================
  // COLOR ANALYSIS
  // =========================

  if (colors.length > 0 && neutralCount / colors.length < 0.3) {
    gaps.push({
      title: "Neutral Basics",
      reason:
        "Your wardrobe lacks neutral colors. Neutrals help balance outfits and make styling easier.",
    });
  }

  if (uniqueColors <= 2 && colors.length > 3) {
    gaps.push({
      title: "More Color Variety",
      reason:
        "Your wardrobe is dominated by very few colors. Adding variety can make outfits more interesting.",
    });
  }

  // =========================
  // STYLE DEPTH
  // =========================

  if (items.length >= 6 && accessories < 2) {
    gaps.push({
      title: "Statement Accessories",
      reason:
        "As your wardrobe grows, accessories become important for styling and finishing outfits.",
    });
  }

  if (items.length >= 8 && outerwear < 2) {
    gaps.push({
      title: "Additional Outerwear",
      reason:
        "Having multiple outerwear options allows you to style outfits for different seasons and occasions.",
    });
  }

  return gaps;
}

export default function ClosetAnalysisScreen() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const router = useRouter();

  const loadItems = async () => {
    const user = getAuth().currentUser;
    if (!user) return;

    const q = query(
      collection(db, "closetItems"),
      where("userId", "==", user.uid),
    );

    const snapshot = await getDocs(q);

    const userItems = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ClosetItem, "id">),
    }));

    setItems(userItems);
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, []),
  );

  const totalItems = items.length;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    items.forEach((item) => {
      const cat = normalizeCategory(item.category);

      counts[cat] = (counts[cat] || 0) + 1;
    });

    return counts;
  }, [items]);

  const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const most = sorted[0]?.[0] || "—";
  const least = sorted[sorted.length - 1]?.[0] || "—";

  const gapItems = useMemo(() => {
    return buildGapAnalysis(categoryCounts, items);
  }, [categoryCounts, items]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/closet");
  };

  return (
    <AppScreenWrapper>
      <View style={styles.headerRow}>
        <Pressable onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#8B1E1E" />
        </Pressable>
        <Text style={styles.title}>Closet Analysis</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total Items</Text>
        <Text style={styles.value}>{totalItems}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Items per Category</Text>
        {Object.entries(categoryCounts).map(([cat, count]) => (
          <View key={cat} style={styles.row}>
            <Text>{cat}</Text>
            <Text>{count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Insights</Text>
        <Text>Most: {most}</Text>
        <Text>Least: {least}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Gap Analysis</Text>

        {gapItems.length > 0 ? (
          gapItems.map((gap) => (
            <View key={gap.title} style={styles.gapBox}>
              <Text style={styles.gapTitle}>{gap.title}</Text>
              <Text style={styles.gapText}>{gap.reason}</Text>
            </View>
          ))
        ) : (
          <Text>Your wardrobe is well balanced.</Text>
        )}
      </View>
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  label: { fontWeight: "600", marginBottom: 8 },
  value: { fontSize: 28, fontWeight: "700", color: "#8B1E1E" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  gapBox: {
    backgroundColor: "#F5F1ED",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  gapTitle: { fontWeight: "700", color: "#8B1E1E" },
  gapText: { fontSize: 13, color: "#555" },
});
