import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import AppScreenWrapper from "../../components/layout/AppScreenWrapper";
import FeatureCard from "../../components/ui/ai/FeatureCard";
import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

export default function AIHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  return (
    <AppScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>AI Features</Text>
        <Text style={styles.subheader}>Your personal styling assistant</Text>

        <View
          style={[
            styles.cardList,
            isTablet && styles.cardListTablet,
            isLargeTablet && styles.cardListLargeTablet,
          ]}
        >
          <View style={[styles.cardWrap, isTablet && styles.cardWrapTablet]}>
            <FeatureCard
              title="AI Style Companion"
              description="Get personalized style advice and wardrobe insights."
              buttonText="Open Stylist"
              icon={require("../../assets/icons/ai-companion-icon.png")}
              onPress={() => router.push("/ai/chat" as any)}
            />
          </View>

          <View style={[styles.cardWrap, isTablet && styles.cardWrapTablet]}>
            <FeatureCard
              title="Outfit Suggestions"
              description="Discover AI-curated outfits from your wardrobe."
              buttonText="Get Suggestions"
              icon={require("../../assets/icons/outfit-icon.png")}
              onPress={() => router.push("/ai/chat?mode=outfit" as any)}
            />
          </View>

          <View style={[styles.cardWrap, isTablet && styles.cardWrapTablet]}>
            <FeatureCard
              title="Color Harmony"
              description="Find your best colors based on your unique features."
              buttonText="Find my Colors"
              icon={require("../../assets/icons/color-palette-icon.png")}
              onPress={() => router.push("/analysis" as any)}
            />
          </View>
        </View>
      </ScrollView>
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    ...typography.titleLarge,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  subheader: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.xl,
  },
  cardList: {
    width: "100%",
  },
  cardListTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardListLargeTablet: {
    gap: spacing.xl,
  },
  cardWrap: {
    width: "100%",
  },
  cardWrapTablet: {
    width: "48%",
  },
});
