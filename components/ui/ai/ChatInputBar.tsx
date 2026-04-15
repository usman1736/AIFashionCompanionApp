import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "../../../styles/colors";
import { radius, spacing } from "../../../styles/spacing";
import { typography } from "../../../styles/typography";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onVoicePress: () => void;
  onCameraPress: () => void;
  onUploadPress: () => void;
  disabled?: boolean;
  isRecording?: boolean;
  pendingImageUri?: string | null;
  pendingAudioLabel?: string | null;
  onRemovePendingImage?: () => void;
  onRemovePendingAudio?: () => void;
};

export default function ChatInputBar({
  value,
  onChangeText,
  onSend,
  onVoicePress,
  onCameraPress,
  onUploadPress,
  disabled = false,
  isRecording = false,
  pendingImageUri,
  pendingAudioLabel,
  onRemovePendingImage,
  onRemovePendingAudio,
}: Props) {
  const hasDraftAttachment = Boolean(pendingImageUri || pendingAudioLabel);
  const canSend = (value.trim().length > 0 || hasDraftAttachment) && !disabled;

  return (
    <View style={styles.wrapper}>
      {pendingImageUri || pendingAudioLabel ? (
        <View style={styles.draftWrap}>
          {pendingImageUri ? (
            <View style={styles.previewCard}>
              <Image
                source={{ uri: pendingImageUri }}
                style={styles.previewImage}
              />
              <Pressable
                style={styles.removeBadge}
                onPress={onRemovePendingImage}
              >
                <Ionicons name="close" size={14} color={colors.white} />
              </Pressable>
            </View>
          ) : null}

          {pendingAudioLabel ? (
            <View style={styles.audioDraftChip}>
              <View style={styles.audioDraftLeft}>
                <Ionicons name="mic" size={16} color={colors.buttonPrimary} />
                <Text style={styles.audioDraftText}>{pendingAudioLabel}</Text>
              </View>

              <Pressable onPress={onRemovePendingAudio}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.mutedText}
                />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.iconButton, isRecording && styles.iconButtonActive]}
          onPress={onVoicePress}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isRecording ? "stop-circle" : "mic-outline"}
            size={20}
            color={isRecording ? colors.white : colors.buttonPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onCameraPress}
          activeOpacity={0.85}
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color={colors.buttonPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onUploadPress}
          activeOpacity={0.85}
        >
          <Ionicons
            name="image-outline"
            size={20}
            color={colors.buttonPrimary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            style={styles.input}
            multiline
            placeholder={
              pendingImageUri || pendingAudioLabel
                ? "Add a message to go with your attachment..."
                : "Ask Aura about style, outfits, colors, or dress codes..."
            }
            placeholderTextColor={colors.mutedText}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, !canSend && styles.buttonDisabled]}
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: spacing.sm,
  },
  draftWrap: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  previewCard: {
    alignSelf: "flex-start",
    position: "relative",
  },
  previewImage: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#EEE7DF",
  },
  removeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  audioDraftChip: {
    minHeight: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EEE7DF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  audioDraftLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  audioDraftText: {
    ...typography.body,
    color: colors.darkText,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mutedText,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActive: {
    backgroundColor: colors.buttonPrimary,
    borderColor: colors.buttonPrimary,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  inputContainer: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.mutedText,
    justifyContent: "center",
  },
  input: {
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.darkText,
    ...typography.body,
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.md,
    height: 48,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
});
