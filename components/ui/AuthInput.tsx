import React, { memo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors } from "../../styles/colors";
import { normalizeFont, radius, spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";

type Props = TextInputProps & {
  placeholder: string;
  label?: string;
  error?: string;
};

function AuthInputComponent({
  placeholder,
  style,
  label,
  error,
  ...rest
}: Props) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9E9E9E"
        style={[styles.input, error ? styles.inputError : null, style]}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default memo(AuthInputComponent);

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
  input: {
    width: "100%",
    backgroundColor: "#EFEFEF",
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: normalizeFont(14),
    color: colors.darkText,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "#B3261E",
  },
  errorText: {
    ...typography.caption,
    color: "#B3261E",
    marginTop: spacing.xs,
  },
});
