import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyState from "../../components/states/EmptyState";
import Loading from "../../components/states/Loading";
import ChatBubble from "../../components/ui/ai/ChatBubble";
import ChatInputBar from "../../components/ui/ai/ChatInputBar";

import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { createSavedStyle } from "../../services/firebase/savedStylesService";
import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { AIMessage, AIOutfit } from "../../types/ai";

type ClosetItem = {
  category: string;
  color: string;
  brand?: string;
};

function createTextMessage(
  sender: "user" | "assistant",
  text: string,
  createdAt = Date.now(),
): AIMessage {
  return {
    id: `${sender}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
    createdAt,
  };
}

function createOutfitMessage(
  outfit: AIOutfit,
  createdAt = Date.now(),
): AIMessage {
  return {
    id: `assistant-outfit-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    sender: "assistant",
    createdAt,
    outfit,
  };
}

function normalizeText(text: string) {
  return text.trim().toLowerCase();
}

function isGreeting(text: string) {
  const normalized = normalizeText(text);
  return normalized === "hi" || normalized === "hello" || normalized === "hey";
}

function isNavyBlueColorQuestion(text: string) {
  const normalized = normalizeText(text);

  const asksAboutColors =
    normalized.includes("what colour looks good with navy blue") ||
    normalized.includes("what color looks good with navy blue") ||
    normalized.includes("colours that look good with navy blue") ||
    normalized.includes("colors that look good with navy blue") ||
    normalized.includes("what goes with navy blue") ||
    normalized.includes("what matches navy blue");

  return asksAboutColors;
}

function isNavyBlueOutfitRequest(text: string) {
  const normalized = normalizeText(text);

  const mentionsNavyBlue = normalized.includes("navy blue");
  const asksForOutfit =
    normalized.includes("create me an outfit") ||
    normalized.includes("make me an outfit") ||
    normalized.includes("build me an outfit") ||
    normalized.includes("can you create me an outfit") ||
    normalized.includes("outfit");

  return mentionsNavyBlue && asksForOutfit;
}

function getHardcodedTextReply(message: string): string {
  if (isGreeting(message)) {
    return (
      "Hi, I’m Aura, your personal AI fashion companion. " +
      "I can help you with outfit ideas, color matching, and styling suggestions " +
      "to help you put together a polished look."
    );
  }

  if (isNavyBlueColorQuestion(message)) {
    return [
      "These colours look especially good with navy blue:",
      "",
      "• White — creates a clean and crisp contrast.",
      "• Beige or cream — gives a softer, more polished look.",
      "• Light grey — keeps the outfit balanced and modern.",
      "• Camel or tan — adds warmth and makes navy feel richer.",
      "• Blush pink — gives a subtle, stylish contrast.",
      "• Burgundy — works well because both colours feel deep and refined.",
      "• Olive green — adds an earthy tone that pairs nicely with navy.",
      "",
      "If you want, I can also build you an outfit using navy blue.",
    ].join("\n");
  }

  return (
    "I can help with outfit ideas, color matching, and style suggestions. " +
    "Try asking me something like “what colour looks good with navy blue” " +
    "or “can you create me an outfit that has navy blue.”"
  );
}

function getHardcodedOutfit(): AIOutfit {
  return {
    title: "Navy Blue Smart Casual Outfit",
    occasion: "Smart casual / everyday outing",
    matchPercentage: 96,
    reason:
      "This outfit keeps navy blue as the main colour and pairs it with clean neutral tones for a polished and balanced look.",
    pieces: [
      { id: "top-1", label: "Top: White fitted t-shirt or white button-up" },
      {
        id: "outer-1",
        label: "Outerwear: Navy blue overshirt or light jacket",
      },
      { id: "bottom-1", label: "Bottom: Beige or light grey trousers" },
      { id: "shoes-1", label: "Shoes: White sneakers or tan loafers" },
      {
        id: "accessory-1",
        label: "Accessory: Silver watch or simple navy bag",
      },
    ],
    suggestedSizes: [
      "Top: true to size",
      "Bottom: regular fit",
      "Outerwear: slightly relaxed fit",
    ],
  };
}

function getHardcodedAssistantMessages(message: string): AIMessage[] {
  if (isGreeting(message)) {
    return [createTextMessage("assistant", getHardcodedTextReply(message))];
  }

  if (isNavyBlueColorQuestion(message)) {
    return [createTextMessage("assistant", getHardcodedTextReply(message))];
  }

  if (isNavyBlueOutfitRequest(message)) {
    const createdAt = Date.now();
    const introMessage = createTextMessage(
      "assistant",
      "Absolutely — here is a navy blue outfit idea you can save.",
      createdAt,
    );

    const outfitMessage = createOutfitMessage(
      getHardcodedOutfit(),
      createdAt + 1,
    );

    return [introMessage, outfitMessage];
  }

  return [createTextMessage("assistant", getHardcodedTextReply(message))];
}

function getInitialGreeting(mode?: string) {
  if (mode === "outfit") {
    return "Hi, I’m Aura, your personal AI fashion companion. Tell me what kind of outfit you want and I’ll help you put one together.";
  }

  if (mode === "closet") {
    return "Hi, I’m Aura, your personal AI fashion companion. Ask me how to style the pieces in your closet and I’ll help you build a look.";
  }

  return "Hi, I’m Aura, your personal AI fashion companion. I can help with outfit ideas, color matching, and styling suggestions.";
}

