import { useNavigation, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  ColorProfile,
  SEASON_PALETTES,
  SEASON_AVOID,
  getColorProfile,
} from "../services/colorService";
import Loading from "../components/states/Loading";
import { colors } from "../styles/colors";
import { radius, spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

const SEASON_EMOJI: Record<string, string> = {
  Spring: "🌸",
  Summer: "☀️",
  Autumn: "🍂",
  Winter: "❄️",
};

const SEASON_GRADIENT: Record<string, [string, string, string]> = {
  Spring: ["#FF6F61", "#FFD700", "#98D8C8"],
  Summer: ["#B0C4DE", "#DDA0DD", "#E6E6FA"],
  Autumn: ["#B7410E", "#DAA520", "#556B2F"],
  Winter: ["#191970", "#DC143C", "#4169E1"],
};

const SEASON_ACCENT: Record<string, string> = {
  Spring: "#FF6F61",
  Summer: "#778899",
  Autumn: "#B7410E",
  Winter: "#4169E1",
};

const SEASON_BG: Record<string, string> = {
  Spring: "#FFF4EC",
  Summer: "#F0F4FF",
  Autumn: "#FFF8EE",
  Winter: "#F0F4FF",
};

const SEASON_TAGLINE: Record<string, string> = {
  Spring:
    "Warm, bright, and naturally radiant — you light up in corals, golds, and fresh greens.",
  Summer:
    "Cool, soft, and effortlessly elegant — you bloom in dusty roses, lavenders, and powder blues.",
  Autumn:
    "Rich, grounded, and warmly magnetic — you glow in rusts, mustards, and deep earthy tones.",
  Winter:
    "Bold, striking, and high-contrast — you command attention in jewel tones, pure black, and crisp white.",
};

type QuizAnswers = {
  styles?: string[];
  occasions?: string[];
};

export default function ColorResultScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [profile, setProfile] = useState<ColorProfile | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  const [loading, setLoading] = useState(true);
  const [tappedSwatch, setTappedSwatch] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: true });
  }, [navigation]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const load = async () => {
      try {
        const [colorData, userSnap] = await Promise.all([
          getColorProfile(user.uid),
          getDoc(doc(db, "users", user.uid)),
        ]);
        setProfile(colorData);
        if (userSnap.exists()) {
          setQuizAnswers(userSnap.data().quizAnswers ?? {});
        }
      } catch (e) {
        console.log("Color result load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading fullScreen />;

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>
            Could not load your results. Please try again.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.replace("/color-quiz")}
          >
            <Text style={styles.primaryBtnText}>Retake Quiz</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const accent = SEASON_ACCENT[profile.season];
  const bg = SEASON_BG[profile.season];
  const gradient = SEASON_GRADIENT[profile.season];
  const emoji = SEASON_EMOJI[profile.season];
  const tagline = SEASON_TAGLINE[profile.season];

  const confidenceText =
    profile.confidence === "High"
      ? "Strong match"
      : profile.secondarySeason
        ? `Close match — you also suit ${profile.secondarySeason} tones`
        : "Close match";

  const handleEditPreferences = () => {
    Alert.alert(
      "Edit Preferences",
      "Which section would you like to redo?",
      [
        { text: "Style Quiz", onPress: () => router.push("/quiz?from=edit") },
        { text: "Color Quiz", onPress: () => router.push("/color-quiz?from=edit") },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleSwatchTap = (hex: string) => {
    setTappedSwatch(tappedSwatch === hex ? null : hex);
  };

  const secondaryPalette = profile.secondarySeason
    ? SEASON_PALETTES[profile.secondarySeason]
    : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Screen title */}
        <Text style={styles.screenTitle}>Your Style DNA</Text>

        {/* Section 1 — Season Hero */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroEmoji}>{emoji}</Text>
          <Text style={styles.heroSeason}>{profile.season}</Text>
          <Text style={styles.heroTagline}>{tagline}</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{confidenceText}</Text>
          </View>
        </LinearGradient>

        {/* Section 2 — Your Palette */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Palette</Text>
          <Text style={styles.cardSubtitle}>
            Tap a color to see its name and hex code
          </Text>
          <View style={styles.swatchGrid}>
            {profile.palette.map((swatch) => {
              const isSelected = tappedSwatch === swatch.hex;
              return (
                <View key={swatch.hex} style={styles.swatchWrap}>
                  <Pressable
                    onPress={() => handleSwatchTap(swatch.hex)}
                    style={[
                      styles.swatch,
                      { backgroundColor: swatch.hex },
                      isSelected && { borderColor: accent, borderWidth: 3 },
                    ]}
                  />
                  {isSelected && (
                    <View style={[styles.swatchTooltip, { borderColor: accent }]}>
                      <Text style={[styles.swatchTooltipName, { color: accent }]}>
                        {swatch.name}
                      </Text>
                      <Text style={styles.swatchTooltipHex}>{swatch.hex}</Text>
                    </View>
                  )}
                  {!isSelected && (
                    <Text style={styles.swatchName}>{swatch.name}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Avoid swatches */}
          <Text style={[styles.cardSubtitle, { marginTop: spacing.xl }]}>
            Colors to avoid
          </Text>
          <View style={styles.avoidRow}>
            {profile.avoid.map((colorName) => (
              <View key={colorName} style={styles.avoidItem}>
                <Text style={styles.avoidCross}>✕</Text>
                <Text style={styles.avoidLabel}>{colorName}</Text>
              </View>
            ))}
          </View>

          {/* Secondary palette if dual type */}
          {secondaryPalette && profile.secondarySeason && (
            <>
              <Text style={[styles.cardTitle, { marginTop: spacing.xl }]}>
                {SEASON_EMOJI[profile.secondarySeason]} {profile.secondarySeason} Palette
              </Text>
              <Text style={styles.cardSubtitle}>
                These also work well for you
              </Text>
              <View style={styles.swatchGrid}>
                {secondaryPalette.map((swatch) => {
                  const isSelected = tappedSwatch === swatch.hex + "_secondary";
                  return (
                    <View key={swatch.hex} style={styles.swatchWrap}>
                      <Pressable
                        onPress={() =>
                          setTappedSwatch(
                            tappedSwatch === swatch.hex + "_secondary"
                              ? null
                              : swatch.hex + "_secondary",
                          )
                        }
                        style={[
                          styles.swatch,
                          { backgroundColor: swatch.hex, opacity: 0.8 },
                          isSelected && { borderColor: accent, borderWidth: 3 },
                        ]}
                      />
                      {isSelected && (
                        <View style={[styles.swatchTooltip, { borderColor: accent }]}>
                          <Text style={[styles.swatchTooltipName, { color: accent }]}>
                            {swatch.name}
                          </Text>
                          <Text style={styles.swatchTooltipHex}>{swatch.hex}</Text>
                        </View>
                      )}
                      {!isSelected && (
                        <Text style={styles.swatchName}>{swatch.name}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Section 3 — Your Style */}
        {(quizAnswers.styles?.length || quizAnswers.occasions?.length) ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Style</Text>
            {quizAnswers.styles?.length ? (
              <>
                <Text style={styles.cardSubtitle}>Style preferences</Text>
                <View style={styles.pillRow}>
                  {quizAnswers.styles.map((s) => (
                    <View key={s} style={[styles.pill, { borderColor: accent }]}>
                      <Text style={[styles.pillText, { color: accent }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
            {quizAnswers.occasions?.length ? (
              <>
                <Text style={[styles.cardSubtitle, { marginTop: spacing.md }]}>
                  You dress for
                </Text>
                <View style={styles.pillRow}>
                  {quizAnswers.occasions.map((o) => (
                    <View key={o} style={[styles.pill, { backgroundColor: accent, borderColor: accent }]}>
                      <Text style={[styles.pillText, { color: "#fff" }]}>{o}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {/* Section 4 — Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: accent }]}
            onPress={() => router.replace("/home-screen")}
          >
            <Text style={styles.primaryBtnText}>Start Exploring</Text>
          </Pressable>

          <Pressable style={styles.editBtn} onPress={handleEditPreferences}>
            <Text style={[styles.editBtnText, { color: accent }]}>
              Edit preferences
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  screenTitle: {
    ...typography.title,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  heroEmoji: {
    fontSize: 56,
  },
  heroSeason: {
    fontSize: 34,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  heroTagline: {
    ...typography.body,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  confidenceBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  confidenceText: {
    ...typography.caption,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.mutedText,
    marginBottom: spacing.md,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  swatchWrap: {
    alignItems: "center",
    width: 56,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E0D8D0",
  },
  swatchName: {
    fontSize: 8,
    color: colors.mutedText,
    textAlign: "center",
    marginTop: spacing.xs,
    lineHeight: 11,
  },
  swatchTooltip: {
    marginTop: spacing.xs,
    backgroundColor: "#fff",
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.xs,
    alignItems: "center",
    minWidth: 56,
  },
  swatchTooltipName: {
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  swatchTooltipHex: {
    fontSize: 7,
    color: colors.mutedText,
    textAlign: "center",
  },
  avoidRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  avoidItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5EEEB",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    opacity: 0.7,
  },
  avoidCross: {
    fontSize: 10,
    color: "#9E6B5E",
    fontWeight: "700",
  },
  avoidLabel: {
    ...typography.caption,
    color: "#9E6B5E",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1.5,
  },
  pillText: {
    ...typography.caption,
    fontWeight: "600",
  },
  actions: {
    gap: spacing.md,
  },
  primaryBtn: {
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  primaryBtnText: {
    ...typography.button,
    color: "#fff",
  },
  editBtn: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  editBtnText: {
    ...typography.body,
    fontWeight: "600",
  },
  errorWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: "center",
  },
});
