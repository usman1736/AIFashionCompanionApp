// cspell:ignore firestore
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export type ClosetItem = {
  id?: string;
  userId?: string;
  image?: string;
  imageUrl?: string;
  imagePath?: string;
  category?: string;
  color?: string;
  occasion?: string;
  occasions?: string[];
  season?: string;
  seasons?: string[];
  brand?: string;
  dateAdded?: number;
  wearCount?: number;
};

// ADD ITEM
export const addClosetItem = async (item: ClosetItem) => {
  try {
    await addDoc(collection(db, "closetItems"), {
      ...item,
      dateAdded: Date.now(),
    });
    console.log("Saved!");
  } catch (error) {
    console.log("SAVE ERROR:", error);
  }
};

// GET ALL ITEMS
export const getClosetItems = async () => {
  try {
    const snapshot = await getDocs(collection(db, "closetItems"));

    return snapshot.docs.map((itemDoc) => ({
      id: itemDoc.id,
      ...itemDoc.data(),
    }));
  } catch (error) {
    console.log("FETCH ERROR:", error);
    return [];
  }
};

// GET ITEMS FOR ONE USER
export const getClosetItemsForUser = async (userId: string) => {
  try {
    const q = query(
      collection(db, "closetItems"),
      where("userId", "==", userId),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((itemDoc) => ({
      id: itemDoc.id,
      ...itemDoc.data(),
    }));
  } catch (error) {
    console.log("FETCH USER CLOSET ERROR:", error);
    return [];
  }
};

// DELETE ITEM
export const deleteClosetItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, "closetItems", id));
  } catch (error) {
    console.log("DELETE ERROR:", error);
  }
};
