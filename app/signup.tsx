import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
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
 const [firstName, setFirstName] = useState("");
 const [lastName, setLastName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const handleSignup = async () => {
   if (password !== confirmPassword) {
     alert("Passwords do not match");
     return;
   }
   try {
     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
     const user = userCredential.user;
     await setDoc(doc(db, "users", user.uid), {
       email: user.email,
       displayName: `${firstName} ${lastName}`.trim(),
       createdAt: serverTimestamp(),
       quizComplete: false,
       measurementsComplete: false,
       onboardingComplete: false,
     });
     router.push("/quiz");
   } catch (error) {
     console.log(error);
     alert("Signup failed");
   }
 };
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
           value={firstName}
           onChangeText={setFirstName}
         />
</View>
<View style={styles.formGroup}>
<AuthInput
           label="Last Name"
           placeholder="Last Name"
           textContentType="familyName"
           value={lastName}
           onChangeText={setLastName}
         />
</View>
<View style={styles.formGroup}>
<AuthInput
           label="Email"
           placeholder="Your Email"
           keyboardType="email-address"
           autoCapitalize="none"
           textContentType="emailAddress"
           onChangeText={setEmail}
         />
</View>
<View style={styles.formGroup}>
<AuthPasswordInput
           label="Password"
           placeholder="Your Password"
           textContentType="newPassword"
           onChangeText={setPassword}
         />
</View>
<View style={styles.formGroup}>
<AuthPasswordInput
           label="Confirm Password"
           placeholder="Confirm Password"
           textContentType="password"
           value={confirmPassword}
           onChangeText={setConfirmPassword}
         />
</View>
<View style={styles.buttonWrap}>
<AuthButton title="Create Account" onPress={handleSignup} />
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
