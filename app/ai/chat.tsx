import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { httpsCallable } from "firebase/functions";
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
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import EmptyState from "../../components/states/EmptyState";
import Loading from "../../components/states/Loading";
import ChatBubble from "../../components/ui/ai/ChatBubble";
import ChatInputBar from "../../components/ui/ai/ChatInputBar";

import { auth, functions } from "../../firebaseConfig";
import { createSavedStyle } from "../../services/firebase/savedStylesService";
import { colors } from "../../styles/colors";
import { spacing } from "../../styles/spacing";
import { typography } from "../../styles/typography";
import { AIMessage, AIOutfit } from "../../types/ai";

type AuraStylistRequest = {
  message: string;
  isInitialMessage?: boolean;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  weather?: {
    temperatureC?: number;
    condition?: string;
    highC?: number;
    lowC?: number;
  };
};

type AuraStylistResponse = {
  isFashionRelated: boolean;
  responseMode: "chat" | "outfits" | "image";
  greeting: string;
  assistantMessage: string;
  outfitCards: Array<{
    title: string;
    occasion: string;
    matchPercentage: number;
    reason: string;
    clothingPieces: string[];
    suggestedSizes: string[];
  }>;
  generatedImageBase64?: string;
  generatedImageMimeType?: string;
};

type GreetingContext = {
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  weather?: {
    temperatureC?: number;
    condition?: string;
    highC?: number;
    lowC?: number;
  };
};

function getInitialPrompt(mode?: string) {
  if (mode === "outfit") {
    return "Say hello and ask what kind of outfit the user wants today.";
  }

  if (mode === "closet") {
    return "Say hello and invite the user to ask styling questions about their clothes.";
  }

  return "Say hello and introduce yourself as Aura, a conversational AI fashion companion.";
}

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

function mapOutfitCardToAIOutfit(
  card: AuraStylistResponse["outfitCards"][number],
): AIOutfit {
  return {
    title: card.title,
    occasion: card.occasion,
    matchPercentage: card.matchPercentage,
    reason: card.reason,
    pieces: card.clothingPieces.map((piece, index) => ({
      id: `${index}-${piece}`,
      label: piece,
    })),
    suggestedSizes: Array.isArray(card.suggestedSizes)
      ? card.suggestedSizes
      : [],
  };
}

function createImageDataUri(base64: string, mimeType?: string) {
  const safeMimeType = mimeType || "image/png";
  return `data:${safeMimeType};base64,${base64}`;
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Something went wrong.";
}

async function fetchWeatherForCoordinates(latitude: number, longitude: number) {
  const weatherCodeMap: Record<number, string> = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    95: "Thunderstorm",
  };

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min&forecast_days=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to fetch weather.");
  }

  const data = await response.json();

  const code = data?.current?.weather_code;
  const condition =
    typeof code === "number"
      ? weatherCodeMap[code] || "Current weather"
      : "Current weather";

  return {
    temperatureC:
      typeof data?.current?.temperature_2m === "number"
        ? data.current.temperature_2m
        : undefined,
    condition,
    highC:
      typeof data?.daily?.temperature_2m_max?.[0] === "number"
        ? data.daily.temperature_2m_max[0]
        : undefined,
    lowC:
      typeof data?.daily?.temperature_2m_min?.[0] === "number"
        ? data.daily.temperature_2m_min[0]
        : undefined,
  };
}

async function getGreetingContext(): Promise<GreetingContext> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      return {};
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    const place = reverseGeocode[0];

    const weather = await fetchWeatherForCoordinates(
      position.coords.latitude,
      position.coords.longitude,
    );

    return {
      location: {
        city: place?.city || place?.district || undefined,
        region: place?.region || undefined,
        country: place?.country || undefined,
      },
      weather,
    };
  } catch {
    return {};
  }
}

