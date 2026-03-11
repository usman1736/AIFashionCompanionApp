import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../../styles/colors";
import { radius, spacing } from "../../styles/spacing";

type AuthCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function AuthCard({ children, style }: AuthCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.buttonSecondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
});
