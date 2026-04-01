import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase-admin/app";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

type OutfitCard = {
  title: string;
  occasion: string;
  matchPercentage: number;
  reason: string;
  clothingPieces: string[];
  suggestedSizes: string[];
};

type AuraStylistResponse = {
  isFashionRelated: boolean;
  responseMode: "chat" | "outfits" | "image";
  greeting: string;
  assistantMessage: string;
  outfitCards: OutfitCard[];
  generatedImageBase64?: string;
  generatedImageMimeType?: string;
};

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
  userProfile?: {
    firstName?: string;
    stylePreferences?: string[];
    seasonalColorProfile?: string;
  };
  measurements?: Record<string, string | number | null | undefined>;
  closetSummary?: {
    totalItems?: number;
    categories?: Record<string, number>;
    dominantColors?: string[];
    occasions?: string[];
  };
  closetItems?: Array<{
    name?: string;
    category?: string;
    color?: string;
    occasions?: string[];
    season?: string[];
    brand?: string;
  }>;
};

type RequestMode = "chat" | "outfits" | "image";

const CHAT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    isFashionRelated: {
      type: "boolean",
    },
    responseMode: {
      type: "string",
      enum: ["chat", "outfits"],
    },
    greeting: {
      type: "string",
    },
    assistantMessage: {
      type: "string",
    },
    outfitCards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          occasion: { type: "string" },
          matchPercentage: { type: "number" },
          reason: { type: "string" },
          clothingPieces: {
            type: "array",
            items: { type: "string" },
          },
          suggestedSizes: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "title",
          "occasion",
          "matchPercentage",
          "reason",
          "clothingPieces",
          "suggestedSizes",
        ],
      },
    },
  },
  required: [
    "isFashionRelated",
    "responseMode",
    "greeting",
    "assistantMessage",
    "outfitCards",
  ],
} as const;

function normalizeOutfitCards(cards: unknown): OutfitCard[] {
  if (!Array.isArray(cards)) {
    return [];
  }

  return cards.filter(Boolean).map((card) => {
    const safeCard = card as Partial<OutfitCard>;

    return {
      title:
        typeof safeCard.title === "string"
          ? safeCard.title
          : "Outfit Suggestion",
      occasion:
        typeof safeCard.occasion === "string" ? safeCard.occasion : "General",
      matchPercentage:
        typeof safeCard.matchPercentage === "number"
          ? Math.max(0, Math.min(100, Math.round(safeCard.matchPercentage)))
          : 0,
      reason:
        typeof safeCard.reason === "string"
          ? safeCard.reason
          : "Selected based on your fashion request.",
      clothingPieces: Array.isArray(safeCard.clothingPieces)
        ? safeCard.clothingPieces.filter(
            (piece): piece is string => typeof piece === "string",
          )
        : [],
      suggestedSizes: Array.isArray(safeCard.suggestedSizes)
        ? safeCard.suggestedSizes.filter(
            (size): size is string => typeof size === "string",
          )
        : [],
    };
  });
}

function normalizeChatResponse(
  parsed: Partial<AuraStylistResponse>,
  mode: "chat" | "outfits",
): AuraStylistResponse {
  return {
    isFashionRelated: parsed.isFashionRelated !== false,
    responseMode: mode,
    greeting:
      typeof parsed.greeting === "string"
        ? parsed.greeting
        : "Hello! I’m Aura, your AI fashion companion.",
    assistantMessage:
      typeof parsed.assistantMessage === "string"
        ? parsed.assistantMessage
        : "I can help with fashion questions, styling advice, outfit ideas, and color pairings.",
    outfitCards:
      mode === "outfits" ? normalizeOutfitCards(parsed.outfitCards) : [],
  };
}

function detectRequestMode(message: string): RequestMode {
  const lower = message.toLowerCase();

  const imageSignals = [
    "generate an image",
    "generate image",
    "make an image",
    "create an image",
    "picture of",
    "image of",
    "visual of",
    "mockup",
  ];

  const outfitSignals = [
    "what should i wear",
    "what should i put on",
    "style this",
    "style ",
    "build an outfit",
    "build me an outfit",
    "outfit ideas",
    "outfit options",
    "give me outfits",
    "give me an outfit",
    "put together an outfit",
    "for dinner",
    "for brunch",
    "for work",
    "for a date",
    "for date night",
    "for school",
    "for interview",
    "what goes with",
    "how do i style",
    "how to style",
    "wear with",
  ];

  if (imageSignals.some((signal) => lower.includes(signal))) {
    return "image";
  }

  if (outfitSignals.some((signal) => lower.includes(signal))) {
    return "outfits";
  }

  return "chat";
}

