import { initializeApp } from "firebase-admin/app";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import OpenAI from "openai";

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
  responseMode: "chat" | "outfits";
  greeting: string;
  assistantMessage: string;
  outfitCards: OutfitCard[];
};

type AuraConversationTurn = {
  sender: "user" | "assistant";
  text: string;
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
  history?: AuraConversationTurn[];
  imageBase64?: string;
  imageMimeType?: string;
};

type RequestMode = "chat" | "outfits";

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

function isGreetingOnly(message: string): boolean {
  const lower = normalizeMessage(message);

  return [
    "hi",
    "hii",
    "hey",
    "hello",
    "yo",
    "sup",
    "what's up",
    "whats up",
    "good morning",
    "good afternoon",
    "good evening",
  ].includes(lower);
}

function isSoftFollowUp(message: string): boolean {
  const lower = normalizeMessage(message);

  return [
    "nice",
    "cool",
    "okay",
    "ok",
    "okk",
    "alright",
    "great",
    "good",
    "sounds good",
    "love that",
    "i like that",
    "not bad",
    "fair",
    "interesting",
    "what else",
    "anything else",
    "more",
    "give me more",
    "another",
    "another one",
    "go on",
    "continue",
    "tell me more",
  ].includes(lower);
}

function isAmbiguousCardRequest(message: string): boolean {
  const lower = normalizeMessage(message);

  const genericCardSignals = [
    "create me a card",
    "make me a card",
    "generate me a card",
    "generate a card",
    "create a card",
    "make a card",
    "i want a card",
    "give me a card",
  ];

  const clearFashionCardSignals = [
    "style card",
    "outfit card",
    "fashion card",
    "street style card",
    "streetwear card",
    "dinner outfit card",
    "work outfit card",
    "casual outfit card",
  ];

  const hasGenericCardSignal = genericCardSignals.some((signal) =>
    lower.includes(signal),
  );

  const hasClearFashionCardSignal = clearFashionCardSignals.some((signal) =>
    lower.includes(signal),
  );

  return hasGenericCardSignal && !hasClearFashionCardSignal;
}

function detectRequestMode(message: string): RequestMode {
  const lower = normalizeMessage(message);

  const outfitSignals = [
    "what should i wear",
    "what should i put on",
    "style this",
    "style me",
    "build an outfit",
    "build me an outfit",
    "outfit",
    "outfits",
    "outfit idea",
    "outfit ideas",
    "outfit option",
    "outfit options",
    "give me an outfit",
    "give me outfits",
    "create an outfit",
    "make me an outfit",
    "put together an outfit",
    "dress me",
    "wear with",
    "for dinner",
    "for brunch",
    "for work",
    "for a date",
    "for date night",
    "for school",
    "for interview",
    "for today",
    "for tonight",
    "generate me a style card",
    "generate me an outfit card",
    "generate a style card",
    "generate an outfit card",
    "create me a style card",
    "create me an outfit card",
    "make me a style card",
    "make me an outfit card",
    "street style outfit",
    "streetwear outfit",
  ];

  if (outfitSignals.some((signal) => lower.includes(signal))) {
    return "outfits";
  }

  return "chat";
}

function historyLooksFashionRelated(history?: AuraConversationTurn[]): boolean {
  if (!Array.isArray(history) || history.length === 0) {
    return false;
  }

  return history.some(
    (turn) => typeof turn.text === "string" && looksFashionRelated(turn.text),
  );
}

function looksFashionRelated(
  message: string,
  history?: AuraConversationTurn[],
): boolean {
  const lower = normalizeMessage(message);

  if (
    isGreetingOnly(lower) ||
    isSoftFollowUp(lower) ||
    isAmbiguousCardRequest(lower)
  ) {
    return true;
  }

  const fashionTerms = [
    "fashion",
    "style",
    "street style",
    "streetwear",
    "outfit",
    "outfits",
    "wear",
    "wearing",
    "shirt",
    "top",
    "tee",
    "t-shirt",
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
    "regular fit",
    "oversized",
    "color",
    "colour",
    "colors",
    "colours",
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
    "street",
    "minimal",
    "smart casual",
    "cardigan",
    "bomber",
    "cargo",
    "photo",
    "picture",
    "image",
    "shirt in this image",
    "what is this item",
    "what colors do you see",
  ];

  if (fashionTerms.some((term) => lower.includes(term))) {
    return true;
  }

  return historyLooksFashionRelated(history);
}

