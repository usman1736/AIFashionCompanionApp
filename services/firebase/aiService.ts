import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebaseConfig";
import { AIConversation, AIMessage } from "../../types/ai";

const conversationsRef = collection(db, "aiConversations");

export const createAIConversation = async (userId: string) => {
  const docRef = await addDoc(conversationsRef, {
    userId,
    messages: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getUserAIConversations = async (
  userId: string,
): Promise<AIConversation[]> => {
  const q = query(conversationsRef, orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...(item.data() as Omit<AIConversation, "id">),
    }))
    .filter((item) => item.userId === userId);
};

export const appendAIMessage = async (
  conversationId: string,
  messages: AIMessage[],
) => {
  await updateDoc(doc(db, "aiConversations", conversationId), {
    messages,
    updatedAt: serverTimestamp(),
  });
};