function looksFashionRelated(message: string): boolean {
  const lower = message.toLowerCase();

  const fashionTerms = [
    "fashion",
    "style",
    "outfit",
    "wear",
    "shirt",
    "pants",
    "trousers",
    "jeans",
    "chinos",
    "skirt",
    "dress",
    "hoodie",
    "sweater",
    "blazer",
    "jacket",
    "coat",
    "shoes",
    "sneakers",
    "heels",
    "boots",
    "bag",
    "wardrobe",
    "closet",
    "fit",
    "fitted",
    "slim fit",
    "oversized",
    "color",
    "colour",
    "khaki",
    "blue",
    "black",
    "white",
    "grey",
    "gray",
    "navy",
    "beige",
    "tan",
    "baby blue",
    "taupe",
    "business casual",
    "casual",
    "formal",
    "dress code",
    "accessories",
    "jewelry",
    "jewellery",
    "layer",
    "layering",
  ];

  return fashionTerms.some((term) => lower.includes(term));
}

function getSuggestedSizes(
  measurements?: AuraStylistRequest["measurements"],
): string[] {
  if (!measurements || Object.keys(measurements).length === 0) {
    return ["Size unavailable from current measurements"];
  }

  return ["Suggested size based on saved measurements"];
}

function buildOfflineOutfits(
  message: string,
  measurements?: AuraStylistRequest["measurements"],
): OutfitCard[] {
  const lower = message.toLowerCase();
  const sizes = getSuggestedSizes(measurements);

  if (lower.includes("dinner") || lower.includes("date")) {
    return [
      {
        title: "Elevated Dinner Look",
        occasion: "Dinner",
        matchPercentage: 92,
        reason:
          "This works because it feels polished without looking overdressed.",
        clothingPieces: [
          "Black fitted top or knit",
          "Tailored trousers or dark straight-leg pants",
          "Structured blazer",
          "Minimal jewelry",
          "Clean loafers or heeled boots",
        ],
        suggestedSizes: sizes,
      },
      {
        title: "Smart Casual Dinner Look",
        occasion: "Dinner",
        matchPercentage: 88,
        reason:
          "This keeps the outfit relaxed but still intentional and put together.",
        clothingPieces: [
          "Crisp white shirt or soft blouse",
          "Dark blue or black trousers",
          "Simple belt",
          "White sneakers or sleek ankle boots",
          "Small shoulder bag",
        ],
        suggestedSizes: sizes,
      },
    ];
  }

  if (
    lower.includes("work") ||
    lower.includes("office") ||
    lower.includes("interview")
  ) {
    return [
      {
        title: "Polished Work Outfit",
        occasion: "Work",
        matchPercentage: 91,
        reason:
          "This feels professional, balanced, and easy to wear for most work settings.",
        clothingPieces: [
          "Neutral blouse or knit top",
          "Tailored black or navy pants",
          "Blazer or longline cardigan",
          "Simple flats or loafers",
          "Structured tote",
        ],
        suggestedSizes: sizes,
      },
    ];
  }

  return [
    {
      title: "Clean Everyday Outfit",
      occasion: "Everyday",
      matchPercentage: 89,
      reason:
        "This gives you a versatile, easy outfit that still looks styled and intentional.",
      clothingPieces: [
        "Well-fitted basic top",
        "Straight-leg jeans or trousers",
        "Light outer layer",
        "Minimal sneakers or loafers",
      ],
      suggestedSizes: sizes,
    },
  ];
}

function getOfflineChatAnswer(message: string): string {
  const lower = message.toLowerCase();

  if (lower === "hi" || lower === "hey" || lower === "hello") {
    return "Hi — I’m Aura. Ask me about outfits, colors, styling, dress codes, or what to wear for an occasion.";
  }

  if (
    lower.includes("5 colours") ||
    lower.includes("5 colors") ||
    lower.includes("what colour looks good with blue") ||
    lower.includes("what color looks good with blue") ||
    lower.includes("blue")
  ) {
    return "Blue looks especially good with white, beige, camel, grey, black, and soft pink. For a cleaner look, white and beige work really well. For something richer, camel or grey usually gives blue a more polished feel.";
  }

  if (
    lower.includes("what colour looks good with black") ||
    lower.includes("what color looks good with black") ||
    lower.includes("black")
  ) {
    return "Black works really well with white, beige, camel, grey, olive, burgundy, and cobalt blue. If you want something clean and classic, go with white or beige. If you want something richer, burgundy or deep green looks great with black.";
  }

  if (lower.includes("khaki chinos")) {
    return "Khaki chinos are lightweight cotton twill pants in a warm beige or sandy tan shade. They look cleaner and more polished than jeans, but less formal than dress pants. They pair well with white, navy, black, olive, and light blue.";
  }

  if (lower.includes("baby blue")) {
    return "Baby blue is a soft, pale blue with a light airy tone. It looks gentle, clean, and slightly pastel, kind of like a clear morning sky. It pairs especially well with white, grey, beige, navy, and silver-toned accessories.";
  }

  if (lower.includes("taupe")) {
    return "Taupe is a muted mix of brown, beige, and grey. It looks soft, understated, and neutral, which makes it easy to style with black, cream, white, navy, and dusty rose.";
  }

  if (lower.includes("business casual")) {
    return "Business casual usually means polished clothing that is less formal than a full suit. Think tailored pants, blouses, knit tops, loafers, simple dresses, blazers, and clean shoes. It should look neat and professional without feeling too formal.";
  }

  if (lower.includes("slim fit") && lower.includes("regular fit")) {
    return "Slim fit sits closer to the body and gives a sharper silhouette, while regular fit has a bit more room and feels easier and less fitted. Slim fit looks more tailored, and regular fit usually feels more relaxed and forgiving.";
  }

  return "I can help with color pairings, outfit ideas, styling advice, dress codes, and clothing questions. Tell me what item, color, or occasion you want help with.";
}

