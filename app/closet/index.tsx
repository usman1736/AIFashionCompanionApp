import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import AppScreenWrapper from "../../components/layout/AppScreenWrapper";

import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { deleteObject, getStorage, ref as storageRef } from "firebase/storage";
import { db } from "../../firebaseConfig";

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
};

const CATEGORY_TABS = [
  "All",
  "Tops",
  "Bottoms",
  "Dresses",
  "Shoes",
  "Outerwear",
  "Accessories",
] as const;

function getDisplayImage(item: ClosetItem) {
  return item.imageUrl || item.image || "";
}

function getDisplayOccasion(item: ClosetItem) {
  if (Array.isArray(item.occasions) && item.occasions.length > 0) {
    return item.occasions.join(", ");
  }

  return item.occasion || "—";
}

function getDisplaySeason(item: ClosetItem) {
  if (Array.isArray(item.seasons) && item.seasons.length > 0) {
    return item.seasons.join(", ");
  }

  return item.season || "—";
}

export default function ClosetScreen() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof CATEGORY_TABS)[number]>("All");
  const router = useRouter();

  const loadItems = async () => {
    try {
      const user = getAuth().currentUser;

      if (!user) {
        setItems([]);
        return;
      }

      const q = query(
        collection(db, "closetItems"),
        where("userId", "==", user.uid),
      );

      const snapshot = await getDocs(q);

      const userItems: ClosetItem[] = snapshot.docs.map((itemDoc) => ({
        id: itemDoc.id,
        ...(itemDoc.data() as Omit<ClosetItem, "id">),
      }));

      setItems(userItems);
    } catch (error) {
      console.log("FETCH ERROR:", error);
      Alert.alert("Error", "Could not load closet items.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, []),
  );

  const handleDelete = (item: ClosetItem) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "closetItems", item.id));

            if (item.imagePath) {
              try {
                const storage = getStorage();
                await deleteObject(storageRef(storage, item.imagePath));
              } catch (storageError) {
                console.log("STORAGE DELETE WARNING:", storageError);
              }
            }

            loadItems();
          } catch (error) {
            console.log("DELETE ERROR:", error);
            Alert.alert("Error", "Could not delete item.");
          }
        },
      },
    ]);
  };

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  const getSafeColor = (color?: string) => {
    if (!color) return "#D9D9D9";

    return color.toLowerCase();
  };

  return (
    <AppScreenWrapper>
      <Text style={styles.title}>My Closet</Text>
      <Text style={styles.subtitle}>Manage your wardrobe</Text>

      <View style={styles.tabsRow}>
        {CATEGORY_TABS.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.tab, selectedCategory === cat && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory === cat && styles.tabTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.addButton}
        onPress={() => router.push("/closet/add-item")}
      >
        <Text style={styles.addButtonText}>+ Add Item</Text>
      </Pressable>

      <Pressable
        style={styles.analysisButton}
        onPress={() => router.push("/closet/analysis")}
      >
        <Text style={styles.analysisText}>View Closet Analysis</Text>
      </Pressable>

      {filteredItems.length === 0 ? (
        <Text style={styles.empty}>✨ Your closet is empty</Text>
      ) : (
        <View style={styles.grid}>
          {filteredItems.map((item) => {
            const imageUri = getDisplayImage(item);
            return (
              <Pressable
                key={item.id}
                style={styles.card}
                onLongPress={() => handleDelete(item)}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
                <Text style={styles.category}>{item.category || "Item"}</Text>
                <View style={styles.colorRow}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: getSafeColor(item.color) },
                    ]}
                  />
                  <Text style={styles.colorText}>
                    {item.color || "No color"}
                  </Text>
                </View>
                <Text style={styles.info}>
                  Occasion: {getDisplayOccasion(item)}
                </Text>
                <Text style={styles.info}>
                  Season: {getDisplaySeason(item)}
                </Text>
                {item.brand ? (
                  <Text style={styles.info}>Brand: {item.brand}</Text>
                ) : null}
                <Text style={styles.hint}>Hold to delete</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#777",
    marginBottom: 20,
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#e8e3de",
  },
  tabActive: {
    backgroundColor: "#8B1E1E",
  },
  tabText: {
    color: "#333",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#8B1E1E",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  analysisButton: {
    backgroundColor: "#ebe7e2",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  analysisText: {
    color: "#5c5047",
    fontWeight: "600",
  },
  empty: {
    marginTop: 40,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 16,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    backgroundColor: "#ece7e3",
    marginBottom: 10,
  },
  category: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1f2937",
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  colorText: {
    color: "#374151",
    fontSize: 13,
  },
  info: {
    color: "#4b5563",
    fontSize: 12,
    marginBottom: 4,
  },
  hint: {
    marginTop: 8,
    color: "#9ca3af",
    fontSize: 11,
  },
});
