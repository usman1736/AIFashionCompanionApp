import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "../../../styles/colors";
import { radius, spacing } from "../../../styles/spacing";
import { typography } from "../../../styles/typography";

type Props = {
  title: string;
  description: string;
  buttonText: string;
  icon: ImageSourcePropType;
  onPress: () => void;
};

export default function FeatureCard({
  title,
  description,
  buttonText,
  icon,
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Image source={icon} style={styles.icon} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.offWhite,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...typography.heading,
    color: colors.darkText,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.mutedText,
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
});
