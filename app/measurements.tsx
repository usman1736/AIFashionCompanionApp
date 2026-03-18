import { useRouter } from "expo-router";

import React, { useState } from "react";

import { StyleSheet, Text, View } from "react-native";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

import AuthScreenWrapper from "../components/layout/AuthScreenWrapper";

import AuthButton from "../components/ui/AuthButton";

import AuthInput from "../components/ui/AuthInput";

import { colors } from "../styles/colors";

import { spacing } from "../styles/spacing";

import { typography } from "../styles/typography";

export default function MeasurementsScreen() {
  const router = useRouter();

  // 🔥 STATE (IMPORTANT)

  const [height, setHeight] = useState("");

  const [weight, setWeight] = useState("");

  const [chest, setChest] = useState("");

  const [waist, setWaist] = useState("");

  const [hips, setHips] = useState("");

  const [shoulders, setShoulders] = useState("");

  const [inseam, setInseam] = useState("");

  // 🔥 SAVE FUNCTION

  const handleSave = async () => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),

        {
          measurementsComplete: true,

          onboardingComplete: true,

          measurements: {
            height,

            weight,

            chest,

            waist,

            hips,

            shoulders,

            inseam,

            updatedAt: serverTimestamp(),
          },
        },

        { merge: true },
      );

      router.replace("/home"); // ✅ FIXED
    } catch (e) {
      console.log("Save error:", e);

      alert("Failed to save measurements");
    }
  };

  return (
    <AuthScreenWrapper
      subtitle="Enter Your Measurements"
      backgroundColor={colors.buttonSecondary}
      showBackButton
    >
      <Text style={styles.description}>
        Add the measurements you know now. You can always update them later in
        your profile.
      </Text>
      <View style={styles.group}>
        <View style={styles.inputWrap}>
          <AuthInput
            label="Height"
            placeholder="e.g. 175 cm"
            value={height}
            onChangeText={setHeight}
          />
        </View>
        <View style={styles.inputWrap}>
          <AuthInput
            label="Weight"
            placeholder="e.g. 70 kg"
            value={weight}
            onChangeText={setWeight}
          />
        </View>
        <View style={styles.inputWrap}>
          <AuthInput
            label="Chest / Bust"
            placeholder="e.g. 95 cm"
            value={chest}
            onChangeText={setChest}
          />
        </View>
        <View style={styles.inputWrap}>
          <AuthInput
            label="Waist"
            placeholder="e.g. 78 cm"
            value={waist}
            onChangeText={setWaist}
          />
        </View>
        <View style={styles.inputWrap}>
          <AuthInput
            label="Hips"
            placeholder="e.g. 98 cm"
            value={hips}
            onChangeText={setHips}
          />
        </View>
        <View style={styles.inputWrap}>
          <AuthInput
            label="Shoulders"
            placeholder="e.g. 44 cm"
            value={shoulders}
            onChangeText={setShoulders}
          />
        </View>
        <View style={styles.inputWrap}>
          <AuthInput
            label="Inseam"
            placeholder="e.g. 80 cm"
            value={inseam}
            onChangeText={setInseam}
          />
        </View>
      </View>
      <View style={styles.buttonWrap}>
        <AuthButton title="Save Measurements" onPress={handleSave} />
      </View>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  description: {
    ...typography.body,

    lineHeight: 20,

    color: "#6A6A6A",

    marginBottom: spacing.lg,
  },

  group: {
    marginTop: spacing.xs,
  },

  inputWrap: {
    marginBottom: spacing.md,
  },

  buttonWrap: {
    marginTop: spacing.lg,

    marginBottom: spacing.md,
  },
});
