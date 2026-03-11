import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import AuthScreenWrapper from "../components/layout/AuthScreenWrapper";
import AuthButton from "../components/ui/AuthButton";
import AuthCard from "../components/ui/AuthCard";
import AuthInput from "../components/ui/AuthInput";
import AuthPasswordInput from "../components/ui/AuthPasswordInput";
import { colors } from "../styles/colors";
import { spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

export default function SignupScreen() {
  const router = useRouter();

  return (
    <AuthScreenWrapper
      showBackButton
      subtitle="Create your Aura Account"
      backgroundColor={colors.buttonSecondary}
    >
      <AuthCard>
        <View style={styles.formGroup}>
          <AuthInput
            label="First Name"
            placeholder="First Name"
            textContentType="givenName"
          />
        </View>

        <View style={styles.formGroup}>
          <AuthInput
            label="Last Name"
            placeholder="Last Name"
            textContentType="familyName"
          />
        </View>

        <View style={styles.formGroup}>
          <AuthInput
            label="Email"
            placeholder="Your Email"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.formGroup}>
          <AuthPasswordInput
            label="Password"
            placeholder="Your Password"
            textContentType="newPassword"
          />
        </View>

        <View style={styles.formGroup}>
          <AuthPasswordInput
            label="Confirm Password"
            placeholder="Confirm Password"
            textContentType="password"
          />
        </View>

        <View style={styles.buttonWrap}>
          <AuthButton
            title="Create Account"
            onPress={() => router.push("/quiz")}
          />
        </View>

        <Text style={styles.loginText}>
          Have an account?{" "}
          <Text style={styles.loginLink} onPress={() => router.push("/login")}>
            Log in
          </Text>
        </Text>
      </AuthCard>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: spacing.md,
  },
  buttonWrap: {
    marginTop: spacing.sm,
  },
  loginText: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.lg,
    color: colors.textSecondary,
  },
  loginLink: {
    color: colors.buttonPrimary,
    fontWeight: "600",
  },
});
