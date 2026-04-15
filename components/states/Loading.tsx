import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../../styles/colors";

type LoadingProps = {
  fullScreen?: boolean;
};

export default function Loading({ fullScreen = false }: LoadingProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={colors.buttonPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
});
