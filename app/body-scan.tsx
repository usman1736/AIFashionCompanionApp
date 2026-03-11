import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import AuthScreenWrapper from "../components/layout/AuthScreenWrapper";
import AuthButton from "../components/ui/AuthButton";
import { colors } from "../styles/colors";
import { spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

const scanInstructions = [
  "Stand against a plain background",
  "Wear fitted clothing",
  "Keep your full body in frame",
  "Good lighting helps accuracy",
];

export default function BodyScanScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  return (
    <AuthScreenWrapper
      subtitle="Body Scan"
      backgroundColor={colors.buttonSecondary}
      showBackButton
    >
      <View style={[styles.layout, isTablet && styles.layoutTablet]}>
        <View
          style={[styles.previewCard, isTablet && styles.previewCardTablet]}
        >
          <View style={styles.cameraMock}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraText}>Camera Preview</Text>
            <Text style={styles.cameraSubtext}>
              Front and side guided photos will be captured here.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.instructionsCard,
            isTablet && styles.instructionsCardTablet,
          ]}
        >
          <Text style={styles.instructionsTitle}>Before you scan</Text>

          {scanInstructions.map((item) => (
            <Text key={item} style={styles.instructionsText}>
              • {item}
            </Text>
          ))}

          <View style={styles.buttonWrap}>
            <AuthButton
              title="Start Scan"
              onPress={() => router.push("/ai-confirmation")}
            />
          </View>
        </View>
      </View>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  layout: {
    gap: spacing.lg,
  },
  layoutTablet: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.lg,
  },
  previewCardTablet: {
    flex: 1.35,
  },
  cameraMock: {
    aspectRatio: 0.75,
    maxHeight: 520,
    borderRadius: 16,
    backgroundColor: "#E8DED3",
    borderWidth: 2,
    borderColor: "#CDB9A8",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  cameraIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  cameraText: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: spacing.xs,
  },
  cameraSubtext: {
    ...typography.caption,
    lineHeight: 18,
    color: "#6A6A6A",
    textAlign: "center",
  },
  instructionsCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.lg,
  },
  instructionsCardTablet: {
    flex: 0.9,
    justifyContent: "center",
  },
  instructionsTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    ...typography.body,
    color: "#6A6A6A",
    marginBottom: spacing.xs,
  },
  buttonWrap: {
    marginTop: spacing.xl,
  },
});
