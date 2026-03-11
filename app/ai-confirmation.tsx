import { useNavigation, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import AuthScreenWrapper from "../components/layout/AuthScreenWrapper";
import AuthButton from "../components/ui/AuthButton";
import { colors } from "../styles/colors";
import { spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

export default function AIConfirmationScreen() {
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
      subtitle="You're All Set"
      backgroundColor={colors.buttonSecondary}
      showLogo={false}
    >
      <View style={[styles.layout, isTablet && styles.layoutTablet]}>
        <View style={[styles.heroCard, isTablet && styles.heroCardTablet]}>
          <Text style={styles.heroIcon}>✨</Text>
          <Text style={styles.title}>AURA is ready</Text>
          <Text style={styles.subtitle}>
            Your style profile is complete. We’ll use your answers and
            measurements to personalize your outfit suggestions.
          </Text>
        </View>

        <View style={[styles.sideCard, isTablet && styles.sideCardTablet]}>
          <Text style={styles.sectionTitle}>What happens next</Text>
          <Text style={styles.bullet}>• Personalized outfit suggestions</Text>
          <Text style={styles.bullet}>• Better fit recommendations</Text>
          <Text style={styles.bullet}>• Smarter wardrobe insights</Text>

          <View style={styles.buttonWrap}>
            <AuthButton
              title="Go to Home"
              onPress={() => router.replace("/home")}
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
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 260,
  },
  heroCardTablet: {
    flex: 1.2,
    minHeight: 340,
  },
  heroIcon: {
    fontSize: 42,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.buttonPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: "center",
    lineHeight: 20,
  },
  sideCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
  },
  sideCardTablet: {
    flex: 0.9,
    justifyContent: "center",
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: spacing.md,
  },
  bullet: {
    ...typography.body,
    color: colors.darkText,
    marginBottom: spacing.sm,
  },
  buttonWrap: {
    marginTop: spacing.lg,
  },
});
