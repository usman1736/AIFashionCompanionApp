import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { auth } from "../../firebaseConfig";
import { getUserProfile } from "../../services/userService";
import { PRODUCTS, Product } from "../shop";
import { CartItem, getCartItems } from "../shop-cart";

import AppScreenWrapper from "../../components/layout/AppScreenWrapper";
import { db } from "../../firebaseConfig";
import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

const MAX_REFRESHES = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function formatTimeLeft(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;
}

type RefreshData = {
  count: number;
  cooldownStartedAt: number | null;
};

function getDefaultRefreshData(): RefreshData {
  return {
    count: 0,
    cooldownStartedAt: null,
  };
}

function getTimeLeftFromCooldown(startedAt: number | null) {
  if (!startedAt) return 0;
  const resetTime = startedAt + COOLDOWN_MS;
  return resetTime - Date.now();
}

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const user = auth.currentUser;

  const refreshStorageKey = useMemo(() => {
    return user?.uid ? `home_outfit_refresh_data_${user.uid}` : null;
  }, [user?.uid]);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  const [itemCount, setItemCount] = useState(0);
  const [greeting, setGreeting] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [recentCartItems, setRecentCartItems] = useState<CartItem[]>([]);
  const [outfitSaved, setOutfitSaved] = useState(false);
  const [outfitSaving, setOutfitSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<{
    temp: string;
    condition: string;
  } | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [countdown, setCountdown] = useState("24:00:00");

  const limitReached = refreshCount >= MAX_REFRESHES;

  const pickRandomOutfit = () => {
    const tops = PRODUCTS.filter((p) => p.category === "Tops");
    const bottoms = PRODUCTS.filter((p) => p.category === "Bottoms");
    const shoes = PRODUCTS.filter((p) => p.category === "Shoes");
    const pick = (arr: Product[]) =>
      arr[Math.floor(Math.random() * arr.length)];

    if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
      setSuggestedProducts([]);
      return;
    }

    setSuggestedProducts([pick(tops), pick(bottoms), pick(shoes)]);
  };

  const fetchWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setWeather({ temp: "—°C", condition: "Location unavailable" });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      const { latitude, longitude } = location.coords;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
      );
      const data = await res.json();
      const temp = Math.round(data.current_weather.temperature);
      const code = data.current_weather.weathercode;
      const condition =
        code === 0
          ? "Clear sky"
          : code <= 3
            ? "Partly cloudy"
            : code <= 48
              ? "Foggy"
              : code <= 67
                ? "Rainy"
                : code <= 77
                  ? "Snowy"
                  : "Cloudy";

      setWeather({ temp: `${temp}°C`, condition });
    } catch (e) {
      console.log("Weather error:", e);
      setWeather({ temp: "—°C", condition: "Unavailable" });
    }
  };

  const loadRefreshCount = useCallback(async () => {
    if (!refreshStorageKey) return;

    try {
      const raw = await AsyncStorage.getItem(refreshStorageKey);

      if (!raw) {
        await AsyncStorage.setItem(
          refreshStorageKey,
          JSON.stringify(getDefaultRefreshData()),
        );
        setRefreshCount(0);
        setCountdown("24:00:00");
        return;
      }

      const parsed = JSON.parse(raw) as RefreshData;
      const count = Number(parsed?.count || 0);
      const cooldownStartedAt = parsed?.cooldownStartedAt || null;

      if (count >= MAX_REFRESHES) {
        const timeLeft = getTimeLeftFromCooldown(cooldownStartedAt);

        if (timeLeft <= 0) {
          await AsyncStorage.setItem(
            refreshStorageKey,
            JSON.stringify(getDefaultRefreshData()),
          );
          setRefreshCount(0);
          setCountdown("24:00:00");
        } else {
          setRefreshCount(count);
          setCountdown(formatTimeLeft(timeLeft));
        }
      } else {
        setRefreshCount(count);
        setCountdown("24:00:00");
      }
    } catch (e) {
      console.log("Refresh load error:", e);
      setRefreshCount(0);
      setCountdown("24:00:00");
    }
  }, [refreshStorageKey]);

  useEffect(() => {
    if (!limitReached || !refreshStorageKey) return;

    const interval = setInterval(async () => {
      const raw = await AsyncStorage.getItem(refreshStorageKey);
      const parsed = raw
        ? (JSON.parse(raw) as RefreshData)
        : getDefaultRefreshData();
      const timeLeft = getTimeLeftFromCooldown(parsed.cooldownStartedAt);

      if (timeLeft <= 0) {
        await AsyncStorage.setItem(
          refreshStorageKey,
          JSON.stringify(getDefaultRefreshData()),
        );
        setRefreshCount(0);
        setCountdown("24:00:00");
        return;
      }

      setCountdown(formatTimeLeft(timeLeft));
    }, 1000);

    return () => clearInterval(interval);
  }, [limitReached, refreshStorageKey]);

  useFocusEffect(
    useCallback(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");

      loadRefreshCount();
      pickRandomOutfit();
      fetchWeather();

      if (user) {
        getCartItems(user.uid).then((items) =>
          setRecentCartItems(items.slice(-3).reverse()),
        );
      }

      if (user) {
        getUserProfile(user.uid).then((profile) => {
          if (profile?.displayName) setProfileName(profile.displayName);
        });
      }

      if (!user) return;

      const fetchCount = async () => {
        const q = query(
          collection(db, "closetItems"),
          where("userId", "==", user.uid),
        );

        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setItems(data);
        setItemCount(data.length);
      };

      fetchCount();
    }, [user, loadRefreshCount]),
  );

  const colorsList = items.map((i: any) => i.color).filter(Boolean);

  const mostCommonColor =
    colorsList.length > 0
      ? colorsList.sort(
          (a, b) =>
            colorsList.filter((v) => v === b).length -
            colorsList.filter((v) => v === a).length,
        )[0]
      : "—";

  const categoriesCovered = new Set(
    items.map((i: any) => i.category).filter(Boolean),
  ).size;

  const displayName = profileName;

  const handleSaveOutfit = async () => {
    if (!user || suggestedProducts.length === 0 || outfitSaved || outfitSaving)
      return;
    setOutfitSaving(true);

    try {
      await addDoc(collection(db, "savedStyles"), {
        userId: user.uid,
        title: "Saved Look",
        occasion: "",
        source: "home_marketplace",
        reason: "Saved from Home Screen suggestion",
        pieces: suggestedProducts.map((p) => ({
          id: p.id,
          label: p.name,
          imageUrl: p.image,
          category: p.category,
          color: p.color,
          brand: p.brand,
        })),
        suggestedSizes: [],
        createdAt: new Date(),
      });

      setOutfitSaved(true);
      setTimeout(() => setOutfitSaved(false), 2500);
    } catch (error) {
      console.error("Error saving outfit:", error);
    } finally {
      setOutfitSaving(false);
    }
  };

  const handleRefreshWithLimit = async () => {
    if (!refreshStorageKey) return;

    const raw = await AsyncStorage.getItem(refreshStorageKey);
    let parsed: RefreshData = raw ? JSON.parse(raw) : getDefaultRefreshData();

    if (parsed.count >= MAX_REFRESHES) {
      const timeLeft = getTimeLeftFromCooldown(parsed.cooldownStartedAt);

      if (timeLeft <= 0) {
        parsed = getDefaultRefreshData();
        await AsyncStorage.setItem(refreshStorageKey, JSON.stringify(parsed));
        setRefreshCount(0);
        setCountdown("24:00:00");
      } else {
        setRefreshCount(parsed.count);
        setCountdown(formatTimeLeft(timeLeft));
        return;
      }
    }

    const newCount = parsed.count + 1;
    const updatedData: RefreshData = {
      count: newCount,
      cooldownStartedAt:
        newCount >= MAX_REFRESHES
          ? parsed.cooldownStartedAt || Date.now()
          : null,
    };

    await AsyncStorage.setItem(refreshStorageKey, JSON.stringify(updatedData));

    setRefreshCount(newCount);
    setRefreshing(true);
    pickRandomOutfit();

    if (newCount >= MAX_REFRESHES) {
      setCountdown("24:00:00");
    } else {
      setCountdown("24:00:00");
    }

    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <AppScreenWrapper>
      <Text style={styles.greeting}>
        {greeting}, {displayName} 👋
      </Text>
      <Text style={styles.sub}>Here&apos;s your style overview for today.</Text>

      {weather && (
        <View style={styles.weatherCard}>
          <View>
            <Text style={styles.weatherLabel}>Today&apos;s Weather</Text>
            <Text style={styles.weatherText}>🌤 {weather.condition}</Text>
          </View>
          <Text style={styles.weatherTemp}>{weather.temp}</Text>
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Closet Summary</Text>
        <Text style={styles.summaryText}>Total Items: {itemCount || "—"}</Text>
        <Text style={styles.summaryText}>
          Most Common Color: {mostCommonColor || "—"}
        </Text>
        <Text style={styles.summaryText}>
          Categories Covered: {categoriesCovered || "—"}
        </Text>
      </View>

      <Text style={styles.redTitle}>Today&apos;s Outfit Suggestion</Text>

      <View style={styles.outfitRow}>
        {suggestedProducts.map((product) => (
          <View key={product.id} style={styles.outfitBox}>
            <Image source={{ uri: product.image }} style={styles.outfitImage} />
            <Text style={styles.outfitLabel}>{product.category}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.redBtn, outfitSaved && styles.redBtnSaved]}
          onPress={handleSaveOutfit}
          disabled={outfitSaved || outfitSaving}
        >
          <Text style={styles.redBtnText}>
            {outfitSaved ? "✓ Saved!" : "Save Outfit"}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.redBtn,
            (limitReached || refreshing) && styles.redBtnMuted,
          ]}
          onPress={handleRefreshWithLimit}
          disabled={limitReached || refreshing}
        >
          <Text style={styles.redBtnText}>
            {limitReached
              ? "Limit reached"
              : refreshing
                ? "Refreshing..."
                : "↻ Try another"}
          </Text>
        </Pressable>
      </View>

      {limitReached && (
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>You can generate again in</Text>
          <Text style={styles.timerText}>{countdown}</Text>
        </View>
      )}

      <Pressable
        style={styles.detailsBtn}
        onPress={() => setShowDetailsModal(true)}
      >
        <Text style={styles.detailsText}>View details</Text>
      </Pressable>

      <Modal
        visible={showDetailsModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <Pressable
          style={styles.detailsModalBackdrop}
          onPress={() => setShowDetailsModal(false)}
        >
          <View style={styles.detailsModalCard}>
            <Text style={styles.detailsModalTitle}>Why this outfit?</Text>
            <Text style={styles.detailsModalBody}>
              Outfit curation details coming soon. This will explain why these
              pieces were selected for you based on your style profile, colour
              season, and wardrobe.
            </Text>
            <Pressable
              style={styles.detailsModalClose}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.detailsModalCloseText}>Got it</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Text style={styles.redTitle}>You Recently Added</Text>

      <View style={styles.recentRow}>
        {recentCartItems.length > 0 ? (
          recentCartItems.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.recentBox}>
              <Image source={{ uri: item.image }} style={styles.recentImage} />
              <Text style={styles.outfitLabel} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.summaryText}>
            Add items from the marketplace to see them here.
          </Text>
        )}
      </View>
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
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  summaryTitle: {
    ...typography.heading,
    color: colors.darkText,
    marginBottom: spacing.md,
  },
  summaryText: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  redTitle: {
    ...typography.heading,
    color: colors.buttonPrimary,
    marginBottom: spacing.md,
  },
  outfitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    flexWrap: "wrap",
  },
  outfitBox: {
    backgroundColor: "#ECE7E3",
    width: "23%",
    borderRadius: radius.lg,
    alignItems: "center",
    padding: spacing.sm,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  outfitImage: {
    width: "100%",
    height: 80,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: "#d6cfc9",
  },
  outfitPlaceholder: {
    width: "100%",
    height: 80,
    borderRadius: radius.md,
    backgroundColor: "#d6cfc9",
    marginBottom: spacing.xs,
  },
  outfitLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "capitalize",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  redBtn: {
    flex: 1,
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  redBtnSaved: {
    backgroundColor: "#5a7a4a",
  },
  redBtnMuted: {
    backgroundColor: "#C4B9B0",
  },
  redBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 18,
  },
  timerCard: {
    backgroundColor: "#F7F1ED",
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  timerLabel: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  timerText: {
    color: colors.buttonPrimary,
    fontSize: 28,
    fontWeight: "800",
  },
  detailsBtn: {
    alignSelf: "center",
    backgroundColor: "#ECE7E3",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.xxl,
  },
  detailsText: {
    ...typography.bodyMedium,
    color: colors.mutedText,
    fontWeight: "600",
  },
  detailsModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.xl,
  },
  detailsModalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  detailsModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.darkText,
  },
  detailsModalBody: {
    ...typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  detailsModalClose: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  detailsModalCloseText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  recentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  recentBox: {
    backgroundColor: "#ECE7E3",
    width: "31%",
    borderRadius: radius.lg,
    alignItems: "center",
    padding: spacing.sm,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  recentImage: {
    width: "100%",
    height: 100,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: "#d6cfc9",
  },
  recentPlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: radius.md,
    backgroundColor: "#d6cfc9",
    marginBottom: spacing.xs,
  },
  weatherCard: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  weatherText: {
    ...typography.body,
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  weatherTemp: {
    ...typography.heading,
    color: "#f0c040",
    fontWeight: "800",
    fontSize: 32,
  },
  weatherLabel: {
    color: "#ffcccc",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
