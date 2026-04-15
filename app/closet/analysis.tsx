import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import AppScreenWrapper from "../../components/layout/AppScreenWrapper";

export default function ClosetAnalysisScreen() {
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();

  // 🔥 FIXED LOAD (USER FILTER)
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
        .filter((item: any) => item.userId === user.uid); // 🔥 FIX

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

  // 📊 STATS
  const totalItems = items.length;

  const tops = items.filter((i) => i.category === "Tops").length;
  const bottoms = items.filter((i) => i.category === "Bottoms").length;
  const shoes = items.filter((i) => i.category === "Shoes").length;

  const most =
    tops >= bottoms && tops >= shoes
      ? "Tops"
      : bottoms >= shoes
        ? "Bottoms"
        : "Shoes";

  const least =
    tops <= bottoms && tops <= shoes
      ? "Tops"
      : bottoms <= shoes
        ? "Bottoms"
        : "Shoes";

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

        <View style={styles.row}>
          <Text style={styles.stat}>Tops</Text>
          <Text style={styles.statValue}>{tops}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.stat}>Bottoms</Text>
          <Text style={styles.statValue}>{bottoms}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.stat}>Shoes</Text>
          <Text style={styles.statValue}>{shoes}</Text>
        </View>
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
