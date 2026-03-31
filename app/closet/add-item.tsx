import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { getAuth } from "firebase/auth"; //  ADDED
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function AddItemScreen() {
  const router = useRouter();

  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [brand, setBrand] = useState("");

  const [showPicker, setShowPicker] = useState(false);

  // 🔙 SAFE BACK BUTTON
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/closet");
    }
  };

  // 📷 PICK IMAGE
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 💾 SAVE (🔥 FIXED WITH USER ID)
  const handleSave = async () => {
    if (!category || !color || !occasion || !season) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      const user = getAuth().currentUser; //  GET USER

      await addDoc(collection(db, "closetItems"), {
        category,
        color,
        occasion,
        season,
        brand: brand || "",
        image: image || "",
        userId: user?.uid, // 🔥 CRITICAL FIX
        createdAt: new Date(),
      });

      Alert.alert("Saved!");
      router.replace("/closet");
    } catch (error) {
      console.log(error);
      Alert.alert("Error saving item");
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔙 BACK */}
      <Pressable onPress={handleBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Add Item</Text>

      {/* IMAGE */}
      <Pressable style={styles.imageBox} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={{ color: "#888" }}>Tap to add image</Text>
        )}
      </Pressable>

      {/* CATEGORY */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {["Tops", "Bottoms", "Shoes"].map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, category === c && styles.active]}
            onPress={() => setCategory(c)}
          >
            <Text style={category === c ? styles.activeText : {}}>{c}</Text>
          </Pressable>
        ))}
      </View>

      {/* COLOR */}
      <Text style={styles.label}>Color</Text>
      <View style={styles.row}>
        {["red", "blue", "pink", "black"].map((c) => (
          <Pressable
            key={c}
            style={[
              styles.color,
              { backgroundColor: c },
              color === c && styles.selected,
            ]}
            onPress={() => setColor(c)}
          />
        ))}

        <Pressable style={styles.addColor} onPress={() => setShowPicker(true)}>
          <Text style={{ fontSize: 18 }}>+</Text>
        </Pressable>
      </View>

      {/* OCCASION */}
      <Text style={styles.label}>Occasion</Text>
      <View style={styles.row}>
        {["Casual", "Formal", "Gym"].map((o) => (
          <Pressable
            key={o}
            style={[styles.chip, occasion === o && styles.active]}
            onPress={() => setOccasion(o)}
          >
            <Text style={occasion === o ? styles.activeText : {}}>{o}</Text>
          </Pressable>
        ))}
      </View>

      {/* SEASON */}
      <Text style={styles.label}>Season</Text>
      <View style={styles.row}>
        {["Summer", "Winter", "Fall"].map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, season === s && styles.active]}
            onPress={() => setSeason(s)}
          >
            <Text style={season === s ? styles.activeText : {}}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {/* BRAND */}
      <Text style={styles.label}>Brand (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter brand"
        value={brand}
        onChangeText={setBrand}
      />

      {/* SAVE */}
      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Item</Text>
      </Pressable>

      {/* COLOR PICKER */}
      <Modal visible={showPicker} animationType="slide">
        <View style={styles.modal}>
          {[
            "#ef4444",
            "#3b82f6",
            "#10b981",
            "#ec4899",
            "#000000",
            "#facc15",
            "#9333ea",
          ].map((c) => (
            <Pressable
              key={c}
              style={[styles.color, { backgroundColor: c }]}
              onPress={() => {
                setColor(c);
                setShowPicker(false);
              }}
            />
          ))}

          <Pressable onPress={() => setShowPicker(false)}>
            <Text style={{ marginTop: 20, color: "#8B1E1E" }}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#F5F5F5",
  },

  backBtn: { marginBottom: 10 },

  backText: {
    fontSize: 16,
    color: "#8B1E1E",
    fontWeight: "600",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },

  imageBox: {
    height: 150,
    backgroundColor: "#eee",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  image: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },

  label: {
    marginBottom: 5,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#eee",
  },

  active: {
    backgroundColor: "#8B1E1E",
  },

  activeText: {
    color: "#fff",
  },

  color: {
    width: 35,
    height: 35,
    borderRadius: 20,
  },

  selected: {
    borderWidth: 2,
    borderColor: "#000",
  },

  addColor: {
    width: 35,
    height: 35,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#8B1E1E",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
});
