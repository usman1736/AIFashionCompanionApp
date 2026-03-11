import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AuthScreenWrapper from "../components/layout/AuthScreenWrapper";
import AuthButton from "../components/ui/AuthButton";
import AuthInput from "../components/ui/AuthInput";
import { colors } from "../styles/colors";
import { spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

export default function MeasurementsScreen() {
  const router = useRouter();

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
            keyboardType="default"
          />
        </View>

        <View style={styles.inputWrap}>
          <AuthInput
            label="Weight"
            placeholder="e.g. 70 kg"
            keyboardType="default"
          />
        </View>

        <View style={styles.inputWrap}>
          <AuthInput
            label="Chest / Bust"
            placeholder="e.g. 95 cm"
            keyboardType="default"
          />
        </View>

        <View style={styles.inputWrap}>
          <AuthInput
            label="Waist"
            placeholder="e.g. 78 cm"
            keyboardType="default"
          />
        </View>

        <View style={styles.inputWrap}>
          <AuthInput
            label="Hips"
            placeholder="e.g. 98 cm"
            keyboardType="default"
          />
        </View>

        <View style={styles.inputWrap}>
          <AuthInput
            label="Shoulders"
            placeholder="e.g. 44 cm"
            keyboardType="default"
          />
        </View>

        <View style={styles.inputWrap}>
          <AuthInput
            label="Inseam"
            placeholder="e.g. 80 cm"
            keyboardType="default"
          />
        </View>
      </View>

      <View style={styles.buttonWrap}>
        <AuthButton
          title="Save Measurements"
          onPress={() => router.push("/ai-confirmation")}
        />
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