function getSuggestedSizes(): string[] {
  return ["Suggested size based on saved measurements"];
}

function buildOfflineOutfits(message: string): OutfitCard[] {
  const lower = normalizeMessage(message);
  const sizes = getSuggestedSizes();

  if (lower.includes("street")) {
    return [
      {
        title: "Clean Street Style Look",
        occasion: "Street Style",
        matchPercentage: 91,
        reason:
          "This keeps the look relaxed, current, and layered without trying too hard.",
        clothingPieces: [
          "Oversized graphic tee or neutral heavyweight tee",
          "Baggy jeans or loose cargo pants",
          "Bomber jacket or zip hoodie",
          "Chunky sneakers",
          "Crossbody bag or cap",
        ],
        suggestedSizes: sizes,
      },
      {
        title: "Minimal Streetwear Outfit",
        occasion: "Street Style",
        matchPercentage: 88,
        reason:
          "This gives you a sharper streetwear look with cleaner lines and strong basics.",
        clothingPieces: [
          "Boxy black or white tee",
          "Straight-leg dark pants",
          "Light overshirt or bomber",
          "Clean leather sneakers",
          "Simple chain or watch",
        ],
        suggestedSizes: sizes,
      },
    ];
  }

  if (lower.includes("dinner") || lower.includes("date")) {
    return [
      {
        title: "Elevated Dinner Look",
        occasion: "Dinner",
        matchPercentage: 92,
        reason:
          "This feels polished, clean, and dressy without looking overdone.",
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
          "This keeps the outfit relaxed while still looking intentional and put together.",
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
          "This feels professional, balanced, and easy to wear in most work settings.",
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
        "This is a simple, versatile outfit that still feels styled and intentional.",
      clothingPieces: [
        "Well-fitted basic top",
        "Straight-leg jeans or trousers",
        "Light outer layer",
        "Minimal sneakers or loafers",
      ],
      suggestedSizes: sizes,
    },
    {
      title: "Smart Casual Everyday Look",
      occasion: "Everyday",
      matchPercentage: 86,
      reason:
        "This gives you a balanced look that feels relaxed but still put together.",
      clothingPieces: [
        "Clean neutral top",
        "Dark jeans or tailored pants",
        "Light jacket or cardigan",
        "Simple sneakers or loafers",
      ],
      suggestedSizes: sizes,
    },
  ];
}

function getLastUserHistoryText(history?: AuraConversationTurn[]): string {
  if (!Array.isArray(history) || history.length === 0) {
    return "";
  }

  for (let i = history.length - 1; i >= 0; i -= 1) {
    const turn = history[i];

    if (turn.sender === "user" && typeof turn.text === "string") {
      return normalizeMessage(turn.text);
    }
  }

  return "";
}

function buildCardFormatHint(): string {
  return `If you want me to create a style card, try one of these:
- "Create me a street style outfit card"
- "Give me 3 outfit cards for dinner"
- "Make me a casual outfit card with a black hoodie"
- "Build me 2 streetwear outfit cards"`;
}

function getOfflineImageAnswer(message: string): string {
  const lower = normalizeMessage(message);

  if (lower.includes("color") || lower.includes("colour")) {
    return "I received the image, but live image understanding is unavailable right now. Try again in a moment.";
  }

  if (lower.includes("what is this") || lower.includes("what item")) {
    return "I received the image, but live image understanding is unavailable right now. Try again in a moment.";
  }

  return "I received the image, but live image understanding is unavailable right now. Try again in a moment.";
}

function getOfflineChatAnswer(
  message: string,
  history?: AuraConversationTurn[],
): string {
  const lower = normalizeMessage(message);
  const previousUserText = getLastUserHistoryText(history);

  if (isGreetingOnly(lower)) {
    return "Hey — I’m Aura. I can help with outfits, colors, streetwear, styling advice, dress codes, and what to wear for different occasions. What kind of look are you going for?";
  }

  if (isAmbiguousCardRequest(lower)) {
    return `${buildCardFormatHint()}`;
  }

  if (isSoftFollowUp(lower)) {
    if (previousUserText.includes("blue")) {
      return "Yeah, blue is super easy to style. I can give you cleaner combos, bolder combos, or a full outfit built around blue if you want.";
    }

    if (previousUserText.includes("street")) {
      return "Yeah, street style can go a few different directions. I can keep it minimal, more oversized, or more layered if you want.";
    }

    return "Yeah, for sure. I can keep going with that, make it more casual, more polished, or turn it into a full outfit card if you want.";
  }

  if (
    lower.includes("street style") ||
    lower.includes("streetwear") ||
    lower === "street style"
  ) {
    return "Street style usually means casual outfits that feel current, expressive, and intentional. Think oversized tees, relaxed pants, sneakers, layered outerwear, and a few clean accessories. If you want, I can turn that into actual outfit cards for you.";
  }

  if (
    lower.includes("what colour looks good with blue") ||
    lower.includes("what color looks good with blue") ||
    lower.includes("name me 10 colours") ||
    lower.includes("name me 10 colors") ||
    lower.includes("blue")
  ) {
    return "Blue looks really good with white, beige, camel, grey, black, olive, cream, silver, burgundy, and soft pink. If you want, I can narrow that down to the best 3 for a cleaner look or build outfits around blue too.";
  }

  if (
    lower.includes("what colour looks good with black") ||
    lower.includes("what color looks good with black") ||
    lower.includes("black")
  ) {
    return "Black works really well with white, beige, camel, grey, olive, burgundy, cobalt blue, silver, deep green, and soft blush. If you want something clean, go white or beige. If you want something richer, burgundy or deep green looks really strong.";
  }

  if (lower.includes("khaki chinos")) {
    return "Khaki chinos are lightweight cotton twill pants in a warm beige or sandy tan shade. They look cleaner and more polished than jeans, but less formal than dress pants. They pair well with white, navy, black, olive, and light blue.";
  }

  if (lower.includes("baby blue")) {
    return "Baby blue is a soft, pale blue with a light airy tone. It feels clean, light, and slightly pastel. It pairs especially well with white, grey, beige, navy, and silver-toned accessories.";
  }

  if (lower.includes("taupe")) {
    return "Taupe is a muted mix of brown, beige, and grey. It looks soft, understated, and neutral, which makes it easy to style with black, cream, white, navy, and dusty rose.";
  }

  if (lower.includes("business casual")) {
    return "Business casual usually means polished clothing that is less formal than a full suit. Think tailored pants, knit tops, loafers, blazers, clean dresses, and shoes that look neat without feeling too formal.";
  }

  if (lower.includes("slim fit") && lower.includes("regular fit")) {
    return "Slim fit sits closer to the body and looks sharper, while regular fit has more room and feels easier and more relaxed. Slim fit feels more tailored, and regular fit usually feels more forgiving.";
  }

  return "Got you. Ask me about colors, styling, outfits, streetwear, dress codes, or what to wear for a specific occasion and I’ll keep it fashion-focused.";
}

function buildWeatherGreeting(data: AuraStylistRequest): AuraStylistResponse {
  const cityText = data.location?.city ? ` in ${data.location.city}` : "";
  const weatherText =
    typeof data.weather?.temperatureC === "number"
      ? ` It’s ${Math.round(data.weather.temperatureC)}°C${data.weather?.condition ? ` and ${data.weather.condition.toLowerCase()}` : ""} right now.`
      : "";

  return {
    isFashionRelated: true,
    responseMode: "chat",
    greeting: `Hello${cityText}! I’m Aura, your AI fashion companion.${weatherText}`,
    assistantMessage:
      "Would you like to dress for today’s weather, build an outfit, or just ask a style question?",
    outfitCards: [],
  };
}

function buildOfflineResponse(data: AuraStylistRequest): AuraStylistResponse {
  const mode = detectRequestMode(data.message);
  const lower = normalizeMessage(data.message);

  if (
    !looksFashionRelated(data.message, data.history) &&
    !data.isInitialMessage
  ) {
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
    return buildWeatherGreeting(data);
  }

  if (data.imageBase64) {
    return {
      isFashionRelated: true,
      responseMode: "chat",
      greeting: "",
      assistantMessage: getOfflineImageAnswer(data.message),
      outfitCards: [],
    };
  }

  if (isAmbiguousCardRequest(lower)) {
    return {
      isFashionRelated: true,
      responseMode: "chat",
      greeting: "",
      assistantMessage: buildCardFormatHint(),
      outfitCards: [],
    };
  }

  if (mode === "outfits") {
    return {
      isFashionRelated: true,
      responseMode: "outfits",
      greeting: "",
      assistantMessage:
        "Got you — here are a few outfit ideas that fit what you asked for.",
      outfitCards: buildOfflineOutfits(data.message),
    };
  }

  return {
    isFashionRelated: true,
    responseMode: "chat",
    greeting: "",
    assistantMessage: getOfflineChatAnswer(data.message, data.history),
    outfitCards: [],
  };
}

function buildChatSystemPrompt(): string {
  return `
You are Aura, a premium conversational AI fashion companion.

Your personality:
- warm
- natural
- stylish
- human
- conversational
- helpful
- specific

How to behave:
1. You are fashion-only, but you should still feel like a real conversation.
2. If the user says "hi", "nice", "okay", "what else", "tell me more", or similar short follow-ups, respond naturally using the recent conversation context.
3. Do not act robotic.
4. Do not suddenly refuse harmless follow-ups if the conversation is already about fashion.
5. Answer normal fashion questions in plain conversational text.
6. Do not constantly push outfit ideas.
7. Only give outfit suggestions when the user clearly asks for an outfit, outfit ideas, what to wear, or styling for an occasion.
8. If the user asks for a vague "card" request like "create me a card", do not talk about a physical card. Assume they may mean a fashion/style card and guide them toward a clear fashion-card prompt.
9. Keep responses natural, like ChatGPT, but focused only on fashion and styling.
10. If the topic is unrelated to fashion, politely refuse.
`.trim();
}

function buildVisionSystemPrompt(): string {
  return `
You are Aura, a premium fashion AI companion with image understanding.

Rules:
1. Only answer in a fashion/styling context.
2. Identify the clothing item in the image as specifically as you reasonably can.
3. Mention the visible main color or colors.
4. If the user asks what to wear with it, give natural styling suggestions.
5. If the item appears to be a top, say things like "This looks like a black T-shirt" rather than being vague.
6. If uncertain, say "This looks like..." instead of pretending certainty.
7. Keep the response conversational and helpful.
8. Do not mention technical image limitations unless absolutely necessary.
`.trim();
}

function buildOutfitSystemPrompt(): string {
  return `
You are Aura, a premium conversational AI fashion companion.

Return valid JSON only in this exact shape:
{
  "isFashionRelated": true,
  "responseMode": "outfits",
  "greeting": "",
  "assistantMessage": "short natural intro",
  "outfitCards": [
    {
      "title": "string",
      "occasion": "string",
      "matchPercentage": 90,
      "reason": "string",
      "clothingPieces": ["string", "string"],
      "suggestedSizes": ["string"]
    }
  ]
}

Rules:
1. Only answer fashion-related questions.
2. Return 2 to 3 strong outfit cards when the user clearly asks for outfits.
3. Make the assistantMessage sound natural and conversational.
4. Make the outfit cards realistic and easy to understand.
5. Each clothingPieces array should read like card content, for example: "Black oversized hoodie", "Loose dark cargo pants", "White sneakers".
6. suggestedSizes should always be an array with at least one string.
`.trim();
}

function parseGroqOutfitResponse(content: string): AuraStylistResponse {
  const trimmed = content.trim();

  try {
    const parsed = JSON.parse(trimmed) as Partial<AuraStylistResponse>;

    return {
      isFashionRelated: parsed.isFashionRelated !== false,
      responseMode: "outfits",
      greeting: typeof parsed.greeting === "string" ? parsed.greeting : "",
      assistantMessage:
        typeof parsed.assistantMessage === "string"
          ? parsed.assistantMessage
          : "Here are a few outfit ideas for you.",
      outfitCards: Array.isArray(parsed.outfitCards)
        ? parsed.outfitCards
            .filter(Boolean)
            .map((card) => {
              const safeCard = card as Partial<OutfitCard>;

              return {
                title:
                  typeof safeCard.title === "string"
                    ? safeCard.title
                    : "Outfit Suggestion",
                occasion:
                  typeof safeCard.occasion === "string"
                    ? safeCard.occasion
                    : "General",
                matchPercentage:
                  typeof safeCard.matchPercentage === "number"
                    ? Math.max(
                        0,
                        Math.min(100, Math.round(safeCard.matchPercentage)),
                      )
                    : 85,
                reason:
                  typeof safeCard.reason === "string"
                    ? safeCard.reason
                    : "Chosen to match your request.",
                clothingPieces: Array.isArray(safeCard.clothingPieces)
                  ? safeCard.clothingPieces.filter(
                      (piece): piece is string => typeof piece === "string",
                    )
                  : [],
                suggestedSizes: Array.isArray(safeCard.suggestedSizes)
                  ? safeCard.suggestedSizes.filter(
                      (size): size is string => typeof size === "string",
                    )
                  : ["Suggested size based on saved measurements"],
              };
            })
            .filter((card) => card.clothingPieces.length > 0)
        : [],
    };
  } catch {
    return {
      isFashionRelated: true,
      responseMode: "outfits",
      greeting: "",
      assistantMessage: "Here are a few outfit ideas for you.",
      outfitCards: buildOfflineOutfits(trimmed),
    };
  }
}

function buildHistoryTranscript(history?: AuraConversationTurn[]): string {
  if (!Array.isArray(history) || history.length === 0) {
    return "No previous conversation.";
  }

  return history
    .slice(-8)
    .map((turn) => `${turn.sender === "user" ? "User" : "Aura"}: ${turn.text}`)
    .join("\n");
}

async function generateVisionResponse(
  client: OpenAI,
  data: AuraStylistRequest,
): Promise<AuraStylistResponse> {
  const model =
    process.env.GROQ_VISION_MODEL ||
    "meta-llama/llama-4-scout-17b-16e-instruct";

  const mimeType = data.imageMimeType || "image/jpeg";
  const content = [
    {
      type: "text" as const,
      text: `
Conversation so far:
${buildHistoryTranscript(data.history)}

Current user message:
${data.message}
      `.trim(),
    },
    {
      type: "image_url" as const,
      image_url: {
        url: `data:${mimeType};base64,${data.imageBase64}`,
      },
    },
  ];

  const response = await client.chat.completions.create({
    model,
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: buildVisionSystemPrompt(),
      },
      {
        role: "user",
        content,
      },
    ],
  });

  const text = response.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("Groq returned an empty vision response.");
  }

  return {
    isFashionRelated: true,
    responseMode: "chat",
    greeting: "",
    assistantMessage: text,
    outfitCards: [],
  };
}

