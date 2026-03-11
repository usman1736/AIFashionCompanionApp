import React from "react";
import {
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import AppBottomNav from "../ui/AppBottomNav";

type Props = {
  children: React.ReactNode;
  backgroundColor?: string;
  withBottomNav?: boolean;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
};

export default function AppScreenWrapper({
  children,
  backgroundColor = colors.offWhite,
  withBottomNav = true,
  scrollProps,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTablet = width >= 768;
  const contentWidth = isTablet
    ? Math.min(width - 64, 960)
    : Math.min(width - 32, 420);

  const bottomInset = Math.max(insets.bottom, 4);
  const bottomNavHeight = withBottomNav ? 64 + bottomInset : 0;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={[styles.container, { backgroundColor }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: spacing.md,
              paddingBottom: bottomNavHeight + spacing.xl,
            },
          ]}
          {...scrollProps}
        >
          <View style={[styles.content, { width: contentWidth }]}>
            {children}
          </View>
        </ScrollView>

        {withBottomNav ? <AppBottomNav /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
  },
  content: {
    alignSelf: "center",
  },
});
