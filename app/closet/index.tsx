import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function ClosetScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const router = useRouter();

  // 🔥 FIXED LOAD (USER FILTER)
  const loadItems = async () => {
    try {
      const user = getAuth().currentUser;

      const snapshot = await getDocs(collection(db, "closetItems"));

      const userItems = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((item: any) => item.userId === user?.uid); //  KEY FIX

      setItems(userItems);
    } catch (error) {
      console.log("FETCH ERROR:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, []),
  );

  // 🔙 BACK
  const handleBack = () => {
    router.replace("/home"); //  ALWAYS go home
  };

  // 🗑 DELETE
  const handleDelete = (id: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "closetItems", id)); //  direct delete
          loadItems();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Back */}
      <Pressable onPress={handleBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {/* Title */}
      <Text style={styles.title}>My Closet</Text>
      <Text style={styles.subtitle}>Manage your wardrobe</Text>

      {/* CATEGORY TABS */}
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

      {/* ADD BUTTON */}
      <Pressable
        style={styles.addButton}
        onPress={() => router.push("/closet/add-item")}
      >
        <Text style={styles.addButtonText}>+ Add Item</Text>
      </Pressable>

      {/* ANALYSIS BUTTON */}
      <Pressable
        style={styles.analysisButton}
        onPress={() => router.push("/closet/analysis")}
      >
        <Text style={styles.analysisText}>View Closet Analysis</Text>
      </Pressable>

      {/* ITEMS */}
      {items.length === 0 ? (
        <Text style={styles.empty}>No items yet</Text>
      ) : (
        <FlatList
          data={
            selectedCategory === "All"
              ? items
              : items.filter((i) => i.category === selectedCategory)
          }
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onLongPress={() => handleDelete(item.id)}
            >
              {/*  IMAGE FIX */}
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder} />
              )}

              {/* CATEGORY */}
              <Text style={styles.category}>{item.category}</Text>

              {/* COLOR */}
              <View style={styles.colorRow}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: item.color?.toLowerCase() },
                  ]}
                />
                <Text style={styles.colorText}>{item.color}</Text>
              </View>

              {/* EXTRA INFO */}
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
    paddingTop: 50,
    backgroundColor: "#F5F5F5",
  },

  backBtn: {
    marginBottom: 10,
  },

  backText: {
    fontSize: 16,
    color: "#8B1E1E",
    fontWeight: "600",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  subtitle: {
    color: "#888",
    marginBottom: 15,
  },

  tabsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#eee",
    borderRadius: 20,
  },

  tabActive: {
    backgroundColor: "#8B1E1E",
  },

  tabText: {
    color: "#333",
  },

  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  addButton: {
    backgroundColor: "#8B1E1E",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  analysisButton: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },

  analysisText: {
    color: "#8B1E1E",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    marginTop: 50,
    color: "#888",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  image: {
    height: 110,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: "cover",
  },

  imagePlaceholder: {
    height: 110,
    borderRadius: 12,
    backgroundColor: "#EFEFEF",
    marginBottom: 10,
  },

  category: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 5,
  },

  colorRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    opacity: 0.8,
  },

  colorText: {
    fontSize: 13,
    color: "#666",
  },

  info: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  hint: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 5,
  },
});
