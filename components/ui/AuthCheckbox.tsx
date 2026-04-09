import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/colors";
import { hitSlop, normalizeFont, radius, spacing } from "../../styles/spacing";

type AuthCheckboxProps = {
  label?: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
};

export default function AuthCheckbox({
  label = "Remember me",
  value,
  onChange,
}: AuthCheckboxProps) {
  const [internalChecked, setInternalChecked] = useState(true);

  const checked = value ?? internalChecked;

  const toggle = () => {
    const newValue = !checked;
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalChecked(newValue);
    }
  };

  return (
    <Pressable
      onPress={toggle}
      style={styles.container}
      hitSlop={hitSlop}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={[styles.box, checked && styles.checked]} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  box: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: colors.buttonPrimary,
    borderRadius: radius.sm / 2,
    marginRight: spacing.sm,
    backgroundColor: "transparent",
  },
  checked: {
    backgroundColor: colors.buttonPrimary,
  },
  text: {
    fontSize: normalizeFont(12),
    color: colors.buttonPrimary,
  },
});
