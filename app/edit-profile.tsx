import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
  const [password, setPassword] = useState("");

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: true });
  }, [navigation]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setEmail(user.email || "");
    const loadProfile = async () => {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setFullName(profile.displayName || "");
        setPhone(profile.phone || "");
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { displayName: fullName, phone });
      router.back();
    } catch (e: any) {
      alert(e?.message || "Failed to save changes");
    }
  };

  return (
    <AppScreenWrapper>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.buttonPrimary} />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <Text style={styles.subtitle}>
        Update your account information.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Basic Information</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="User Name"
          placeholderTextColor="#9A9A9A"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="user@email.com"
          placeholderTextColor="#9A9A9A"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+1 000 000 0000"
          placeholderTextColor="#9A9A9A"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Security</Text>

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          placeholderTextColor="#9A9A9A"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.helperText}>
          For the final app, this section would usually support changing your password securely.
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Changes</Text>
        </Pressable>
      </View>
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
    lineHeight: 20,
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
    color: colors.darkText,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD3C8",
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: "#FAF7F3",
    color: colors.darkText,
  },
  helperText: {
    marginTop: spacing.sm,
    ...typography.caption,
    lineHeight: 18,
    color: colors.mutedText,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#EEE9E3",
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#6F6F6F",
    fontWeight: "700",
    fontSize: 14,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
