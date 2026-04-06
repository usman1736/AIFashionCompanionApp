import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

const MAX_REFRESHES = 5;
const STORAGE_KEY = "outfit_refresh_data";

export default function RefreshLimitBanner() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const today = new Date().toDateString();
      if (parsed.date !== today) {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ date: today, count: 0 }),
        );
        setRefreshCount(0);
        setLimitReached(false);
      } else {
        setRefreshCount(parsed.count);
        setLimitReached(parsed.count >= MAX_REFRESHES);
      }
    } catch (e) {
      console.log("RefreshLimitBanner error:", e);
    }
  };

  return (
    <View style={[styles.banner, limitReached && styles.bannerWarning]}>
      <Text style={[styles.text, limitReached && styles.textWarning]}>
        {limitReached
          ? "⚠️ Refresh limit reached — resets tomorrow"
          : `🔄 ${MAX_REFRESHES - refreshCount} outfit refreshes left today`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E3D9CE",
  },
  bannerWarning: {
    backgroundColor: "#FFF3F3",
    borderColor: colors.buttonPrimary,
  },
  text: {
    ...typography.caption,
    color: colors.darkText,
    fontWeight: "600",
  },
  textWarning: {
    color: colors.buttonPrimary,
  },
});
