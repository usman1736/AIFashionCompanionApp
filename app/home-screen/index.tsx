import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../../firebaseConfig";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import AppScreenWrapper from "../../components/layout/AppScreenWrapper";
import { db } from "../../firebaseConfig";
import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

export default function HomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [itemCount, setItemCount] = useState(0);
  const [greeting, setGreeting] = useState("");
  const [items, setItems] = useState<any[]>([]);
const [top, setTop] = useState<any | null>(null);
const [bottom, setBottom] = useState<any | null>(null);
const [shoes, setShoes] = useState<any | null>(null);
const [accessory, setAccessory] = useState<any | null>(null);

const [refreshCount, setRefreshCount] = useState(0);
const [weather, setWeather] = useState<{ temp: string; condition: string } | null>(null);



const fetchWeather = async () => {
  try {
    setWeather({ temp: "2°C", condition: "Partly Cloudy" });
    return;
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.05&longitude=-114.07&current_weather=true"
    );
    const data = await res.json();
    const temp = Math.round(data.current_weather.temperature);
    const code = data.current_weather.weathercode;
    const condition =
      code === 0 ? "Clear sky" :
      code <= 3 ? "Partly cloudy" :
      code <= 48 ? "Foggy" :
      code <= 67 ? "Rainy" :
      code <= 77 ? "Snowy" :
      "Cloudy";
    setWeather({ temp: `${temp}°C`, condition });
  } catch (e) {
    console.log("Weather error:", e);
    setWeather({ temp: "—°C", condition: "Unavailable" });
  }
};


  useFocusEffect(
    useCallback(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");

      const loadRefreshCount = async () => {
        const today = new Date().toDateString();
        const storedDate = await AsyncStorage.getItem("refreshDate");
        const storedCount = await AsyncStorage.getItem("refreshCount");
      
        if (storedDate !== today) {
          await AsyncStorage.setItem("refreshDate", today);
          await AsyncStorage.setItem("refreshCount", "0");
          setRefreshCount(0);
        } else {
          setRefreshCount(storedCount ? Number(storedCount) : 0);
        }
      };
      loadRefreshCount();

fetchWeather();



      console.log("🔥 HOME SCREEN USER:", user);
      console.log("🔥 HOME SCREEN UID:", user?.uid);
      
      if (!user) {
        console.log("🔥 NO USER ON HOME SCREEN");
        return;
      }
      
      const fetchCount = async () => {
        console.log("🔥 FETCHING COUNT FOR USER:", user.uid);


        const q = query(
          collection(db, "closetItems"),
          where("userId", "==", user.uid),
        );
      
        const snap = await getDocs(q);
      
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("🔥 DATA:", data);
      
        console.log("HOME ITEMS:", data);
        
      
        setItems(data);
        setItemCount(data.length);
      
        setTop(
          data.find((i: any) =>
            ["top", "tops", "shirt"].includes(i.category?.toLowerCase?.() || "")
          ) || null
        );
      
        setBottom(
          data.find((i: any) =>
            ["bottom", "bottoms", "jeans", "pants"].includes(i.category?.toLowerCase?.() || "")
          ) || null
        );
      
        setShoes(
          data.find((i: any) =>
            ["shoes", "shoe", "sneakers"].includes(i.category?.toLowerCase?.() || "")
          ) || null
        );
      
        setAccessory(
          data.find((i: any) =>
            ["accessory", "accessories", "bag"].includes(i.category?.toLowerCase?.() || "")
          ) || null
        );
      };
      fetchCount();
    }, [user]),
  );
  const colorsList = items.map((i: any) => i.color).filter(Boolean);

  const mostCommonColor =
    colorsList.length > 0
      ? colorsList.sort(
          (a, b) =>
            colorsList.filter((v) => v === b).length -
            colorsList.filter((v) => v === a).length
        )[0]
      : "—";
  
  const categoriesCovered = new Set(
    items.map((i: any) => i.category).filter(Boolean)
  ).size;
  
  const recentItems = items.slice(-3).reverse();



  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Stylist";

    const handleSaveOutfit = async () => {
      if (!user) return;
    
      const currentOutfit = [top, bottom, shoes, accessory].filter(Boolean);
    
      if (currentOutfit.length === 0) {
        console.log("No outfit to save");
        return;
      }
    
      try {
        await addDoc(collection(db, "savedStyles"), {
          userId: user.uid,
          title: "Saved from Home",
          occasion: "",
          matchPercentage: undefined,
          source: "home",
          reason: "",
          pieces: currentOutfit.map((item: any) => ({
            id: item.id,
            label: item.category || "Item",
            imageUrl: item.imageUrl || item.image || "",
            category: item.category || "",
            color: item.color || "",
            brand: item.brand || "",
          })),
          suggestedSizes: [],
          createdAt: new Date(),
        });
    
        console.log("Outfit saved successfully");
      } catch (error) {
        console.error("Error saving outfit:", error);
      }
    };


    const handleTryAnother = () => {
      if (items.length === 0) return;
    
      const pickRandom = (list: any[]) =>
        list[Math.floor(Math.random() * list.length)] || null;
    
      const tops = items.filter((i: any) =>
        ["top", "tops", "shirt"].includes(i.category?.toLowerCase?.() || "")
      );
    
      const bottoms = items.filter((i: any) =>
        ["bottom", "bottoms", "jeans", "pants"].includes(i.category?.toLowerCase?.() || "")
      );
    
      const shoesList = items.filter((i: any) =>
        ["shoes", "shoe", "sneakers"].includes(i.category?.toLowerCase?.() || "")
      );
    
      const accessories = items.filter((i: any) =>
        ["accessory", "accessories", "bag"].includes(i.category?.toLowerCase?.() || "")
      );
    
      setTop(pickRandom(tops));
      setBottom(pickRandom(bottoms));
      setShoes(pickRandom(shoesList));
      setAccessory(pickRandom(accessories));
    };


    const handleRefreshWithLimit = async () => {
      const today = new Date().toDateString();
      const storedDate = await AsyncStorage.getItem("refreshDate");
      const storedCount = await AsyncStorage.getItem("refreshCount");
    
      let count = storedCount ? Number(storedCount) : 0;
    
      if (storedDate !== today) {
        count = 0;
        await AsyncStorage.setItem("refreshDate", today);
        await AsyncStorage.setItem("refreshCount", "0");
      }
    
      if (count >= 5) {
        console.log("Refresh limit reached");
        return;
      }
    
      const newCount = count + 1;
      await AsyncStorage.setItem("refreshCount", String(newCount));
      setRefreshCount(newCount);
    
      handleTryAnother();
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
      <Text style={styles.weatherLabel}>Today's Weather</Text>
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
    <View style={styles.outfitBox}>
      <Text style={styles.outfitLabel}>{top?.category || "Top"}</Text>
    </View>
    <View style={styles.outfitBox}>
      <Text style={styles.outfitLabel}>{bottom?.category || "Bottom"}</Text>
    </View>
    <View style={styles.outfitBox}>
      <Text style={styles.outfitLabel}>{shoes?.category || "Shoes"}</Text>
    </View>
    <View style={styles.outfitBox}>
      <Text style={styles.outfitLabel}>{accessory?.category || "Accessory"}</Text>
    </View>
  </View>

  <View style={styles.buttonRow}>
    <Pressable
      style={styles.redBtn}
      onPress={handleSaveOutfit}
    >
      <Text style={styles.redBtnText}> Save Outfit</Text>
    </Pressable>

    <Pressable
  style={styles.redBtn}
  onPress={handleRefreshWithLimit}
  disabled={refreshCount >= 5}
>
  <Text style={styles.redBtnText}>
    {refreshCount >= 5 ? "Limit reached" : "↻ Try another"}
  </Text>
</Pressable>
  </View>

  <Pressable
    style={styles.detailsBtn}
    onPress={() => router.push("/home-screen/outfit")}
  >
    <Text style={styles.detailsText}>View details</Text>
  </Pressable>

  <Text style={styles.redTitle}>You Recently Added</Text>

  <View style={styles.recentRow}>
    {recentItems.length > 0 ? (
      recentItems.map((item: any) => (
        <View key={item.id} style={styles.recentBox}>
          <Text style={styles.outfitLabel}>{item.category || "Item"}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.summaryText}>No recent items found.</Text>
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
    minHeight: 100,
    borderRadius: radius.lg,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  
  outfitLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textTransform: "capitalize",
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
  
  redBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 18,
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
  
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  
  recentBox: {
    backgroundColor: "#ECE7E3",
    width: "31%",
    minHeight: 120,
    borderRadius: radius.lg,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: spacing.sm,
    marginBottom: spacing.md,
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
