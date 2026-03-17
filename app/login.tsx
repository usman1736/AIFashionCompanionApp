import { useRouter } from "expo-router";

import React, { useState } from "react";

import { Image, StyleSheet, Text, View } from "react-native";

import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

import { auth } from "../firebaseConfig";

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

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async () => {

    // Email format validation

    if (!email.includes("@") || !email.includes(".")) {

      alert("Please enter a valid email address");

      return;

    }

    if (password.length < 6) {

      alert("Password must be at least 6 characters");

      return;

    }

    try {

      await signInWithEmailAndPassword(auth, email, password);

      alert("Login successful");

      router.replace("/home");

    } catch (error:any) {

      alert(error.message);

    }

  };

  const handleResetPassword = async () => {

    if (!email) {

      alert("Enter your email first");

      return;

    }

    try {

      await sendPasswordResetEmail(auth, email);

      alert("Password reset email sent!");

    } catch (error:any) {

      alert(error.message);

    }

  };

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

            value={email}

            onChangeText={setEmail}

          />
</View>
<View style={styles.formGroup}>
<AuthPasswordInput

            label="Password"

            placeholder="Your Password"

            textContentType="password"

            value={password}

            onChangeText={setPassword}

          />
</View>
<View style={styles.formGroup}>
<AuthCheckbox value={rememberMe} onChange={setRememberMe} />
</View>
<View style={styles.buttonWrap}>
<AuthButton title="Log in" onPress={handleLogin} />
</View>
<Text style={styles.forgot} onPress={handleResetPassword}>

          Forgot password?
</Text>
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
