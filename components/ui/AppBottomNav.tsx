import { usePathname, useRouter } from "expo-router";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import BottomNavItem from "../ui/BottomNavItem";

function AppBottomNavComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, 4);
  const navHeight = 64 + bottomInset;

  return (
    <View
      style={[
        styles.container,
        {
          height: navHeight,
          paddingBottom: bottomInset,
        },
      ]}
    >
      <BottomNavItem
        label="Home"
        icon={require("../../assets/icons/home-icon.png")}
        active={pathname.startsWith("/home-screen")}
        onPress={() => {
          if (pathname !== "/home-screen") router.replace("/home-screen");
        }}
      />

      <BottomNavItem
        label="Closet"
        icon={require("../../assets/icons/closet-icon.png")}
        active={pathname.startsWith("/closet")}
        onPress={() => {
          if (pathname !== "/closet") router.replace("/closet");
        }}
      />

      <BottomNavItem
        label="AI"
        icon={require("../../assets/icons/ai-icon.png")}
        active={pathname.startsWith("/ai")}
        onPress={() => {
          if (pathname !== "/ai") router.replace("/ai");
        }}
      />

      <BottomNavItem
        label="Shop"
        icon={require("../../assets/icons/shop-icon.png")}
        active={pathname.startsWith("/shop")}
        onPress={() => {
          if (pathname !== "/shop") router.replace("/shop");
        }}
      />

      <BottomNavItem
        label="Profile"
        icon={require("../../assets/icons/profile-icon.png")}
        active={pathname === "/profile" || ["/profile-measurements", "/edit-profile", "/saved-styles"].includes(pathname)}
        onPress={() => {
          if (pathname !== "/profile") router.replace("/profile");
        }}
      />
    </View>
  );
}

export default memo(AppBottomNavComponent);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E5DDD4",
    paddingTop: spacing.xs,
  },
});
