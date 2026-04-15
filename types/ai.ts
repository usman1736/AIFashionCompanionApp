export type AIMessageSender = "user" | "assistant";

export type AIOutfitPiece = {
  id: string;
  label: string;
};

export type AIOutfit = {
  title: string;
  occasion?: string;
  matchPercentage?: number;
  reason?: string;
  pieces: AIOutfitPiece[];
  suggestedSizes?: string[];
};

export type AIMessage = {
  id: string;
  sender: AIMessageSender;
  text?: string;
  createdAt: number;
  imageUri?: string;
  imageSourceLabel?: string;
  audioUri?: string;
  audioSourceLabel?: string;
  outfit?: AIOutfit;
};
