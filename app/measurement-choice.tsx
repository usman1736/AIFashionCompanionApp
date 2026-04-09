import { useNavigation, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import AuthScreenWrapper from "../components/layout/AuthScreenWrapper";
import MeasurementChoiceCard from "../components/ui/MeasurementChoiceCard";
import { colors } from "../styles/colors";
import { spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

export default function MeasurementChoiceScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  return (
    <AuthScreenWrapper
      subtitle="How would you like to add your measurements?"
      backgroundColor={colors.buttonSecondary}
    >
      <Text style={styles.description}>
        You can scan your body with your camera for an estimate, or enter your
        measurements manually.
      </Text>

      <View style={[styles.layout, isTablet && styles.layoutTablet]}>
        <View style={styles.choiceColumn}>
          <MeasurementChoiceCard
            icon="📷"
            title="Body Scan"
            description="Use your camera to capture guided photos and estimate your measurements."
            onPress={() => router.push("/body-scan")}
          />
        </View>

        <View style={styles.choiceColumn}>
          <MeasurementChoiceCard
            icon="✍️"
            title="Enter Manually"
            description="Type in your measurements yourself for full control."
            onPress={() => router.push("/measurements")}
          />
        </View>
      </View>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  description: {
    ...typography.body,
    lineHeight: 20,
    color: "#6A6A6A",
    marginBottom: spacing.xl,
  },
  layout: {
    gap: spacing.md,
  },
  layoutTablet: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.lg,
  },
  choiceColumn: {
    flex: 1,
  },
});
