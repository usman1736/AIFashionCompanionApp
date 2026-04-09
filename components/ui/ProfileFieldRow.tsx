import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

type ProfileFieldRowProps = {
  label: string;
  value: string;
  showDivider?: boolean;
};

function ProfileFieldRowComponent({
  label,
  value,
  showDivider = true,
}: ProfileFieldRowProps) {
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>

        <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
      </View>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

export default memo(ProfileFieldRowComponent);

const styles = StyleSheet.create({
  row: {
    minHeight: 54,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    ...typography.bodyMedium,
    fontWeight: "600",
    color: colors.darkText,
    flexShrink: 1,
    paddingRight: spacing.sm,
  },

  value: {
    ...typography.body,
    color: colors.mutedText,
    maxWidth: "55%",
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "#ECE5DD",
  },
});
