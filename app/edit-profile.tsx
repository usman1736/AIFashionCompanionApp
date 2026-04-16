import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  updatePassword,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AppScreenWrapper from "../components/layout/AppScreenWrapper";
import { auth } from "../firebaseConfig";
import { getUserProfile, updateUserProfile } from "../services/userService";
import { colors } from "../styles/colors";
import { hitSlop, spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

export default function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [generatedCode, setGeneratedCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");

  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: true });
  }, [navigation]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setEmail(user.email || "");
    setIsVerified(user.emailVerified || false);

    const loadProfile = async () => {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setFullName(profile.displayName || "");
        setPhone(profile.phone || "");
      }
    };
    loadProfile();
  }, []);

  // 🔥 AUTO REFRESH EMAIL VERIFICATION
  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;
      if (!user) return;

      await user.reload();
      setIsVerified(user.emailVerified);
    };

    const interval = setInterval(checkVerification, 3000);
    return () => clearInterval(interval);
  }, []);

  // SAVE BASIC INFO
  const handleSaveBasic = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateUserProfile(user.uid, {
        displayName: fullName,
        phone,
      });

      alert("Basic info updated");
    } catch (e: any) {
      alert(e?.message || "Failed to update basic info");
    }
  };

  // VERIFY EMAIL
  const handleVerifyEmail = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (user.emailVerified) {
      alert("Email is already verified");
      return;
    }

    try {
      await sendEmailVerification(user);
      alert("Verification email sent! Check your inbox.");
    } catch {
      alert("Failed to send verification email");
    }
  };

  // SEND OTP (SIMULATED)
  const handleSendCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    alert(`Verification code sent: ${code}`);
  };

  // CHANGE PASSWORD
  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    await user.reload();

    if (!currentPassword || !newPassword) {
      alert("Please fill all password fields");
      return;
    }

    if (!user.emailVerified) {
      alert("Please verify your email first");
      return;
    }

    if (!enteredCode) {
      alert("Enter verification code");
      return;
    }

    if (enteredCode !== generatedCode) {
      alert("Incorrect verification code");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      alert("Password updated successfully!");
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        alert("Current password is incorrect");
      } else {
        alert("Failed to update password");
      }
    }
  };

  return (
    <AppScreenWrapper>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={hitSlop}
        >
          <Ionicons name="arrow-back" size={24} color={colors.buttonPrimary} />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <Text style={styles.subtitle}>Update your account information.</Text>

      {/* BASIC INFO */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Basic Information</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} editable={false} />

        {/* VERIFY EMAIL BUTTON */}
        <Pressable
          style={[
            styles.secondaryButton,
            isVerified && { backgroundColor: "#D4EDDA" },
          ]}
          onPress={() => {
            if (!isVerified) handleVerifyEmail();
          }}
        >
          <Text style={styles.secondaryButtonText}>
            {isVerified ? "Email Verified ✔️" : "Verify Email"}
          </Text>
        </Pressable>

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} />

        <Pressable style={styles.primaryButton} onPress={handleSaveBasic}>
          <Text style={styles.primaryButtonText}>Save Basic Info</Text>
        </Pressable>
      </View>

      {/* SECURITY */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Security</Text>

        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <Pressable style={styles.secondaryButton} onPress={handleSendCode}>
          <Text style={styles.secondaryButtonText}>Send Verification Code</Text>
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Enter verification code"
          value={enteredCode}
          onChangeText={setEnteredCode}
        />

        <Pressable style={styles.primaryButton} onPress={handleChangePassword}>
          <Text style={styles.primaryButtonText}>Change Password</Text>
        </Pressable>
      </View>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </Pressable>
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.darkText,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: spacing.sm,
  },
  label: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    ...typography.body,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD3C8",
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.buttonPrimary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#EEE9E3",
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    fontWeight: "700",
  },
});
