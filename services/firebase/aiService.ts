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
import { AIMessage } from "../../types/ai";

export type AIConversation = {
  id: string;
  userId: string;
  messages: AIMessage[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

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
    .map((itemDoc) => {
      const data = itemDoc.data() as Omit<AIConversation, "id">;

      return {
        id: itemDoc.id,
        userId: data.userId,
        messages: Array.isArray(data.messages) ? data.messages : [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    })
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
