import React, { memo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../styles/colors";
import { normalizeFont, radius, spacing } from "../../styles/spacing";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

function OptionChipComponent({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default memo(OptionChipComponent);

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#E7E2DD",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    backgroundColor: colors.buttonPrimary,
  },
  text: {
    fontSize: normalizeFont(13),
    color: "#333",
    textAlign: "center",
  },
  selectedText: {
    color: colors.white,
    fontWeight: "600",
  },
});
