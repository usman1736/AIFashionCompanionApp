import { Ionicons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors } from "../../styles/colors";
import {
  hitSlop,
  iconSizes,
  normalizeFont,
  radius,
  spacing,
} from "../../styles/spacing";
import { typography } from "../../styles/typography";

type Props = TextInputProps & {
  placeholder: string;
  label?: string;
  error?: string;
};

function AuthPasswordInputComponent({
  placeholder,
  style,
  label,
  error,
  ...rest
}: Props) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.inputWrap}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={hidden}
          style={[styles.input, error ? styles.inputError : null, style]}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
        />

        <Pressable
          onPress={() => setHidden((prev) => !prev)}
          style={styles.iconButton}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Show password" : "Hide password"}
        >
          <Ionicons
            name={hidden ? "eye-outline" : "eye-off-outline"}
            size={iconSizes.md}
            color={colors.buttonPrimary}
          />
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default memo(AuthPasswordInputComponent);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    ...typography.caption,
    color: colors.buttonPrimary,
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  inputWrap: {
    width: "100%",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    backgroundColor: colors.white,
    minHeight: 50,
    borderRadius: radius.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xxxl,
    paddingVertical: spacing.md,
    fontSize: normalizeFont(14),
    color: colors.buttonPrimary,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "#B3261E",
  },
  iconButton: {
    position: "absolute",
    right: spacing.md,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    ...typography.caption,
    color: "#B3261E",
    marginTop: spacing.xs,
  },
});
