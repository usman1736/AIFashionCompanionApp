import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { db } from "../../firebaseConfig";

const CATEGORY_OPTIONS = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Shoes",
  "Outerwear",
  "Accessories",
] as const;

const OCCASION_OPTIONS = [
  "Work",
  "Casual",
  "Date Night",
  "Evening",
  "Travel",
] as const;

const SEASON_OPTIONS = [
  "Spring",
  "Summer",
  "Fall",
  "Winter",
  "All-Season",
] as const;

const QUICK_COLORS = [
  "red",
  "blue",
  "pink",
  "black",
  "white",
  "beige",
] as const;

async function compressImageForUpload(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    {
      compress: 0.72,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: false,
    },
  );

  return result.uri;
}

async function uploadClosetImage(userId: string, localUri: string) {
  const storage = getStorage();
  const optimizedUri = await compressImageForUpload(localUri);

  const response = await fetch(optimizedUri);
  const blob = await response.blob();

  const path = `closetItems/${userId}/${Date.now()}.jpg`;
  const imageRef = storageRef(storage, path);

  await uploadBytes(imageRef, blob, {
    contentType: "image/jpeg",
  });

  const downloadURL = await getDownloadURL(imageRef);

  return {
    imageUrl: downloadURL,
    imagePath: path,
  };
}

export default function AddItemScreen() {
  const router = useRouter();

  const [category, setCategory] = useState<
    (typeof CATEGORY_OPTIONS)[number] | ""
  >("");
  const [color, setColor] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [occasion, setOccasion] = useState<
    (typeof OCCASION_OPTIONS)[number] | ""
  >("");
  const [season, setSeason] = useState<(typeof SEASON_OPTIONS)[number] | "">(
    "",
  );
  const [brand, setBrand] = useState("");

  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveDisabled = useMemo(
    () => !category || !color || !occasion || !season || !image || saving,
    [category, color, occasion, season, image, saving],
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/closet");
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo library access to add a closet item.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!category || !color || !occasion || !season || !image) {
      Alert.alert(
        "Error",
        "Please fill every required field and add an image.",
      );
      return;
    }

    const user = getAuth().currentUser;

    if (!user) {
      Alert.alert("Error", "You need to be logged in.");
      return;
    }

    setSaving(true);

    try {
      const uploadedImage = await uploadClosetImage(user.uid, image);

      await addDoc(collection(db, "closetItems"), {
        userId: user.uid,
        category,
        color,
        occasion,
        occasions: [occasion],
        season,
        seasons: [season],
        brand: brand.trim() || "",
        image: uploadedImage.imageUrl,
        imageUrl: uploadedImage.imageUrl,
        imagePath: uploadedImage.imagePath,
        wearCount: 0,
        createdAt: serverTimestamp(),
        dateAdded: serverTimestamp(),
      });

      Alert.alert("Saved!", "Your closet item was added.");
      router.replace("/closet");
    } catch (error) {
      console.log("SAVE ITEM ERROR:", error);
      Alert.alert("Error", "Could not save this item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={handleBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Add Item</Text>
      <Text style={styles.subtitle}>
        Upload and tag a piece from your closet
      </Text>

      <Pressable style={styles.imageBox} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imageEmptyWrap}>
            <Text style={styles.imageEmptyTitle}>Tap to add image</Text>
            <Text style={styles.imageEmptySubtitle}>
              Upload a clear photo of the item
            </Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.label}>Category</Text>
      <View style={styles.wrapRow}>
        {CATEGORY_OPTIONS.map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, category === item && styles.activeChip]}
            onPress={() => setCategory(item)}
          >
            <Text
              style={[
                styles.chipText,
                category === item && styles.activeChipText,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Color</Text>
      <View style={styles.row}>
        {QUICK_COLORS.map((item) => (
          <Pressable
            key={item}
            style={[
              styles.color,
              { backgroundColor: item },
              color === item && styles.selectedColor,
            ]}
            onPress={() => setColor(item)}
          />
        ))}

        <Pressable style={styles.addColor} onPress={() => setShowPicker(true)}>
          <Text style={styles.addColorText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Selected Color</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter or confirm the color"
        value={color}
        onChangeText={setColor}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Occasion</Text>
      <View style={styles.wrapRow}>
        {OCCASION_OPTIONS.map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, occasion === item && styles.activeChip]}
            onPress={() => setOccasion(item)}
          >
            <Text
              style={[
                styles.chipText,
                occasion === item && styles.activeChipText,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Season</Text>
      <View style={styles.wrapRow}>
        {SEASON_OPTIONS.map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, season === item && styles.activeChip]}
            onPress={() => setSeason(item)}
          >
            <Text
              style={[
                styles.chipText,
                season === item && styles.activeChipText,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Brand (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter brand"
        value={brand}
        onChangeText={setBrand}
        autoCapitalize="words"
      />

      <Pressable
        style={[styles.button, saveDisabled && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saveDisabled}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Item</Text>
        )}
      </Pressable>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pick a color</Text>

            <View style={styles.modalColors}>
              {[
                "#ef4444",
                "#3b82f6",
                "#10b981",
                "#ec4899",
                "#000000",
                "#facc15",
                "#9333ea",
                "#f5f5f5",
                "#d6b48a",
              ].map((item) => (
                <Pressable
                  key={item}
                  style={[styles.color, { backgroundColor: item }]}
                  onPress={() => {
                    setColor(item);
                    setShowPicker(false);
                  }}
                />
              ))}
            </View>

            <Pressable onPress={() => setShowPicker(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 32,
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
    marginBottom: 6,
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: 20,
  },
  imageBox: {
    height: 190,
    backgroundColor: "#ece7e3",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  imageEmptyWrap: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  imageEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#444",
  },
  imageEmptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  label: {
    marginBottom: 8,
    fontWeight: "700",
    color: "#1f2937",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  wrapRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#e9e5e1",
  },
  activeChip: {
    backgroundColor: "#8B1E1E",
  },
  chipText: {
    color: "#1f2937",
    fontWeight: "500",
  },
  activeChipText: {
    color: "#fff",
  },
  color: {
    width: 35,
    height: 35,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#111827",
  },
  addColor: {
    width: 35,
    height: 35,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  addColorText: {
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#8B1E1E",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  modalColors: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
    marginBottom: 20,
  },
  closeText: {
    color: "#8B1E1E",
    fontWeight: "700",
  },
});