function buildChatPrompt(
  input: AuraStylistRequest,
  mode: "chat" | "outfits",
): string {
  return `
You are Aura, a premium conversational AI fashion companion.

Voice:
- warm
- stylish
- helpful
- specific
- natural
- not robotic

Strict rules:
1. Only answer fashion-related questions.
2. If the user asks something unrelated to fashion, clothing, outfits, style, fit, color, wardrobe, or apparel shopping:
   - set isFashionRelated to false
   - politely refuse
   - return no outfit cards
3. If mode is "chat":
   - answer the exact question in normal conversational text
   - do not return outfit cards
   - do not force outfit ideas
4. If mode is "outfits":
   - answer briefly in text first
   - then return 1 to 3 strong outfit cards
5. If the user asks for colors that work together, answer clearly in text only unless they asked for outfits.
6. If isInitialMessage is true, greet naturally.
7. Mention location/weather only if available and useful.
8. If measurements are missing, use "Size unavailable from current measurements".
9. Return valid JSON only.

User request data:
${JSON.stringify(input, null, 2)}

Mode:
${mode}
`.trim();
}

async function generateChatResponse(
  ai: GoogleGenAI,
  input: AuraStylistRequest,
  mode: "chat" | "outfits",
): Promise<AuraStylistResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildChatPrompt(input, mode),
    config: {
      temperature: 0.65,
      responseMimeType: "application/json",
      responseJsonSchema: CHAT_RESPONSE_SCHEMA,
    },
  });

  const rawText = response.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  return normalizeChatResponse(
    JSON.parse(rawText) as Partial<AuraStylistResponse>,
    mode,
  );
}

function buildOfflineResponse(data: AuraStylistRequest): AuraStylistResponse {
  const mode = detectRequestMode(data.message);

  if (!looksFashionRelated(data.message) && !data.isInitialMessage) {
    return {
      isFashionRelated: false,
      responseMode: "chat",
      greeting: "",
      assistantMessage:
        "I can only help with fashion, outfits, fit, colors, wardrobe planning, and clothing-related questions.",
      outfitCards: [],
    };
  }

  if (data.isInitialMessage) {
    const locationText = data.location?.city ? ` in ${data.location.city}` : "";
    const weatherText =
      typeof data.weather?.temperatureC === "number"
        ? ` It’s around ${Math.round(data.weather.temperatureC)}°C${data.weather?.condition ? ` and ${data.weather.condition.toLowerCase()}` : ""}.`
        : "";

    return {
      isFashionRelated: true,
      responseMode: "chat",
      greeting: `Hello${locationText ? locationText : ""}! I’m Aura, your AI fashion companion.${weatherText}`,
      assistantMessage:
        "Ask me about outfits, colors, styling, dress codes, or what to wear for an occasion.",
      outfitCards: [],
    };
  }

  if (mode === "image") {
    return {
      isFashionRelated: true,
      responseMode: "chat",
      greeting: "",
      assistantMessage: `${getOfflineChatAnswer(data.message)} I can describe fashion visuals for you right now, but live image generation is currently unavailable.`,
      outfitCards: [],
    };
  }

  if (mode === "outfits") {
    return {
      isFashionRelated: true,
      responseMode: "outfits",
      greeting: "",
      assistantMessage:
        "Here are a few outfit ideas that fit what you asked for.",
      outfitCards: buildOfflineOutfits(data.message, data.measurements),
    };
  }

  return {
    isFashionRelated: true,
    responseMode: "chat",
    greeting: "",
    assistantMessage: getOfflineChatAnswer(data.message),
    outfitCards: [],
  };
}

export const auraStylist = onCall(
  {
    region: "us-central1",
    cors: true,
    timeoutSeconds: 90,
    memory: "1GiB",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to use Aura Stylist.",
      );
    }

    const data = request.data as AuraStylistRequest | undefined;

    if (
      !data ||
      typeof data.message !== "string" ||
      data.message.trim().length === 0
    ) {
      throw new HttpsError(
        "invalid-argument",
        "A non-empty message string is required.",
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return buildOfflineResponse(data);
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const mode = detectRequestMode(data.message);

      if (mode === "image") {
        return buildOfflineResponse(data);
      }

      if (mode === "outfits") {
        return await generateChatResponse(ai, data, "outfits");
      }

      return await generateChatResponse(ai, data, "chat");
    } catch {
      return buildOfflineResponse(data);
    }
  },
);
