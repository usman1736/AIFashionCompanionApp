import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/colors";
import { normalizeFont, spacing } from "../../styles/spacing";

type ProductThumbCardProps = {
  title: string;
};

function ProductThumbCardComponent({ title }: ProductThumbCardProps) {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.imagePlaceholder} />
      <Text numberOfLines={2} style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

export default memo(ProductThumbCardComponent);

const styles = StyleSheet.create({
  card: {
    width: 112,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: spacing.sm,
  },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 0.85,
    borderRadius: 8,
    backgroundColor: "#E7DFD6",
    borderWidth: 1,
    borderColor: "#D7CEC4",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
    color: colors.darkText,
    minHeight: 32,
  },
});
