import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
