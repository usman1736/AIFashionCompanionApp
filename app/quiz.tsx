import { useNavigation, useRouter } from "expo-router";

import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import AuthScreenWrapper from "../components/layout/AuthScreenWrapper";

import AuthButton from "../components/ui/AuthButton";

import ColorCircle from "../components/ui/ColorCircle";

import OptionChip from "../components/ui/OptionChip";

import SeasonOption from "../components/ui/SeasonOption";

import { colors } from "../styles/colors";

import { spacing } from "../styles/spacing";

import { typography } from "../styles/typography";

// 🔥 FIREBASE

import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

const styleOptions = [
  "Casual",

  "Streetwear",

  "Business Casual",

  "Formal",

  "Sporty",

  "Minimalist",
];

const occasionOptions = ["Work", "Gym", "Casual outings"];

const colorOptions = [
  "#FF3B30",

  "#F6B93B",

  "#6BCB77",

  "#4D96FF",

  "#B983FF",

  "#FF75A0",

  "#E1E100",

  "#000000",
];

const seasonOptions = [
  { label: "Spring", icon: "🌸" },

  { label: "Summer", icon: "☀️" },

  { label: "Fall", icon: "🍂" },

  { label: "Winter", icon: "❄️" },
];

export default function QuizScreen() {
  const navigation = useNavigation();

  const router = useRouter();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);

  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  // ✅ SKIP QUIZ IF ALREADY DONE

  useEffect(() => {
    const checkQuiz = async () => {
      const user = auth.currentUser;

      if (!user) return;

      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));

        if (docSnap.exists() && docSnap.data().quizComplete) {
          router.replace("/home");
        }
      } catch (e) {
        console.log("Check quiz error:", e);
      }
    };

    checkQuiz();
  }, []);

  const toggleMultiSelect = (
    value: string,

    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const canContinue = useMemo(() => {
    return (
      selectedStyles.length > 0 &&
      selectedColors.length > 0 &&
      selectedOccasions.length > 0 &&
      !!selectedSeason
    );
  }, [selectedStyles, selectedColors, selectedOccasions, selectedSeason]);

  // SAVE QUIZ

  const handleContinue = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("User not logged in");

      return;
    }

    setLoading(true);

    try {
      await setDoc(
        doc(db, "users", user.uid),

        {
          email: user.email,

          quizComplete: true,

          quizAnswers: {
            styles: selectedStyles,

            colors: selectedColors,

            occasions: selectedOccasions,

            season: selectedSeason,
          },
        },

        { merge: true },
      );

      router.replace("/measurement-choice");
    } catch (e) {
      console.log("Save error:", e);

      alert("Failed to save quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  //  LOADING SCREEN

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  return (
    <AuthScreenWrapper
      subtitle="Let's Set Up Your Style"
      backgroundColor={colors.buttonSecondary}
    >
      <Text style={styles.description}>
        Answer a few quick questions so AURA can personalize your outfits.
      </Text>
      <View style={[styles.layout, isTablet && styles.layoutTablet]}>
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.title}>Which styles match you?</Text>
            <View style={styles.rowWrap}>
              {styleOptions.map((label) => (
                <OptionChip
                  key={label}
                  label={label}
                  selected={selectedStyles.includes(label)}
                  onPress={() => toggleMultiSelect(label, setSelectedStyles)}
                />
              ))}
            </View>
            <Text style={styles.helper}>Choose as many as you like</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>What colors do you like wearing?</Text>
            <View style={styles.colorRow}>
              {colorOptions.map((color) => (
                <ColorCircle
                  key={color}
                  color={color}
                  selected={selectedColors.includes(color)}
                  onPress={() => toggleMultiSelect(color, setSelectedColors)}
                />
              ))}
            </View>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.title}>What do you dress for most often?</Text>
            <View style={styles.rowWrap}>
              {occasionOptions.map((label) => (
                <OptionChip
                  key={label}
                  label={label}
                  selected={selectedOccasions.includes(label)}
                  onPress={() => toggleMultiSelect(label, setSelectedOccasions)}
                />
              ))}
            </View>
            <Text style={styles.helper}>
              This helps AURA generate more accurate outfit suggestions.
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>
              Which season best matches your wardrobe?
            </Text>
            <View style={styles.seasonRow}>
              {seasonOptions.map((season) => (
                <SeasonOption
                  key={season.label}
                  label={season.label}
                  icon={season.icon}
                  selected={selectedSeason === season.label}
                  onPress={() => setSelectedSeason(season.label)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
      <View style={styles.buttonWrap}>
        <AuthButton
          title="Continue"
          disabled={!canContinue}
          onPress={handleContinue}
        />
      </View>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",
  },

  description: {
    ...typography.body,

    color: "#6A6A6A",

    marginBottom: spacing.lg,
  },

  layout: {
    gap: spacing.md,
  },

  layoutTablet: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.lg,
  },

  column: {
    flex: 1,

    gap: spacing.md,
  },

  card: {
    backgroundColor: colors.white,

    borderRadius: 14,

    padding: spacing.lg,
  },

  title: {
    ...typography.bodyMedium,

    fontWeight: "600",

    marginBottom: spacing.sm,

    color: colors.darkText,
  },

  helper: {
    ...typography.caption,

    color: "#7A7A7A",

    marginTop: spacing.sm,
  },

  colorRow: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: spacing.sm,
  },

  rowWrap: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: spacing.sm,
  },

  seasonRow: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: spacing.sm,
  },

  buttonWrap: {
    marginTop: spacing.lg,

    marginBottom: spacing.md,
  },
});
