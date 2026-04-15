import React, { memo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { colors } from "../../styles/colors";
import { normalizeFont, radius, spacing } from "../../styles/spacing";

type AuthButtonProps = {
  title: string;
  variant?: "primary" | "secondary";
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
};

function AuthButtonComponent({
  title,
  variant = "primary",
  onPress,
  style,
  disabled = false,
  loading = false,
}: AuthButtonProps) {
  const isPrimary = variant === "primary";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !isDisabled
          ? isPrimary
            ? styles.primaryPressed
            : styles.secondaryPressed
          : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? colors.white : colors.buttonSecondaryText}
        />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.primaryText : styles.secondaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export default memo(AuthButtonComponent);

const styles = StyleSheet.create({
  base: {
    width: "100%",
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primary: {
    backgroundColor: colors.buttonPrimary,
  },
  primaryPressed: {
    backgroundColor: colors.buttonPrimaryPressed,
  },
  secondary: {
    backgroundColor: colors.buttonSecondary,
  },
  secondaryPressed: {
    backgroundColor: colors.buttonSecondaryPressed,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: normalizeFont(16),
    fontWeight: "700",
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.buttonSecondaryText,
  },
});
