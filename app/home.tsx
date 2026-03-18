import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import AppScreenWrapper from "../components/layout/AppScreenWrapper";
import AuthButton from "../components/ui/AuthButton";
import ProductThumbCard from "../components/ui/ProductThumbCard";
import ErrorState from "../components/states/ErrorState";
import Loading from "../components/states/Loading";
import { auth } from "../firebaseConfig";
import { getUserProfile } from "../services/userService";
import { colors } from "../styles/colors";
import { spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

const todayOutfit = [
  { id: 1, label: "Top" },
  { id: 2, label: "Bottom" },
  { id: 3, label: "Shoes" },
  { id: 4, label: "Accessory" },
];

const recentlyAdded = [
  { id: 1, title: "Black Jacket" },
  { id: 2, title: "White Sneakers" },
  { id: 3, title: "Blue Jeans" },
  { id: 4, title: "Beige Coat" },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("User");
  const [error, setError] = useState(false);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      router.replace("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          if (!profile.quizComplete) {
            router.replace("/quiz");
            return;
          }
          if (!profile.measurementsComplete) {
            router.replace("/measurement-choice");
            return;
          }
          setDisplayName(
            profile.displayName || user.email?.split("@")[0] || "User",
          );
        } else {
          setDisplayName(user.email?.split("@")[0] || "User");
        }
      } catch (e) {
        console.log("Home error:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) return <Loading fullScreen />;

  if (error) return <ErrorState message="Something went wrong. Please restart the app." />;

  return (
    <AppScreenWrapper backgroundColor={colors.offWhite}>
      <Text style={styles.welcomeText}>Hello, {displayName} 👋</Text>
      <Text style={styles.subText}>
        Here&apos;s your style overview for today.
      </Text>

      <View
        style={[
          styles.mainSection,
          isTablet && styles.mainSectionTablet,
          isLargeTablet && styles.mainSectionLargeTablet,
        ]}
      >
        <View style={[styles.leftColumn, isTablet && styles.leftColumnTablet]}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Closet Summary</Text>
            <Text style={styles.summaryText}>Total Items: —</Text>
            <Text style={styles.summaryText}>Most Common Color: —</Text>
            <Text style={styles.summaryText}>Categories Covered: —</Text>
          </View>
        </View>

        <View
          style={[styles.rightColumn, isTablet && styles.rightColumnTablet]}
        >
          <Text style={styles.sectionTitle}>
            Today&apos;s Outfit Suggestion
          </Text>
          <View style={styles.outfitCard}>
            <View style={styles.outfitRow}>
              {todayOutfit.map((item) => (
                <View key={item.id} style={styles.outfitPlaceholderWrap}>
                  <View style={styles.outfitPlaceholder} />
                  <Text style={styles.outfitLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.actionButton}>
              <AuthButton title="❤ Save Outfit" />
            </View>
            <View style={styles.actionButton}>
              <AuthButton title="⟳ Try another" />
            </View>
          </View>

          <View style={styles.detailsWrap}>
            <View style={styles.detailsButton}>
              <Text style={styles.detailsText}>View details</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, styles.recentTitle]}>
        You Recently Added
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentScrollContent}
      >
        {recentlyAdded.map((item) => (
          <View key={item.id} style={styles.productCardWrap}>
            <ProductThumbCard title={item.title} />
          </View>
        ))}
      </ScrollView>
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  welcomeText: {
    ...typography.heading,
    color: colors.darkText,
  },
  subText: {
    ...typography.body,
    marginTop: spacing.xs,
    color: "#8A8A8A",
    marginBottom: spacing.lg,
  },
  mainSection: {
    gap: spacing.lg,
  },
  mainSectionTablet: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.lg,
  },
  mainSectionLargeTablet: {
    gap: spacing.xl,
  },
  leftColumn: {
    width: "100%",
  },
  leftColumnTablet: {
    flex: 0.95,
  },
  rightColumn: {
    width: "100%",
  },
  rightColumnTablet: {
    flex: 1.45,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    minHeight: 180,
    justifyContent: "center",
  },
  summaryTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: spacing.sm,
  },
  summaryText: {
    ...typography.body,
    color: "#8A8A8A",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: spacing.sm,
  },
  outfitCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
  },
  outfitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  outfitPlaceholderWrap: {
    flex: 1,
    alignItems: "center",
  },
  outfitPlaceholder: {
    width: "100%",
    aspectRatio: 0.72,
    maxHeight: 160,
    borderRadius: 10,
    backgroundColor: "#E7DFD6",
    borderWidth: 1,
    borderColor: "#D7CEC4",
  },
  outfitLabel: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: "#8A8A8A",
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  detailsWrap: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  detailsButton: {
    backgroundColor: "#EEE9E3",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
  },
  detailsText: {
    ...typography.body,
    color: "#6F6F6F",
    fontWeight: "600",
  },
  recentTitle: {
    marginTop: spacing.xl,
  },
  recentScrollContent: {
    paddingRight: spacing.md,
  },
  productCardWrap: {
    marginRight: spacing.md,
  },
});
