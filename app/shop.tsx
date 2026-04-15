import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppScreenWrapper from "../components/layout/AppScreenWrapper";
import { auth, db } from "../firebaseConfig";
import { colors } from "../styles/colors";
import { radius, spacing } from "../styles/spacing";
import { typography } from "../styles/typography";
import {
  addToCart,
  CartItem,
  getCartItems,
} from "./shop-cart";

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: "Tops" | "Bottoms" | "Shoes" | "Outerwear" | "Accessories";
  color: string;
  image: string;
  productUrl: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Classic White Tee",
    brand: "Nike",
    price: 35,
    category: "Tops",
    color: "White",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    productUrl: "https://nike.com",
  },
  {
    id: "2",
    name: "Slim Fit Oxford Shirt",
    brand: "Zara",
    price: 65,
    category: "Tops",
    color: "Blue",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400",
    productUrl: "https://zara.com",
  },
  {
    id: "3",
    name: "Relaxed Linen Shirt",
    brand: "H&M",
    price: 45,
    category: "Tops",
    color: "Beige",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400",
    productUrl: "https://hm.com",
  },
  {
    id: "4",
    name: "501 Original Jeans",
    brand: "Levi's",
    price: 98,
    category: "Bottoms",
    color: "Blue",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    productUrl: "https://levi.com",
  },
  {
    id: "5",
    name: "Tailored Trousers",
    brand: "Zara",
    price: 79,
    category: "Bottoms",
    color: "Black",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400",
    productUrl: "https://zara.com",
  },
  {
    id: "6",
    name: "Chino Pants",
    brand: "H&M",
    price: 55,
    category: "Bottoms",
    color: "Khaki",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400",
    productUrl: "https://hm.com",
  },
  {
    id: "7",
    name: "Air Force 1",
    brand: "Nike",
    price: 110,
    category: "Shoes",
    color: "White",
    image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400",
    productUrl: "https://nike.com",
  },
  {
    id: "8",
    name: "Stan Smith",
    brand: "Adidas",
    price: 95,
    category: "Shoes",
    color: "White",
    image: "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=400",
    productUrl: "https://adidas.com",
  },
  {
    id: "9",
    name: "Leather Ankle Boots",
    brand: "Zara",
    price: 129,
    category: "Shoes",
    color: "Brown",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400",
    productUrl: "https://zara.com",
  },
  {
    id: "10",
    name: "Windrunner Jacket",
    brand: "Nike",
    price: 120,
    category: "Outerwear",
    color: "Black",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    productUrl: "https://nike.com",
  },
  {
    id: "11",
    name: "Oversized Blazer",
    brand: "Zara",
    price: 149,
    category: "Outerwear",
    color: "Camel",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    productUrl: "https://zara.com",
  },
  {
    id: "12",
    name: "Canvas Tote Bag",
    brand: "H&M",
    price: 25,
    category: "Accessories",
    color: "Natural",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
    productUrl: "https://hm.com",
  },
{
    id: "12",
    name: "Canvas Tote Bag",
    brand: "H&M",
    price: 25,
    category: "Accessories",
    color: "Natural",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
    productUrl: "https://hm.com",
  },
  {
    id: "13",
    name: "Skinny Fit Jeans",
    brand: "Zara",
    price: 69,
    category: "Bottoms",
    color: "Black",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400",
    productUrl: "https://zara.com",
  },
  {
    id: "14",
    name: "Straight Leg Jeans",
    brand: "Gap",
    price: 79,
    category: "Bottoms",
    color: "Light Blue",
    image: "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=400",
    productUrl: "https://gap.com",
  },
  {
    id: "15",
    name: "Mom Jeans",
    brand: "Levi's",
    price: 89,
    category: "Bottoms",
    color: "White",
    image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=400",
    productUrl: "https://levi.com",
  },
  {
    id: "16",
    name: "Cargo Pants",
    brand: "H&M",
    price: 59,
    category: "Bottoms",
    color: "Olive",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400",
    productUrl: "https://hm.com",
  },
  {
    id: "17",
    name: "Wide Cargo Trousers",
    brand: "Zara",
    price: 75,
    category: "Bottoms",
    color: "Beige",
    image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400",
    productUrl: "https://zara.com",
  },
  {
    id: "18",
    name: "Essential Black Tee",
    brand: "Uniqlo",
    price: 19,
    category: "Tops",
    color: "Black",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
    productUrl: "https://uniqlo.com",
  },
  {
    id: "19",
    name: "Oversized Graphic Tee",
    brand: "H&M",
    price: 29,
    category: "Tops",
    color: "Grey",
    image: "https://images.unsplash.com/photo-1561365452-adb940139ffa?w=400",
    productUrl: "https://hm.com",
  },
  {
    id: "20",
    name: "Striped Tee",
    brand: "Gap",
    price: 32,
    category: "Tops",
    color: "Navy",
    image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400",
    productUrl: "https://gap.com",
  },
  {
    id: "21",
    name: "Flannel Shirt",
    brand: "Uniqlo",
    price: 49,
    category: "Tops",
    color: "Red",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
    productUrl: "https://uniqlo.com",
  },
  {
    id: "22",
    name: "Denim Shirt",
    brand: "Levi's",
    price: 65,
    category: "Tops",
    color: "Blue",
    image: "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=400",
    productUrl: "https://levi.com",
  },
  {
    id: "23",
    name: "Classic Pullover Hoodie",
    brand: "Nike",
    price: 65,
    category: "Tops",
    color: "Grey",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
    productUrl: "https://nike.com",
  },
  {
    id: "24",
    name: "Zip-Up Hoodie",
    brand: "Adidas",
    price: 70,
    category: "Tops",
    color: "Black",
    image: "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=400",
    productUrl: "https://adidas.com",
  },
  {
    id: "25",
    name: "Oversized Hoodie",
    brand: "H&M",
    price: 45,
    category: "Tops",
    color: "Cream",
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400",
    productUrl: "https://hm.com",
  },
  {
    id: "26",
    name: "Denim Jacket",
    brand: "Levi's",
    price: 110,
    category: "Outerwear",
    color: "Blue",
    image: "https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=400",
    productUrl: "https://levi.com",
  },
  {
    id: "27",
    name: "Puffer Jacket",
    brand: "Zara",
    price: 129,
    category: "Outerwear",
    color: "Black",
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400",
    productUrl: "https://zara.com",
  },
  {
    id: "28",
    name: "Leather Jacket",
    brand: "Zara",
    price: 169,
    category: "Outerwear",
    color: "Brown",
    image: "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=400",
    productUrl: "https://zara.com",
  },
  {
    id: "29",
    name: "Trench Coat",
    brand: "H&M",
    price: 119,
    category: "Outerwear",
    color: "Beige",
    image: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400",
    productUrl: "https://hm.com",
  },
  {
    id: "30",
    name: "Bucket Hat",
    brand: "Nike",
    price: 30,
    category: "Accessories",
    color: "Black",
    image: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400",
    productUrl: "https://nike.com",
  },
  {
    id: "31",
    name: "Leather Belt",
    brand: "Zara",
    price: 35,
    category: "Accessories",
    color: "Brown",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    productUrl: "https://zara.com",
  },
  {
    id: "32",
    name: "White Chunky Sneakers",
    brand: "Adidas",
    price: 110,
    category: "Shoes",
    color: "White",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    productUrl: "https://adidas.com",
  },
  {
    id: "33",
    name: "Black Loafers",
    brand: "Zara",
    price: 89,
    category: "Shoes",
    color: "Black",
    image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400",
    productUrl: "https://zara.com",
  },
];

