import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect,  useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import AppScreenWrapper from "../components/layout/AppScreenWrapper";
import { colors } from "../styles/colors";
import { radius, spacing } from "../styles/spacing";
import { typography } from "../styles/typography";

export type CartItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  color: string;
  size: string;
};

const cartKey = (userId: string) => `aura_cart_items_${userId}`;

export async function getCartItems(userId: string): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(cartKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCartItems(userId: string, items: CartItem[]): Promise<void> {
  await AsyncStorage.setItem(cartKey(userId), JSON.stringify(items));
}

export async function addToCart(userId: string, item: CartItem): Promise<void> {
  const current = await getCartItems(userId);
  const exists = current.some((c) => c.id === item.id && c.size === item.size);
  if (!exists) {
    await saveCartItems(userId, [...current, item]);
  }
}

export async function removeFromCart(userId: string, id: string, size: string): Promise<CartItem[]> {
  const current = await getCartItems(userId);
  const updated = current.filter((c) => !(c.id === id && c.size === size));
  await saveCartItems(userId, updated);
  return updated;
}

export default function ShopCartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid ?? null;
      setCurrentUid(uid);
      if (uid) {
        getCartItems(uid).then(setCartItems);
      } else {
        setCartItems([]);
      }
    });
    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      setCurrentUid(uid);
      getCartItems(uid).then(setCartItems);
    }, [])
  );

  const handleRemove = async (id: string, size: string) => {
    const uid = currentUid ?? auth.currentUser?.uid;
    if (!uid) return;
    const updated = await removeFromCart(uid, id, size);
    setCartItems(updated);
  };
const handleCheckout = () => {
    Alert.alert(
      "Coming Soon",
      "Checkout will be available in a future update. Stay tuned!",
      [{ text: "OK" }]
    );
  };


  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <AppScreenWrapper>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.buttonPrimary} />
        </Pressable>
        <Text style={styles.title}>My Cart</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="bag-outline" size={56} color={colors.mutedText} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse the marketplace and add items you love.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {cartItems.map((item, index) => (
              <View key={`${item.id}-${item.size}-${index}`} style={styles.itemCard}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Size: {item.size} · {item.color}
                  </Text>
                  <Text style={styles.itemPrice}>${item.price}</Text>
                </View>
                <Pressable
                  onPress={() => handleRemove(item.id, item.size)}
                  style={styles.removeBtn}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={20} color="#C0392B" />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total}</Text>
            </View>
           <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Checkout</Text>
            </Pressable>
          </View>
        </>
      )}
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.darkText,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.darkText,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: "center",
    paddingHorizontal: spacing.xxl,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: "#EDE8E3",
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemBrand: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.darkText,
    lineHeight: 19,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.mutedText,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginTop: 2,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  footer: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#EDE8E3",
    gap: spacing.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.darkText,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.buttonPrimary,
  },
  checkoutBtn: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  checkoutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