async function generateGroqResponse(
  client: OpenAI,
  data: AuraStylistRequest,
): Promise<AuraStylistResponse> {
  const mode = detectRequestMode(data.message);
  const lower = normalizeMessage(data.message);

  if (data.imageBase64) {
    return generateVisionResponse(client, data);
  }

  if (isAmbiguousCardRequest(lower)) {
    return {
      isFashionRelated: true,
      responseMode: "chat",
      greeting: "",
      assistantMessage:
        "If you meant a fashion style card, try something like: “Create me a street style outfit card” or “Give me 3 outfit cards for dinner.”",
      outfitCards: [],
    };
  }

  if (mode === "outfits") {
    const userPrompt = `
Conversation so far:
${buildHistoryTranscript(data.history)}

Current user request:
${data.message}

Return outfit cards that match the user's current request.
`.trim();

    const response = await client.chat.completions.create({
      model: process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: buildOutfitSystemPrompt(),
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty outfit response.");
    }

    return parseGroqOutfitResponse(content);
  }

  const response = await client.chat.completions.create({
    model: process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content: buildChatSystemPrompt(),
      },
      {
        role: "user",
        content: `
Conversation so far:
${buildHistoryTranscript(data.history)}

Current user message:
${data.message}
`.trim(),
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty chat response.");
  }

  return {
    isFashionRelated: true,
    responseMode: "chat",
    greeting: "",
    assistantMessage: content,
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

    if (!process.env.GROQ_API_KEY) {
      return buildOfflineResponse(data);
    }

    if (
      !looksFashionRelated(data.message, data.history) &&
      !data.isInitialMessage
    ) {
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
      return buildWeatherGreeting(data);
    }

    try {
      const client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });

      return await generateGroqResponse(client, data);
    } catch (err) {
      console.error("GROQ ERROR:", err);
      return buildOfflineResponse(data);
    }
  },
);
