import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import AuthScreenWrapper from "../components/layout/AuthScreenWrapper";
import AuthButton from "../components/ui/AuthButton";
import AuthCard from "../components/ui/AuthCard";
import AuthCheckbox from "../components/ui/AuthCheckbox";
import AuthInput from "../components/ui/AuthInput";
import AuthPasswordInput from "../components/ui/AuthPasswordInput";
import { colors } from "../styles/colors";
import { spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

export default function LoginScreen() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <AuthScreenWrapper
      backgroundColor={colors.background}
      logoTopMargin={spacing.xxxl}
    >
      <AuthCard>
        <View style={styles.header}>
          <Image
            source={require("../assets/icons/user-icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.title}>Sign in</Text>
        </View>

        <View style={styles.formGroup}>
          <AuthInput
            label="Email"
            placeholder="Your Email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.formGroup}>
          <AuthPasswordInput
            label="Password"
            placeholder="Your Password"
            textContentType="password"
          />
        </View>

        <View style={styles.formGroup}>
          <AuthCheckbox value={rememberMe} onChange={setRememberMe} />
        </View>

        <View style={styles.buttonWrap}>
          <AuthButton title="Log in" onPress={() => router.push("/home")} />
        </View>

        <Text style={styles.forgot}>Forgot password?</Text>

        <Text style={styles.signupText}>
          Don&apos;t have an account?{" "}
          <Text
            style={styles.signupLink}
            onPress={() => router.push("/signup")}
          >
            Sign up
          </Text>
        </Text>
      </AuthCard>
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  icon: {
    width: 18,
    height: 18,
    marginRight: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.buttonPrimary,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  buttonWrap: {
    marginTop: spacing.sm,
  },
  forgot: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.md,
    color: colors.buttonPrimary,
  },
  signupText: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  signupLink: {
    color: colors.buttonPrimary,
    fontWeight: "600",
  },
});
