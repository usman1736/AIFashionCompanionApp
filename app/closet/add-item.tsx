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

import { db } from "../../firebaseConfig";
import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

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

async function prepareImageForSave(uri: string) {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 700 } }],
    {
      compress: 0.45,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!manipulated.base64) {
    throw new Error("Image processing failed.");
  }

  const imageDataUrl = `data:image/jpeg;base64,${manipulated.base64}`;

  return {
    imageDataUrl,
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
      const preparedImage = await prepareImageForSave(image);

      await addDoc(collection(db, "closetItems"), {
        userId: user.uid,
        category,
        color,
        occasion,
        occasions: [occasion],
        season,
        seasons: [season],
        brand: brand.trim() || "",
        image: preparedImage.imageDataUrl,
        imageUrl: preparedImage.imageDataUrl,
        imagePath: "",
        wearCount: 0,
        createdAt: serverTimestamp(),
        dateAdded: serverTimestamp(),
      });

      Alert.alert("Saved!", "Your closet item was added.");
      router.replace("/closet");
    } catch (error: any) {
      console.log("SAVE ITEM ERROR:", error);

      Alert.alert(
        "Could not save this item",
        error?.message || "Image processing or Firestore save failed.",
      );
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
          <ActivityIndicator color={colors.white} />
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
    backgroundColor: colors.offWhite,
  },
  container: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  backBtn: {
    marginBottom: spacing.sm,
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
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.xl,
  },
  imageBox: {
    height: 190,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  imageEmptyWrap: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  imageEmptyTitle: {
    ...typography.bodyMedium,
    color: colors.darkText,
  },
  imageEmptySubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.mutedText,
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  label: {
    ...typography.bodyMedium,
    color: colors.darkText,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  wrapRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  activeChip: {
    backgroundColor: colors.buttonPrimary,
  },
  chipText: {
    ...typography.body,
    color: colors.darkText,
  },
  activeChipText: {
    color: colors.white,
  },
  color: {
    width: 35,
    height: 35,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: colors.darkText,
  },
  addColor: {
    width: 35,
    height: 35,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  addColorText: {
    ...typography.bodyMedium,
    color: colors.darkText,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    color: colors.darkText,
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    padding: spacing.md,
    borderRadius: radius.xl,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    ...typography.title,
    color: colors.darkText,
    marginBottom: spacing.lg,
  },
  modalColors: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  closeText: {
    ...typography.button,
    color: colors.buttonPrimary,
  },
});