const SIZES = ["XS", "S", "M", "L", "XL"] as const;
type Size = (typeof SIZES)[number];

const CATEGORY_TABS = [
  "All",
  "Tops",
  "Bottoms",
  "Shoes",
  "Outerwear",
  "Accessories",
] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

type ClosetCounts = { tops: number; bottoms: number; shoes: number };

function calcUnlockedOutfits(product: Product, closet: ClosetCounts): number {
  const { tops, bottoms, shoes } = closet;
  switch (product.category) {
    case "Tops":
      return bottoms * Math.max(shoes, 1);
    case "Bottoms":
      return tops * Math.max(shoes, 1);
    case "Shoes":
      return Math.max(tops, 1) * Math.max(bottoms, 1);
    case "Outerwear":
      return Math.max(tops, 1) * Math.max(bottoms, 1);
    case "Accessories":
      return Math.max(tops, 1);
    default:
      return 0;
  }
}

export default function ShopScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>("All");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [closetCounts, setClosetCounts] = useState<ClosetCounts>({
    tops: 0,
    bottoms: 0,
    shoes: 0,
  });
  const [cartCount, setCartCount] = useState(0);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size>("M");
  const [addedToCart, setAddedToCart] = useState(false);


  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) return;

      // Fetch closet counts
      const fetchCloset = async () => {
        const snap = await getDocs(
          query(collection(db, "closetItems"), where("userId", "==", user.uid))
        );
        const items = snap.docs.map((d) => d.data());
        setClosetCounts({
          tops: items.filter((i) =>
            ["tops", "top", "shirt"].includes(i.category?.toLowerCase() || "")
          ).length,
          bottoms: items.filter((i) =>
            ["bottoms", "bottom", "jeans", "pants"].includes(
              i.category?.toLowerCase() || ""
            )
          ).length,
          shoes: items.filter((i) =>
            ["shoes", "shoe", "sneakers"].includes(
              i.category?.toLowerCase() || ""
            )
          ).length,
        });
      };

      // Fetch cart count
      const fetchCart = async () => {
        const items = await getCartItems(user.uid);
        setCartCount(items.length);
      };

      fetchCloset();
      fetchCart();
    }, [])
  );

  const filtered = useMemo(() => {
    let list =
      selectedCategory === "All"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, search]);

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize("M");
    setAddedToCart(false);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    const cartItem: CartItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      brand: selectedProduct.brand,
      price: selectedProduct.price,
      image: selectedProduct.image,
      color: selectedProduct.color,
      size: selectedSize,
    };
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await addToCart(uid, cartItem);
    const updated = await getCartItems(uid);
    setCartCount(updated.length);
    setAddedToCart(true);
  };

  const unlocked = selectedProduct
    ? calcUnlockedOutfits(selectedProduct, closetCounts)
    : 0;

  return (
    <AppScreenWrapper>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Marketplace</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowSearch((v) => !v)}
            style={styles.iconBtn}
          >
            <Ionicons
              name={showSearch ? "close" : "search"}
              size={22}
              color={colors.darkText}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push("/shop-cart")}
            style={styles.iconBtn}
          >
            <Ionicons name="bag-outline" size={22} color={colors.darkText} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 9 ? "9+" : cartCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={16}
            color={colors.mutedText}
            style={{ marginRight: spacing.sm }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or brands..."
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      )}

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {CATEGORY_TABS.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.tab, selectedCategory === cat && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory === cat && styles.tabTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Product grid */}
      <View style={styles.grid}>
        {filtered.map((product) => {
          const outfitsUnlocked = calcUnlockedOutfits(product, closetCounts);
          return (
            <Pressable
              key={product.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => openProduct(product)}
            >
              <Image
                source={{ uri: product.image }}
                style={styles.productImage}
              />
              <View style={styles.cardBody}>
                <Text style={styles.brandName}>{product.brand}</Text>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.price}>${product.price}</Text>
                {outfitsUnlocked > 0 && (
                  <Text style={styles.unlocks}>
                    ✨ Unlocks {outfitsUnlocked} new outfit
                    {outfitsUnlocked !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 && (
        <Text style={styles.empty}>No products found.</Text>
      )}

      {/* Product detail modal */}
      <Modal
        visible={!!selectedProduct}
        animationType="fade"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={closeModal} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeModal} style={styles.modalCloseBtn} hitSlop={12}>
                <Ionicons name="close" size={20} color={colors.darkText} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
              bounces={false}
            >
              {selectedProduct && (
                <>
                  <Image
                    source={{ uri: selectedProduct.image }}
                    style={styles.modalImage}
                  />

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalBrand}>{selectedProduct.brand}</Text>
                    <Text style={styles.modalName}>{selectedProduct.name}</Text>
                    <Text style={styles.modalPrice}>${selectedProduct.price}</Text>

                    <View style={styles.modalColorRow}>
                      <Text style={styles.modalDetailLabel}>Color</Text>
                      <Text style={styles.modalDetailValue}>{selectedProduct.color}</Text>
                    </View>

                    <View style={styles.modalColorRow}>
                      <Text style={styles.modalDetailLabel}>Category</Text>
                      <Text style={styles.modalDetailValue}>{selectedProduct.category}</Text>
                    </View>

                    <View style={styles.modalColorRow}>
                      <Text style={styles.modalDetailLabel}>Description</Text>
                      <Text style={styles.modalDetailValue}>Details coming soon.</Text>
                    </View>

                    {unlocked > 0 && (
                      <View style={styles.unlocksBadge}>
                        <Text style={styles.unlocksBadgeText}>
                          ✨ Unlocks {unlocked} new outfit{unlocked !== 1 ? "s" : ""} with your closet
                        </Text>
                      </View>
                    )}

                    <Text style={styles.sizeLabel}>Size</Text>
                    <View style={styles.sizeRow}>
                      {SIZES.map((size) => (
                        <Pressable
                          key={size}
                          onPress={() => { setSelectedSize(size); setAddedToCart(false); }}
                          style={[styles.sizeChip, selectedSize === size && styles.sizeChipActive]}
                        >
                          <Text style={[styles.sizeChipText, selectedSize === size && styles.sizeChipTextActive]}>
                            {size}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Pressable
                      style={[styles.addToCartBtn, addedToCart && styles.addedBtn]}
                      onPress={handleAddToCart}
                      disabled={addedToCart}
                    >
                      <Text style={styles.addToCartText}>
                        {addedToCart ? "✓ Added to Cart" : "Add to Cart"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.darkText,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBtn: {
    padding: spacing.xs,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.buttonPrimary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.darkText,
    fontSize: 14,
  },
  tabsScroll: {
    marginBottom: spacing.lg,
  },
  tabsContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: "#EDE8E3",
  },
  tabActive: {
    backgroundColor: colors.buttonPrimary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkText,
  },
  tabTextActive: {
    color: colors.white,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  card: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  productImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#EDE8E3",
  },
  cardBody: {
    padding: spacing.md,
  },
  brandName: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkText,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: spacing.xs,
  },
  unlocks: {
    fontSize: 11,
    color: "#5a7a4a",
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    color: colors.mutedText,
    marginTop: 40,
    fontSize: 15,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.offWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
  },
  modalHeader: {
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  modalCloseBtn: {
    backgroundColor: "#EDE8E3",
    borderRadius: 20,
    padding: spacing.xs,
  },
  modalContent: {
    paddingBottom: 48,
  },
  modalImage: {
    width: "100%",
    height: 280,
    backgroundColor: "#EDE8E3",
  },
  modalInfo: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  modalBrand: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.darkText,
    lineHeight: 28,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.buttonPrimary,
    marginBottom: spacing.xs,
  },
  modalColorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#EDE8E3",
  },
  modalDetailLabel: {
    fontSize: 13,
    color: colors.mutedText,
    fontWeight: "500",
  },
  modalDetailValue: {
    fontSize: 13,
    color: colors.darkText,
    fontWeight: "600",
  },
  unlocksBadge: {
    backgroundColor: "#EAF4E4",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  unlocksBadgeText: {
    fontSize: 13,
    color: "#4a7a3a",
    fontWeight: "600",
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.darkText,
    marginTop: spacing.sm,
  },
  sizeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  sizeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#DDD5CE",
  },
  sizeChipActive: {
    backgroundColor: colors.buttonPrimary,
    borderColor: colors.buttonPrimary,
  },
  sizeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkText,
  },
  sizeChipTextActive: {
    color: colors.white,
  },
  addToCartBtn: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.md,
  },
  addedBtn: {
    backgroundColor: "#5a7a4a",
  },
  addToCartText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
