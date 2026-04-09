import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "../../styles/colors";

type Props = {
  color: string;
  selected?: boolean;
  onPress?: () => void;
};

export default function ColorCircle({
  color,
  selected = false,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.outer, selected && styles.outerSelected]}
    >
      <View style={[styles.circle, { backgroundColor: color }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  outerSelected: {
    borderWidth: 2,
    borderColor: colors.buttonPrimary,
    backgroundColor: "#F4ECE3",
  },

  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
