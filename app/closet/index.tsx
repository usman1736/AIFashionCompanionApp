import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

type ClosetItem = {
  id: string;
  userId?: string;
  image?: string;
  category?: string;
  color?: string;
  occasion?: string;
  season?: string;
  brand?: string;
};

export default function ClosetScreen() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  const handleBack = () => {
    router.replace("/home");
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "closetItems", id));
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
    <View style={styles.container}>
      <Pressable onPress={handleBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>My Closet</Text>
      <Text style={styles.subtitle}>Manage your wardrobe</Text>

      <View style={styles.tabsRow}>
        {["All", "Tops", "Bottoms", "Shoes"].map((cat) => (
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
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onLongPress={() => handleDelete(item.id)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
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
                <Text style={styles.colorText}>{item.color || "No color"}</Text>
              </View>

              <Text style={styles.info}>Occasion: {item.occasion || "—"}</Text>

              <Text style={styles.info}>Season: {item.season || "—"}</Text>

              {item.brand ? (
                <Text style={styles.info}>Brand: {item.brand}</Text>
              ) : null}

              <Text style={styles.hint}>Hold to delete</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: "#F6F4F2",
  },

  backBtn: {
    marginBottom: 10,
    alignSelf: "flex-start",
  },

  backText: {
    fontSize: 16,
    color: "#8B1E1E",
    fontWeight: "600",
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
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "#EDEBE9",
    borderRadius: 25,
  },

  tabActive: {
    backgroundColor: "#8B1E1E",
  },

  tabText: {
    color: "#444",
    fontSize: 13,
  },

  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  addButton: {
    backgroundColor: "#8B1E1E",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#8B1E1E",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  analysisButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#ECECEC",
    alignItems: "center",
  },

  analysisText: {
    color: "#8B1E1E",
    fontWeight: "600",
    fontSize: 15,
  },

  empty: {
    textAlign: "center",
    marginTop: 80,
    color: "#999",
    fontSize: 15,
  },

  listContent: {
    paddingBottom: 40,
  },

  columnWrapper: {
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  image: {
    width: "100%",
    height: 110,
    borderRadius: 14,
    marginBottom: 10,
    resizeMode: "cover",
  },

  imagePlaceholder: {
    width: "100%",
    height: 110,
    borderRadius: 14,
    backgroundColor: "#EFEFEF",
    marginBottom: 10,
  },

  category: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 4,
  },

  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },

  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },

  colorText: {
    fontSize: 12,
    color: "#666",
  },

  info: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },

  hint: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 5,
  },
});
