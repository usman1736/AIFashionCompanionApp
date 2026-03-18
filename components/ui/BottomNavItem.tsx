import React, { memo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/colors";
import { hitSlop, normalizeFont, spacing } from "../../styles/spacing";

type BottomNavItemProps = {
  label: string;
  icon: any;
  active?: boolean;
  onPress?: () => void;
};

function BottomNavItemComponent({
  label,
  icon,
  active = false,
  onPress,
}: BottomNavItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={hitSlop}
    >
      <View style={styles.inner}>
        <Image source={icon} style={[styles.icon, { tintColor: active ? colors.buttonPrimary : "#8A8A8A" }]} resizeMode="contain" />

        <Text style={[styles.label, active && styles.activeLabel]}>
          {label}
        </Text>

        <View style={styles.indicatorWrap}>
          {active && <View style={styles.activeLine} />}
        </View>
      </View>
    </Pressable>
  );
}

export default memo(BottomNavItemComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  inner: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    minWidth: 56,
  },

  icon: {
    width: 24,
    height: 24,
  },

  label: {
    fontSize: normalizeFont(12),
    marginTop: 2,
    color: "#8A8A8A",
    fontWeight: "500",
  },

  activeLabel: {
    color: colors.buttonPrimary,
    fontWeight: "700",
  },

  indicatorWrap: {
    minHeight: 8,
    justifyContent: "flex-end",
  },

  activeLine: {
    marginTop: 4,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.buttonPrimary,
  },
});
