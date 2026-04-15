import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OptionChip from "../components/ui/OptionChip";
import { colors } from "../styles/colors";
import { radius, spacing } from "../styles/spacing";
import { typography } from "../styles/typography";
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

const QUESTIONS = [
  {
    key: "styles",
    question: "Which styles match you?",
    helper: "Choose as many as you like",
    options: styleOptions,
  },
  {
    key: "occasions",
    question: "What do you dress for most often?",
    helper: "This helps AURA generate more accurate outfit suggestions.",
    options: occasionOptions,
  },
];

export default function QuizScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1 / QUESTIONS.length)).current;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  useEffect(() => {
    if (from === "edit") return;
    const checkQuiz = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().quizComplete) {
          router.replace("/home-screen");
        }
      } catch (e) {
        console.log("Check quiz error:", e);
      }
    };
    checkQuiz();
  }, []);

  const animateTransition = (direction: "forward" | "back", onDone: () => void) => {
    const outX = direction === "forward" ? -40 : 40;
    const inX = direction === "forward" ? 40 : -40;

    Animated.parallel([
      Animated.timing(slideAnim, { toValue: outX, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(inX);
      onDone();
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    });
    Animated.timing(progressAnim, {
      toValue: (currentIndex + (direction === "forward" ? 2 : 0)) / QUESTIONS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const currentSelections = currentIndex === 0 ? selectedStyles : selectedOccasions;
  const canContinue = currentSelections.length > 0;

  const toggleOption = (value: string) => {
    const setter = currentIndex === 0 ? setSelectedStyles : setSelectedOccasions;
    setter((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );
  };

  const handleNext = () => {
    if (!canContinue) return;
    if (currentIndex < QUESTIONS.length - 1) {
      animateTransition("forward", () => setCurrentIndex(currentIndex + 1));
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex === 0) return;
    animateTransition("back", () => setCurrentIndex(currentIndex - 1));
  };

  const handleSubmit = async () => {
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
            occasions: selectedOccasions,
          },
        },
        { merge: true },
      );
      router.replace(from === "edit" ? "/color-result" : "/measurement-choice");
    } catch (e) {
      console.log("Save error:", e);
      alert("Failed to save quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  const question = QUESTIONS[currentIndex];
  const progress = (currentIndex + 1) / QUESTIONS.length;
  const isLast = currentIndex === QUESTIONS.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {currentIndex > 0 ? (
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.buttonPrimary} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          <Text style={styles.progressLabel}>
            {currentIndex + 1} / {QUESTIONS.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
        </View>

        <Text style={styles.screenTitle}>Let's Set Up Your Style</Text>
        <Text style={styles.description}>
          Answer a few quick questions so AURA can personalize your outfits.
        </Text>

        {/* Question */}
        <Animated.View style={[styles.body, { opacity, transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.card}>
            <Text style={styles.questionText}>{question.question}</Text>
            <View style={styles.rowWrap}>
              {question.options.map((label) => (
                <OptionChip
                  key={label}
                  label={label}
                  selected={currentSelections.includes(label)}
                  onPress={() => toggleOption(label)}
                />
              ))}
            </View>
            <Text style={styles.helper}>{question.helper}</Text>
          </View>
        </Animated.View>

        {/* Next button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canContinue}
          >
            <Text style={styles.nextBtnText}>
              {isLast ? "Continue" : "Next"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.buttonSecondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  backBtn: {
    minWidth: 60,
  },
  backText: {
    ...typography.body,
    color: colors.buttonPrimary,
    fontWeight: "600",
  },
  progressLabel: {
    ...typography.caption,
    color: colors.mutedText,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E8DDD5",
    borderRadius: radius.pill,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.pill,
  },
  screenTitle: {
    ...typography.title,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: "#6A6A6A",
    marginBottom: spacing.xl,
  },
  body: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: spacing.lg,
  },
  questionText: {
    ...typography.heading,
    color: colors.darkText,
    marginBottom: spacing.md,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  helper: {
    ...typography.caption,
    color: "#7A7A7A",
    marginTop: spacing.md,
  },
  footer: {
    paddingVertical: spacing.xl,
  },
  nextBtn: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  nextBtnDisabled: {
    backgroundColor: "#C4A8A9",
  },
  nextBtnText: {
    ...typography.button,
    color: colors.white,
  },
});
