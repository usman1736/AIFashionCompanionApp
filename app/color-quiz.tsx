import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";
import { calculateColorResult, saveColorProfile } from "../services/colorService";
import { colors } from "../styles/colors";
import { radius, spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

type Question = {
  question: string;
  options: { key: string; text: string }[];
};

const QUESTIONS: Question[] = [
  {
    question: "What is your natural hair color (before any dyeing)?",
    options: [
      { key: "A", text: "Golden blonde, strawberry blonde, or light warm brown" },
      { key: "B", text: "Ash blonde, mousy brown, or light ash brown" },
      { key: "C", text: "Auburn, dark brown with red/gold tones, or warm chestnut" },
      { key: "D", text: "Very dark brown, blue-black, or platinum/silver blonde" },
    ],
  },
  {
    question: "What is your natural eye color?",
    options: [
      { key: "A", text: "Bright blue, green, or warm hazel with golden flecks" },
      { key: "B", text: "Soft blue, grey-blue, grey-green, or muted hazel" },
      { key: "C", text: "Dark hazel, olive green, warm brown, or amber" },
      { key: "D", text: "Dark brown, black-brown, icy blue, or cool violet-grey" },
    ],
  },
  {
    question: "What is your skin's undertone?\n(Look at the veins on your inner wrist.)",
    options: [
      { key: "A", text: "Warm — veins greenish; skin has a peachy/golden glow" },
      { key: "B", text: "Cool — veins blue/purple; skin has a pinkish cast" },
      { key: "C", text: "Warm — veins green; skin has an olive or bronze tone" },
      { key: "D", text: "Very cool or neutral — veins dark blue; skin is porcelain or deep with blue undertone" },
    ],
  },
  {
    question: "Which metal jewelry looks best on you?",
    options: [
      { key: "A", text: "Bright, shiny gold" },
      { key: "B", text: "Silver or rose gold" },
      { key: "C", text: "Antique/matte gold, bronze, or copper" },
      { key: "D", text: "Platinum, white gold, or high-shine silver" },
    ],
  },
  {
    question: "When you wear pure white vs. off-white/ivory, which looks better?",
    options: [
      { key: "A", text: "Ivory/cream — pure white feels too stark" },
      { key: "B", text: "Soft white or lavender-white looks most natural" },
      { key: "C", text: "Warm off-white, eggshell, or oyster" },
      { key: "D", text: "Bright, crisp pure white — off-white looks dingy" },
    ],
  },
  {
    question: "Which of these colors would you instinctively wear and feel great in?",
    options: [
      { key: "A", text: "Coral, warm peach, light turquoise, camel" },
      { key: "B", text: "Dusty rose, lavender, powder blue, soft grey" },
      { key: "C", text: "Rust, mustard, olive, burnt sienna" },
      { key: "D", text: "Fuchsia, emerald, royal blue, true red" },
    ],
  },
];

export default function ColorQuizScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1 / QUESTIONS.length)).current;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

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

  const handleNext = () => {
    if (!selected) return;

    const newAnswers = [...answers];
    newAnswers[currentIndex] = selected;

    if (currentIndex < QUESTIONS.length - 1) {
      animateTransition("forward", () => {
        setAnswers(newAnswers);
        setSelected(newAnswers[currentIndex + 1] ?? null);
        setCurrentIndex(currentIndex + 1);
      });
    } else {
      // Last question — calculate and save
      handleFinish(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentIndex === 0) return;
    animateTransition("back", () => {
      setSelected(answers[currentIndex - 1] ?? null);
      setCurrentIndex(currentIndex - 1);
    });
  };

  const handleFinish = async (finalAnswers: string[]) => {
    const user = auth.currentUser;
    if (!user) {
      alert("No user found. Please log in again.");
      return;
    }

    setSaving(true);
    try {
      const q6Answer = finalAnswers[5] ?? "A";
      const result = calculateColorResult(finalAnswers, q6Answer);
      await saveColorProfile(user.uid, result);
    } catch (e: any) {
      console.log("Color quiz save error:", e);
      alert("Save failed: " + (e?.message ?? String(e)));
    } finally {
      setSaving(false);
      router.replace(from === "edit" ? "/color-result" : "/color-result");
    }
  };

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

        {/* Question */}
        <Animated.View
          style={[styles.body, { opacity, transform: [{ translateX: slideAnim }] }]}
        >
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.options}>
            {question.options.map((opt) => {
              const isSelected = selected === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setSelected(opt.key)}
                >
                  <View style={[styles.optionKey, isSelected && styles.optionKeySelected]}>
                    <Text style={[styles.optionKeyText, isSelected && styles.optionKeyTextSelected]}>
                      {opt.key}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {opt.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Next button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!selected || saving}
          >
            <Text style={styles.nextBtnText}>
              {saving ? "Saving..." : isLast ? "See My Results" : "Next"}
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
    backgroundColor: colors.offWhite,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
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
    marginBottom: spacing.xxl,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.pill,
  },
  body: {
    flex: 1,
  },
  questionText: {
    ...typography.heading,
    color: colors.darkText,
    marginBottom: spacing.xl,
    lineHeight: 26,
  },
  options: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 64,
    gap: spacing.md,
  },
  optionCardSelected: {
    borderColor: colors.buttonPrimary,
    backgroundColor: "#FDF5F5",
  },
  optionKey: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EDE8E3",
    alignItems: "center",
    justifyContent: "center",
  },
  optionKeySelected: {
    backgroundColor: colors.buttonPrimary,
  },
  optionKeyText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.mutedText,
  },
  optionKeyTextSelected: {
    color: colors.white,
  },
  optionText: {
    ...typography.body,
    color: colors.darkText,
    flex: 1,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: colors.buttonPrimary,
    fontWeight: "500",
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
