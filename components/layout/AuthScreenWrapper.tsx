import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../styles/colors";
import { hitSlop, moderateScale, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

type AuthScreenWrapperProps = {
  children: React.ReactNode;
  subtitle?: string;
  showBackButton?: boolean;
  backgroundColor?: string;
  logoTopMargin?: number;
  showLogo?: boolean;
};

export default function AuthScreenWrapper({
  children,
  subtitle,
  showBackButton = false,
  backgroundColor = colors.background,
  logoTopMargin,
  showLogo = true,
}: AuthScreenWrapperProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const isSmallPhone = height < 700;

  const contentWidth = isTablet
    ? Math.min(width * 0.56, 520)
    : Math.min(width - spacing.xxl, 420);

  const computedLogoTopMargin =
    logoTopMargin ?? (isSmallPhone ? spacing.lg : spacing.xxxl);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.container}>
            {showBackButton ? (
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons
                  name="arrow-back"
                  size={moderateScale(24)}
                  color={colors.buttonPrimary}
                />
              </Pressable>
            ) : null}

            {showLogo ? (
              <Image
                source={require("../../assets/icons/aura-logo.png")}
                style={[
                  styles.logo,
                  {
                    marginTop: computedLogoTopMargin,
                    width: isTablet ? 88 : 72,
                    height: isTablet ? 88 : 72,
                  },
                ]}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={{ height: computedLogoTopMargin }} />
            )}

            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            <View style={[styles.content, { width: contentWidth }]}>
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.lg,
    zIndex: 10,
    padding: spacing.xs,
  },
  logo: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.buttonPrimary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  content: {
    alignSelf: "center",
  },
});
