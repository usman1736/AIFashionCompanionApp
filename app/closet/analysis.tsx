import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import AppScreenWrapper from "../../components/layout/AppScreenWrapper";
import { db } from "../../firebaseConfig";

export default function ClosetAnalysisScreen() {
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();

  // 🔥 LOAD USER ITEMS
  const loadItems = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const snapshot = await getDocs(collection(db, "closetItems"));

      const userItems = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((item: any) => item.userId === user.uid);

      setItems(userItems);
    } catch (error) {
      console.log("ERROR:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, []),
  );

  // 📊 TOTAL
  const totalItems = items.length;

  // 🔥 DYNAMIC CATEGORY COUNTS
  const categoryCounts: Record<string, number> = {};

  items.forEach((item) => {
    const cat = item.category || "Other";

    if (categoryCounts[cat]) {
      categoryCounts[cat]++;
    } else {
      categoryCounts[cat] = 1;
    }
  });

  // 🔥 INSIGHTS
  const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  const most = sorted[0]?.[0] || "—";
  const least = sorted[sorted.length - 1]?.[0] || "—";

  // 🔙 BACK
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/closet");
    }
  };

  return (
    <AppScreenWrapper>
      <View style={styles.headerRow}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#8B1E1E" />
        </Pressable>
        <Text style={styles.title}>Closet Analysis</Text>
      </View>

      {/* TOTAL */}
      <View style={styles.card}>
        <Text style={styles.label}>Total Items</Text>
        <Text style={styles.value}>{totalItems}</Text>
      </View>

      {/* CATEGORY */}
      <View style={styles.card}>
        <Text style={styles.label}>Items per Category</Text>

        {Object.entries(categoryCounts).map(([category, count]) => (
          <View key={category} style={styles.row}>
            <Text style={styles.stat}>{category}</Text>
            <Text style={styles.statValue}>{count}</Text>
          </View>
        ))}

        {Object.keys(categoryCounts).length === 0 && (
          <Text style={styles.stat}>No items yet</Text>
        )}
      </View>

      {/* INSIGHTS */}
      <View style={styles.card}>
        <Text style={styles.label}>Insights</Text>
        <Text style={styles.stat}>Most items: {most}</Text>
        <Text style={styles.stat}>Least items: {least}</Text>
      </View>
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  value: {
    fontSize: 32,
    fontWeight: "700",
    color: "#8B1E1E",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  stat: {
    fontSize: 14,
    color: "#555",
  },

  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
