import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export type ColorProfile = {
  season: Season;
  secondarySeason?: Season;
  confidence: "High" | "Moderate" | "Low";
  scores: { Spring: number; Summer: number; Autumn: number; Winter: number };
  palette: { name: string; hex: string }[];
  avoid: string[];
  updatedAt?: any;
};

export const SEASON_PALETTES: Record<Season, { name: string; hex: string }[]> =
  {
    Spring: [
      { name: "Warm Sand", hex: "#F4A460" },
      { name: "Coral", hex: "#FF6F61" },
      { name: "Golden Yellow", hex: "#FFD700" },
      { name: "Mint", hex: "#98D8C8" },
      { name: "Turquoise", hex: "#40E0D0" },
      { name: "Peach Puff", hex: "#FFDAB9" },
      { name: "Sky Blue", hex: "#87CEEB" },
      { name: "Light Salmon", hex: "#FFA07A" },
      { name: "Yellow Green", hex: "#ADFF2F" },
      { name: "Warm Pink", hex: "#FF69B4" },
      { name: "Khaki", hex: "#F0E68C" },
      { name: "Dark Salmon", hex: "#E9967A" },
    ],
    Summer: [
      { name: "Light Steel Blue", hex: "#B0C4DE" },
      { name: "Lilac", hex: "#C8A2C8" },
      { name: "Rosy Brown", hex: "#BC8F8F" },
      { name: "Slate Grey", hex: "#778899" },
      { name: "Plum", hex: "#DDA0DD" },
      { name: "Lavender", hex: "#E6E6FA" },
      { name: "Powder Blue", hex: "#87CEEB" },
      { name: "Thistle", hex: "#D8BFD8" },
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Dusty Blue", hex: "#A0B6C8" },
      { name: "Dusty Rose", hex: "#D4A8B0" },
      { name: "Sage", hex: "#ACB78E" },
    ],
    Autumn: [
      { name: "Saddle Brown", hex: "#8B4513" },
      { name: "Goldenrod", hex: "#DAA520" },
      { name: "Sienna", hex: "#A0522D" },
      { name: "Dark Olive", hex: "#556B2F" },
      { name: "Rust", hex: "#B7410E" },
      { name: "Chocolate", hex: "#D2691E" },
      { name: "Peru", hex: "#CD853F" },
      { name: "Olive", hex: "#808000" },
      { name: "Teal", hex: "#008080" },
      { name: "Warm Rose", hex: "#BC8F8F" },
      { name: "Ochre", hex: "#CC7722" },
      { name: "Sepia", hex: "#704214" },
    ],
    Winter: [
      { name: "Black", hex: "#000000" },
      { name: "Pure White", hex: "#FFFFFF" },
      { name: "Crimson", hex: "#DC143C" },
      { name: "Royal Blue", hex: "#4169E1" },
      { name: "Emerald", hex: "#50C878" },
      { name: "Magenta", hex: "#FF00FF" },
      { name: "Midnight Blue", hex: "#191970" },
      { name: "Burgundy", hex: "#800020" },
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Icy Blue", hex: "#E0FFFF" },
      { name: "Medium Slate Blue", hex: "#7B68EE" },
      { name: "Dark Slate", hex: "#2F4F4F" },
    ],
  };

export const SEASON_AVOID: Record<Season, string[]> = {
  Spring: [
    "Black",
    "Charcoal grey",
    "Burgundy",
    "Dark navy",
    "Cool plum",
    "Muted greys",
  ],
  Summer: [
    "Bright orange",
    "Mustard yellow",
    "Tomato red",
    "Black",
    "Warm brown",
    "Bright lime",
  ],
  Autumn: [
    "Fuchsia",
    "Icy pastels",
    "Pure white",
    "Cool grey",
    "Bright pink",
    "Royal blue",
  ],
  Winter: [
    "Warm orange",
    "Mustard",
    "Earthy browns",
    "Warm beige",
    "Muted olive",
    "Peach",
  ],
};

export const SEASON_DESCRIPTIONS: Record<Season, string> = {
  Spring:
    "You have a warm, clear, and bright palette. Your best colors are vibrant and fresh, like a sunny spring garden. Embrace warm corals, peaches, and golden tones.",
  Summer:
    "You have a cool, muted, and soft palette. Your best colors are gentle and blended, like a hazy summer afternoon. Embrace dusty roses, lavenders, and powder blues.",
  Autumn:
    "You have a warm, muted, and deep palette. Your best colors are rich and earthy, like fall foliage. Embrace rusts, mustards, and deep olive greens.",
  Winter:
    "You have a cool, clear, and bold palette. Your best colors are high-contrast and striking, like a sharp winter day. Embrace pure black, white, and jewel tones.",
};

