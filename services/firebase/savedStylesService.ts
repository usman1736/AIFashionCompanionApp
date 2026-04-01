import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../../firebaseConfig";
import { SavedStyle } from "../../types/savedStyles";

const savedStylesRef = collection(db, "savedStyles");

type CreateSavedStyleInput = Omit<SavedStyle, "id" | "createdAt">;

export const createSavedStyle = async (payload: CreateSavedStyleInput) => {
  const docRef = await addDoc(savedStylesRef, {
    ...payload,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getUserSavedStyles = async (
  userId: string,
): Promise<SavedStyle[]> => {
  const q = query(savedStylesRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => {
      const data = item.data();

      return {
        id: item.id,
        userId: data.userId,
        title: data.title,
        occasion: data.occasion || "",
        matchPercentage:
          typeof data.matchPercentage === "number"
            ? data.matchPercentage
            : undefined,
        source: data.source,
        reason: data.reason || "",
        pieces: Array.isArray(data.pieces)
          ? data.pieces.map((piece: any) => ({
              id: piece?.id || "",
              label: piece?.label || "",
              imageUrl: piece?.imageUrl || "",
              category: piece?.category || "",
              color: piece?.color || "",
              brand: piece?.brand || "",
            }))
          : [],
        suggestedSizes: Array.isArray(data.suggestedSizes)
          ? data.suggestedSizes
          : [],
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      } as SavedStyle;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteSavedStyle = async (savedStyleId: string) => {
  await deleteDoc(doc(db, "savedStyles", savedStyleId));
};