export default function AIChatScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const router = useRouter();

  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingImageLabel, setPendingImageLabel] = useState<string | null>(
    null,
  );

  const listRef = useRef<FlatList<AIMessage>>(null);
  const user = auth.currentUser;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  useEffect(() => {
    if (messages.length > 0 || sending) {
      scrollToBottom();
    }
  }, [messages, sending, scrollToBottom]);

  const clearDraftAttachments = useCallback(() => {
    setPendingImageUri(null);
    setPendingImageLabel(null);
  }, []);

  const loadInitialGreeting = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessages([]);

    try {
      const closetSnap = await getDocs(
        query(collection(db, "closetItems"), where("userId", "==", user.uid)),
      );

      const fetchedCloset = closetSnap.docs.map((doc) => {
        const data = doc.data();

        return {
          category: data.category || "",
          color: data.color || "",
          brand: data.brand || undefined,
        };
      });

      setClosetItems(fetchedCloset);

      setMessages([createTextMessage("assistant", getInitialGreeting(mode))]);
    } catch {
      setMessages([
        createTextMessage(
          "assistant",
          "Hi, I’m Aura, your personal AI fashion companion.",
        ),
      ]);
    } finally {
      setLoading(false);
    }
  }, [mode, user]);

  useEffect(() => {
    loadInitialGreeting();
  }, [loadInitialGreeting]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages],
  );

  const handleSaveOutfit = async (outfit: AIOutfit) => {
    if (!user) return;

    try {
      await createSavedStyle({
        userId: user.uid,
        title: outfit.title,
        occasion: outfit.occasion,
        matchPercentage: outfit.matchPercentage,
        reason: outfit.reason,
        pieces: outfit.pieces,
        suggestedSizes: outfit.suggestedSizes || [],
        source: mode === "outfit" ? "outfit_suggestions" : "ai_companion",
      });

      Alert.alert("Saved", "Added to Saved Styles");
    } catch {
      Alert.alert("Error", "Could not save this outfit.");
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    const hasDraftAttachment = Boolean(pendingImageUri);

    if ((!trimmed && !hasDraftAttachment) || !user || sending) {
      return;
    }

    const now = Date.now();

    const userMessage: AIMessage = {
      id: `user-${now}`,
      sender: "user",
      text: trimmed || undefined,
      createdAt: now,
      imageUri: pendingImageUri || undefined,
      imageSourceLabel: pendingImageLabel || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    const hadImage = Boolean(pendingImageUri);
    clearDraftAttachments();

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      let assistantMessages: AIMessage[];

      if (hadImage && !trimmed) {
        assistantMessages = [
          createTextMessage(
            "assistant",
            "Image-based AI replies are not connected right now, but I can still help with hardcoded outfit and color suggestions.",
          ),
        ];
      } else {
        assistantMessages = getHardcodedAssistantMessages(trimmed);
      }

      setMessages((prev) => [...prev, ...assistantMessages]);
    } catch {
      setMessages((prev) => [
        ...prev,
        createTextMessage(
          "assistant",
          "Sorry — I couldn’t send that right now.",
        ),
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleVoicePress = () => {
    Alert.alert("Not ready yet", "Voice input is not connected yet.");
  };

  const pickImage = async (
    source: "camera" | "library",
  ): Promise<string | null> => {
    const permissionResponse =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResponse.granted) {
      Alert.alert(
        "Permission required",
        source === "camera"
          ? "Camera permission is needed to take a photo."
          : "Photo library permission is needed to upload an image.",
      );
      return null;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsEditing: false,
          });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return null;
    }

    return result.assets[0].uri;
  };

  const handleCameraPress = async () => {
    const uri = await pickImage("camera");

    if (!uri) return;

    setPendingImageUri(uri);
    setPendingImageLabel("Camera image attached");
  };

  const handleUploadPress = async () => {
    const uri = await pickImage("library");

    if (!uri) return;

    setPendingImageUri(uri);
    setPendingImageLabel("Image attached");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Loading />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState message="Login required" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.buttonPrimary}
              />
            </Pressable>

            <View style={styles.headerRow}>
              <Image
                source={require("../../assets/icons/aura-logo.png")}
                style={styles.logo}
              />
              <View>
                <Text style={styles.title}>Aura</Text>
                <Text style={styles.subtitle}>Your AI fashion companion</Text>
              </View>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={sortedMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble message={item} onSaveOutfit={handleSaveOutfit} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              sending ? (
                <View style={styles.typingWrap}>
                  <ChatBubble
                    message={{
                      id: "typing-indicator",
                      sender: "assistant",
                      createdAt: Date.now(),
                    }}
                    isTyping
                  />
                </View>
              ) : null
            }
          />

          <View style={styles.inputWrap}>
            <ChatInputBar
              value={input}
              onChangeText={setInput}
              onSend={handleSend}
              onVoicePress={handleVoicePress}
              onCameraPress={handleCameraPress}
              onUploadPress={handleUploadPress}
              disabled={sending}
              isRecording={false}
              pendingImageUri={pendingImageUri}
              pendingAudioLabel={null}
              onRemovePendingImage={() => {
                setPendingImageUri(null);
                setPendingImageLabel(null);
              }}
              onRemovePendingAudio={() => {}}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "column",
    marginBottom: spacing.md,
  },
  backBtn: {
    marginBottom: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.buttonPrimary,
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.darkText,
  },
  subtitle: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  typingWrap: {
    marginTop: spacing.xs,
  },
  inputWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.mutedText,
    paddingTop: spacing.sm,
  },
});