export default function AIChatScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();

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

  const auraStylist = useMemo(
    () =>
      httpsCallable<AuraStylistRequest, AuraStylistResponse>(
        functions,
        "auraStylist",
      ),
    [],
  );

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

  const appendAuraResponse = useCallback(
    (payload: AuraStylistResponse, createdAtBase = Date.now()): AIMessage[] => {
      const nextMessages: AIMessage[] = [];

      if (payload.greeting?.trim()) {
        nextMessages.push(
          createTextMessage("assistant", payload.greeting, createdAtBase),
        );
      }

      if (payload.assistantMessage?.trim()) {
        nextMessages.push(
          createTextMessage(
            "assistant",
            payload.assistantMessage,
            createdAtBase + 1,
          ),
        );
      }

      if (payload.responseMode === "image" && payload.generatedImageBase64) {
        nextMessages.push({
          id: `assistant-image-${createdAtBase}`,
          sender: "assistant",
          createdAt: createdAtBase + 2,
          imageUri: createImageDataUri(
            payload.generatedImageBase64,
            payload.generatedImageMimeType,
          ),
          imageSourceLabel: "Generated by Aura",
        });
      }

      if (
        payload.responseMode === "outfits" &&
        Array.isArray(payload.outfitCards)
      ) {
        payload.outfitCards.forEach((card, index) => {
          nextMessages.push({
            id: `assistant-outfit-${createdAtBase}-${index}`,
            sender: "assistant",
            createdAt: createdAtBase + 3 + index,
            outfit: mapOutfitCardToAIOutfit(card),
          });
        });
      }

      if (nextMessages.length === 0) {
        nextMessages.push(
          createTextMessage(
            "assistant",
            "I can help with styling advice, outfit ideas, color pairings, and fashion visuals.",
            createdAtBase,
          ),
        );
      }

      return nextMessages;
    },
    [],
  );

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
      const greetingContext = await getGreetingContext();

      const response = await auraStylist({
        message: getInitialPrompt(mode),
        isInitialMessage: true,
        location: greetingContext.location,
        weather: greetingContext.weather,
      });

      const nextMessages = appendAuraResponse(response.data, Date.now());
      setMessages(nextMessages);
    } catch {
      setMessages([
        createTextMessage(
          "assistant",
          "Hello! I’m Aura, your AI fashion companion.",
        ),
      ]);
    } finally {
      setLoading(false);
    }
  }, [appendAuraResponse, auraStylist, mode, user]);

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

    if ((!trimmed && !hasDraftAttachment) || !user || sending) return;

    const now = Date.now();

    const userMessage: AIMessage = {
      id: `user-${now}`,
      sender: "user",
      text: trimmed || undefined,
      createdAt: now,
      imageUri: pendingImageUri || undefined,
      imageSourceLabel: pendingImageLabel || undefined,
    };

    const requestText =
      trimmed ||
      (pendingImageUri ? "I attached an image. Help me style it." : "");

    setInput("");
    clearDraftAttachments();
    setSending(true);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await auraStylist({
        message: requestText,
      });

      const assistantMessages = appendAuraResponse(response.data, now + 1);
      setMessages((prev) => [...prev, ...assistantMessages]);
    } catch (error) {
      const message = getErrorMessage(error);

      setMessages((prev) => [
        ...prev,
        createTextMessage(
          "assistant",
          `I hit a problem while generating that response. ${message}`,
          now + 1,
        ),
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleVoicePress = () => {
    Alert.alert(
      "Voice input unavailable",
      "Mic-to-text is not supported in Expo Go on iPhone. The rest of the AI chat and image attachment flow will still work.",
    );
  };

  const handleCameraPress = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const img = result.assets[0];
    setPendingImageUri(img.uri);
    setPendingImageLabel("Camera image attached");
  };

  const handleUploadPress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const img = result.assets[0];
    setPendingImageUri(img.uri);
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
            <Image
              source={require("../../assets/icons/aura-logo.png")}
              style={styles.logo}
            />
            <View>
              <Text style={styles.title}>Aura</Text>
              <Text style={styles.subtitle}>Your AI fashion companion</Text>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
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
