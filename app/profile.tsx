import { useNavigation, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import AppScreenWrapper from "../components/layout/AppScreenWrapper";
import { auth, db } from "../firebaseConfig";
import { getColorProfile } from "../services/colorService";
import { getUserProfile } from "../services/userService";
import { colors } from "../styles/colors";
import { radius, spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

const quickLinks = [
  { title: "My Orders", icon: require("../assets/icons/orders-icon.png") },
  {
    title: "My Measurements",
    icon: require("../assets/icons/measurements-icon.png"),
    route: "/profile-measurements",
  },
  {
    title: "Subscription Plan",
    icon: require("../assets/icons/subscription-icon.png"),
  },
  {
    title: "Saved Styles",
    icon: require("../assets/icons/saved-styles-icon.png"),
    route: "/saved-styles",
  },
  {
    title: "Payment Methods",
    icon: require("../assets/icons/wallet-icon.png"),
  },
  { title: "Support", icon: require("../assets/icons/support-icon.png") },
];

const settingsOptions = [
  { title: "Edit Profile", route: "/edit-profile" },
  { title: "Privacy & Security" },
  { title: "Terms & Conditions" },
  { title: "Log Out" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [topColor, setTopColor] = useState<string | null>(null);
  const [colorSeason, setColorSeason] = useState<string | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setEmail(user.email || "");

    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setDisplayName(profile.displayName || "");
        }
      } catch (e) {
        console.log("Profile fetch error:", e);
      }
    };

    fetchProfile();

    const fetchStats = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "closetItems"), where("userId", "==", user.uid))
        );
        const items = snap.docs.map((d) => d.data());
        setTotalItems(items.length);

        const colorsList = items.map((i) => i.color).filter(Boolean);
        if (colorsList.length > 0) {
          const most = colorsList.sort(
            (a, b) =>
              colorsList.filter((v) => v === b).length -
              colorsList.filter((v) => v === a).length
          )[0];
          setTopColor(most);
        }

        const cats = new Set(items.map((i) => i.category).filter(Boolean));
        setCategoryCount(cats.size);

        const profile = await getColorProfile(user.uid);
        if (profile) setColorSeason(profile.season);
      } catch (e) {
        console.log("Stats fetch error:", e);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const contentWidth = isLargeTablet
    ? Math.min(width - 80, 1040)
    : isTablet
      ? Math.min(width - 64, 900)
      : Math.min(width - 32, 420);

  const columns = isLargeTablet ? 3 : isTablet ? 3 : 2;
  const gap = isTablet ? spacing.lg : spacing.md;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;

  return (
    <AppScreenWrapper>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.profileCard}>
        <Image
          source={require("../assets/icons/profile-icon.png")}
          style={styles.avatar}
        />
        <View style={styles.profileTextWrap}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>My Style Stats</Text>
      <View style={styles.statsCard}>
        {[
          { label: "Total Items", value: totalItems ?? "—" },
          { label: "Top Color", value: topColor ?? "—" },
          { label: "Season", value: colorSeason ?? "—" },
          { label: "Categories", value: categoryCount ?? "—" },
        ].map((stat) => (
          <View key={stat.label} style={styles.statBox}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Links</Text>
      <View style={[styles.grid, { gap }]}>
        {quickLinks.map((item) => (
          <Pressable
            key={item.title}
           onPress={() => {
  if (item.route) {
    router.push(item.route as never);
  } else if (
    item.title === "My Orders" ||
    item.title === "Payment Methods" ||
    item.title === "Support"
  ) {
    Alert.alert(
      "Coming Soon",
      `${item.title} will be available in a future update.`,
      [{ text: "OK" }]
    );
  }
}}
            style={[
              styles.gridCard,
              {
                width: cardWidth,
                marginBottom: gap,
              },
            ]}
          >
            <Image source={item.icon} style={styles.gridIcon} />
            <Text style={styles.gridText}>{item.title}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Settings</Text>
      <View style={styles.settingsCard}>
        {settingsOptions.map((item, index) => (
          <View key={item.title}>
            <Pressable
              style={styles.settingRow}
              onPress={() => {
                if (item.title === "Log Out") {
                  handleLogout();
                } else if (item.route) {
                  router.push(item.route as never);
                }
              }}
            >
              <Text style={styles.settingText}>{item.title}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            {index !== settingsOptions.length - 1 ? (
              <View style={styles.divider} />
            ) : null}
          </View>
        ))}
      </View>
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.darkText,
    marginBottom: spacing.md,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 60,
    height: 60,
    marginRight: spacing.md,
  },
  profileTextWrap: {
    flex: 1,
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.darkText,
  },
  email: {
    marginTop: spacing.xs,
    ...typography.body,
    color: colors.mutedText,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.xl,
    justifyContent: "space-around",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  statLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: "center",
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.xl,
  },
  gridCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 118,
  },
  gridIcon: {
    width: 28,
    height: 28,
    marginBottom: spacing.sm,
  },
  gridText: {
    ...typography.caption,
    lineHeight: 16,
    fontWeight: "600",
    color: colors.darkText,
    textAlign: "center",
    width: "100%",
  },
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  settingRow: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingText: {
    ...typography.body,
    color: colors.darkText,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 20,
    color: "#9E958C",
  },
  divider: {
    height: 1,
    backgroundColor: "#ECE5DD",
    marginLeft: spacing.lg,
  },
});
