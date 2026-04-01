export type SavedStyleSource = "home" | "ai_companion" | "outfit_suggestions";

export type SavedStylePiece = {
  id: string;
  label: string;
  imageUrl?: string;
  category?: string;
  color?: string;
  brand?: string;
};

export type SavedStyle = {
  id: string;
  userId: string;
  title: string;
  occasion?: string;
  matchPercentage?: number;
  source: SavedStyleSource;
  reason?: string;
  pieces: SavedStylePiece[];
  suggestedSizes?: string[];
  createdAt: number;
};
