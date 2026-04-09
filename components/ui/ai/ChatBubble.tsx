import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "../../../styles/colors";
import { radius, spacing } from "../../../styles/spacing";
import { typography } from "../../../styles/typography";
import { AIMessage, AIOutfit } from "../../../types/ai";
import AIOutfitCard from "./AIOutfitCard";

type Props = {
  message: AIMessage;
  onSaveOutfit?: (outfit: AIOutfit) => void;
  isTyping?: boolean;
};

export default function ChatBubble({
  message,
  onSaveOutfit,
  isTyping = false,
}: Props) {
  const isUser = message.sender === "user";
  const outfit = message.outfit;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {!isUser ? <Text style={styles.assistantLabel}>Aura</Text> : null}

        {!!message.imageUri && (
          <Image source={{ uri: message.imageUri }} style={styles.image} />
        )}

        {!!message.imageSourceLabel && (
          <Text
            style={[
              styles.metaText,
              isUser ? styles.userMetaText : styles.assistantMetaText,
            ]}
          >
            {message.imageSourceLabel}
          </Text>
        )}

        {!!message.audioSourceLabel && (
          <View
            style={[
              styles.attachmentChip,
              isUser
                ? styles.userAttachmentChip
                : styles.assistantAttachmentChip,
            ]}
          >
            <Text
              style={[
                styles.attachmentChipText,
                isUser
                  ? styles.userAttachmentChipText
                  : styles.assistantAttachmentChipText,
              ]}
            >
              {message.audioSourceLabel}
            </Text>
          </View>
        )}

        {isTyping ? (
          <Text style={[styles.text, styles.assistantText]}>
            Aura is typing…
          </Text>
        ) : null}

        {!isTyping && !!message.text && (
          <Text
            style={[
              styles.text,
              isUser ? styles.userText : styles.assistantText,
            ]}
          >
            {message.text}
          </Text>
        )}

        {!isTyping && !!outfit && !!onSaveOutfit ? (
          <AIOutfitCard outfit={outfit} onSave={() => onSaveOutfit(outfit)} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    marginBottom: spacing.md,
  },
  rowUser: {
    alignItems: "flex-end",
  },
  rowAssistant: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "86%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
  },
  userBubble: {
    backgroundColor: colors.buttonPrimary,
    borderBottomRightRadius: radius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EEE7DF",
    borderBottomLeftRadius: radius.sm,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  assistantLabel: {
    ...typography.caption,
    color: colors.buttonPrimary,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    alignSelf: "center",
  },
  metaText: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  userMetaText: {
    color: colors.white,
    opacity: 0.85,
  },
  assistantMetaText: {
    color: colors.mutedText,
  },
  attachmentChip: {
    alignSelf: "flex-start",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  userAttachmentChip: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  assistantAttachmentChip: {
    backgroundColor: colors.offWhite,
  },
  attachmentChipText: {
    ...typography.caption,
    fontWeight: "700",
  },
  userAttachmentChipText: {
    color: colors.white,
  },
  assistantAttachmentChipText: {
    color: colors.darkText,
  },
  text: {
    ...typography.body,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.darkText,
  },
});
