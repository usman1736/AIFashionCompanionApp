import * as Network from "expo-network";
import { useNavigation, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import AuthScreenWrapper from "../components/layout/AuthScreenWrapper";
import AuthButton from "../components/ui/AuthButton";
import ColorCircle from "../components/ui/ColorCircle";
import OptionChip from "../components/ui/OptionChip";
import SeasonOption from "../components/ui/SeasonOption";
import { colors } from "../styles/colors";
import { spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to continue.");
      return;
    }

    const userDoc = doc(db, "users", user.uid);
    getDoc(userDoc).then((snap) => {
      if (snap.exists() && snap.data().quizComplete === true) {
        router.push("/measurement-choice");
      }
    });
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
  const canGoNext = () => {
    if (currentStep === 0) return selectedStyles.length > 0;
    if (currentStep === 1) return selectedColors.length > 0;
    if (currentStep === 2) return selectedOccasions.length > 0;
    if (currentStep === 3) return !!selectedSeason;
    return false;
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };
  const canContinue = useMemo(() => {
    return (
      selectedStyles.length > 0 &&
      selectedColors.length > 0 &&
      selectedOccasions.length > 0 &&
      !!selectedSeason
    );
  }, [selectedStyles, selectedColors, selectedOccasions, selectedSeason]);

  const handleSubmitQuiz = async () => {
    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected) {
      alert("Internet connection required to complete onboarding.");
      return;
    }
    setIsSaving(true);
    setSaveError(false);
    try {
      const auth = getAuth();
      const db = getFirestore();
      const user = auth.currentUser;

      if (!user) return;

      await setDoc(
        doc(db, "users", user.uid),
        {
          quizAnswers: {
            styles: selectedStyles,
            colors: selectedColors,
            occasions: selectedOccasions,
            season: selectedSeason,
          },
          quizComplete: true,
        },
        { merge: true },
      );

      router.push("/measurement-choice");
    } catch (error) {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <AuthScreenWrapper
      subtitle="Let's Set Up Your Style"
      backgroundColor={colors.buttonSecondary}
    >
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: "#6A6A6A", marginBottom: 6 }}>
          Step {currentStep + 1} of 4
        </Text>
        <View
          style={{ height: 6, backgroundColor: "#E0E0E0", borderRadius: 4 }}
        >
          <View
            style={{
              height: 6,
              backgroundColor: "#000",
              borderRadius: 4,
              width: "100%",
            }}
          />
        </View>
      </View>
      <Text style={styles.description}>
        Answer a few quick questions so AURA can personalize your outfits.
      </Text>

      <View style={styles.layout}>
        {currentStep === 0 && (
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
            {selectedStyles.length === 0 && (
              <Text style={{ color: "red", fontSize: 12 }}>
                Please select at least one style
              </Text>
            )}
          </View>
        )}
        {currentStep === 1 && (
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
            {selectedColors.length === 0 && (
              <Text style={{ color: "red", fontSize: 12 }}>
                Please select at least one color
              </Text>
            )}
          </View>
        )}
        {currentStep === 2 && (
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
            {selectedOccasions.length === 0 && (
              <Text style={{ color: "red", fontSize: 12 }}>
                Please select at least one occasion
              </Text>
            )}
          </View>
        )}
        {currentStep === 3 && (
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
            {!selectedSeason && (
              <Text style={{ color: "red", fontSize: 12 }}>
                Please select a season
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.buttonWrap}>
        {saveError && (
          <Text style={{ color: "red", textAlign: "center", marginBottom: 8 }}>
            Failed to save. Please check your internet and try again.
          </Text>
        )}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {currentStep > 0 && <AuthButton title="Back" onPress={handleBack} />}
          {currentStep < 3 ? (
            <AuthButton
              title="Next"
              disabled={!canGoNext()}
              onPress={handleNext}
            />
          ) : (
            <AuthButton
              title={isSaving ? "Saving..." : "Continue"}
              disabled={!canContinue || isSaving}
              onPress={handleSubmitQuiz}
            />
          )}
        </View>
        {saveError && <AuthButton title="Retry" onPress={handleSubmitQuiz} />}
      </View>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    alignItems: "center",
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
    justifyContent: "flex-start",
  },
  buttonWrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