// Scoring logic
type Scores = { Spring: number; Summer: number; Autumn: number; Winter: number };

// Q6 answer → season (for tiebreaker)
const Q6_MAP: Record<string, Season> = {
  A: "Spring",
  B: "Summer",
  C: "Autumn",
  D: "Winter",
};

export function calculateColorResult(
  answers: string[],
  q6Answer: string,
): Omit<ColorProfile, "updatedAt"> {
  const scores: Scores = { Spring: 0, Summer: 0, Autumn: 0, Winter: 0 };

  // Q1 — hair color
  const q1: Record<string, Partial<Scores>> = {
    A: { Spring: 3 },
    B: { Summer: 3 },
    C: { Autumn: 3 },
    D: { Winter: 3 },
  };
  // Q2 — eye color
  const q2: Record<string, Partial<Scores>> = {
    A: { Spring: 3 },
    B: { Summer: 3 },
    C: { Autumn: 3 },
    D: { Winter: 3 },
  };
  // Q3 — skin undertone
  const q3: Record<string, Partial<Scores>> = {
    A: { Spring: 2, Autumn: 1 },
    B: { Summer: 2, Winter: 1 },
    C: { Autumn: 2, Spring: 1 },
    D: { Winter: 2, Summer: 1 },
  };
  // Q4 — jewelry
  const q4: Record<string, Partial<Scores>> = {
    A: { Spring: 2 },
    B: { Summer: 2 },
    C: { Autumn: 2 },
    D: { Winter: 2 },
  };
  // Q5 — white vs off-white
  const q5: Record<string, Partial<Scores>> = {
    A: { Spring: 2, Autumn: 1 },
    B: { Summer: 2 },
    C: { Autumn: 2, Spring: 1 },
    D: { Winter: 2, Summer: 1 },
  };
  // Q6 — instinctive colors
  const q6: Record<string, Partial<Scores>> = {
    A: { Spring: 3 },
    B: { Summer: 3 },
    C: { Autumn: 3 },
    D: { Winter: 3 },
  };
  const allMaps = [q1, q2, q3, q4, q5, q6];

  answers.forEach((answer, i) => {
    const map = allMaps[i];
    const points = map[answer] ?? {};
    (Object.keys(points) as Season[]).forEach((season) => {
      scores[season] += points[season] ?? 0;
    });
  });

  // Find max score
  const sorted = (Object.keys(scores) as Season[]).sort(
    (a, b) => scores[b] - scores[a],
  );
  const top = sorted[0];
  const second = sorted[1];
  const margin = scores[top] - scores[second];

  // Tiebreaker
  let season: Season = top;
  let secondarySeason: Season | undefined;

  if (margin === 0) {
    const q6Season = Q6_MAP[q6Answer];
    if (q6Season === top || q6Season === second) {
      season = q6Season;
      secondarySeason =
        q6Season === top ? second : top;
    } else {
      // Still tied — dual type
      season = top;
      secondarySeason = second;
    }
  } else if (margin <= 2) {
    secondarySeason = second;
  }

  // Confidence
  let confidence: ColorProfile["confidence"];
  if (margin >= 6) confidence = "High";
  else if (margin >= 3) confidence = "Moderate";
  else confidence = "Low";

  return {
    season,
    secondarySeason,
    confidence,
    scores,
    palette: SEASON_PALETTES[season],
    avoid: SEASON_AVOID[season],
  };
}

export const saveColorProfile = async (
  uid: string,
  profile: Omit<ColorProfile, "updatedAt">,
) => {
  const { secondarySeason, ...rest } = profile;
  const colorProfile: Record<string, any> = {
    ...rest,
    updatedAt: serverTimestamp(),
  };
  if (secondarySeason !== undefined) {
    colorProfile.secondarySeason = secondarySeason;
  }

  await setDoc(
    doc(db, "users", uid),
    {
      colorProfileComplete: true,
      onboardingComplete: true,
      colorProfile,
    },
    { merge: true },
  );
};

export const getColorProfile = async (
  uid: string,
): Promise<ColorProfile | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists() && snap.data().colorProfile) {
    return snap.data().colorProfile as ColorProfile;
  }
  return null;
};
