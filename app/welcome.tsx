import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthButton from "../components/ui/AuthButton";
import { colors } from "../styles/colors";
import { spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const isSmallPhone = height < 700;

  const logoSize = isTablet ? 96 : Math.min(width * 0.22, 88);
  const contentMaxWidth = isTablet ? 460 : Math.min(width - spacing.xxl, 380);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View
          style={[
            styles.content,
            {
              maxWidth: contentMaxWidth,
              paddingTop: isSmallPhone ? spacing.xl : spacing.xxxl,
              paddingBottom: spacing.xxl,
            },
          ]}
        >
          <View style={styles.heroSection}>
            <Image
              source={require("../assets/icons/aura-logo.png")}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />

            <View style={styles.textBlock}>
              <Text style={styles.title}>Welcome to AURA</Text>
              <Text style={styles.subtitle}>Your AI Style Companion</Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <AuthButton title="Log in" onPress={() => router.push("/login")} />
            <AuthButton
              title="Sign up"
              variant="secondary"
              onPress={() => router.push("/signup")}
              style={styles.secondButton}
            />
            <AuthButton
              title="[DEV] Go to Home"
              variant="secondary"
              onPress={() => router.push("/home")}
              style={styles.secondButton}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
  },
  heroSection: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...typography.bodyMedium,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  buttonGroup: {
    width: "100%",
    marginTop: spacing.xxl,
  },
  secondButton: {
    marginTop: spacing.lg,
  },
});
