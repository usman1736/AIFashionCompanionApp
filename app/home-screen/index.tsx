import { useFocusEffect, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import AppScreenWrapper from "../../components/layout/AppScreenWrapper";
import { db } from "../../firebaseConfig";
import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

export default function HomeScreen() {
  const router = useRouter();
  const user = getAuth().currentUser;
  const [itemCount, setItemCount] = useState(0);
  const [greeting, setGreeting] = useState("");

  useFocusEffect(
    useCallback(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");

      if (!user) return;
      const fetchCount = async () => {
        const q = query(
          collection(db, "closetItems"),
          where("userId", "==", user.uid),
        );
        const snap = await getDocs(q);
        setItemCount(snap.size);
      };
      fetchCount();
    }, [user]),
  );

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Stylist";

  return (
    <AppScreenWrapper>
      <Text style={styles.greeting}>
        {greeting}, {displayName}
      </Text>
      <Text style={styles.sub}>Here's your wardrobe overview</Text>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{itemCount}</Text>
        <Text style={styles.statLabel}>Items in Wardrobe</Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <Pressable
        style={styles.actionBtn}
        onPress={() => router.push("/home-screen/outfit")}
      >
        <Text style={styles.actionText}>👗 Today's Outfit</Text>
      </Pressable>

      <Pressable
        style={styles.actionBtn}
        onPress={() => router.push("/home-screen/suggestions")}
      >
        <Text style={styles.actionText}>✨ Outfit Suggestions</Text>
      </Pressable>
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  greeting: {
    ...typography.titleLarge,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  sub: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.xxl,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.xxxl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: {
    fontSize: 52,
    fontWeight: "700",
    color: colors.buttonPrimary,
  },
  statLabel: {
    ...typography.body,
    color: colors.mutedText,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.darkText,
    marginBottom: spacing.md,
  },
  actionBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#E3D9CE",
  },
  actionText: {
    ...typography.bodyMedium,
    color: colors.darkText,
    fontWeight: "600",
  },
});
