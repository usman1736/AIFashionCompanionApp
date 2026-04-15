import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../styles/colors";
import { normalizeFont, radius, spacing } from "../../styles/spacing";

type Props = {
  label: string;
  icon: string;
  selected?: boolean;
  onPress?: () => void;
};

export default function SeasonOption({
  label,
  icon,
  selected = false,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, selected && styles.selected]}
    >
      <Text style={styles.icon}>{icon}</Text>

      <Text style={[styles.text, selected && styles.selectedText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EFEAE5",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    width: 78,
    minHeight: 82,
  },

  selected: {
    borderWidth: 2,
    borderColor: colors.buttonPrimary,
    backgroundColor: "#F7F1EB",
  },

  icon: {
    fontSize: normalizeFont(20),
    marginBottom: spacing.xs,
  },

  text: {
    fontSize: normalizeFont(12),
    textAlign: "center",
    color: colors.darkText,
  },

  selectedText: {
    color: colors.buttonPrimary,
    fontWeight: "600",
  },
});
