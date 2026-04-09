import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/colors";
import { normalizeFont, radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

type MeasurementChoiceCardProps = {
  title: string;
  description: string;
  icon: string;
  onPress?: () => void;
};

function MeasurementChoiceCardComponent({
  title,
  description,
  icon,
  onPress,
}: MeasurementChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

export default memo(MeasurementChoiceCardComponent);

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F1E6DA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    flexShrink: 0,
  },
  icon: {
    fontSize: normalizeFont(24),
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: "700",
    color: colors.buttonPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    lineHeight: 18,
    color: "#6B5E57",
  },
});
