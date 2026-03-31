// cspell:ignore firestore
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// ADD ITEM
export const addClosetItem = async (item: any) => {
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

// GET ITEMS
export const getClosetItems = async () => {
  try {
    const snapshot = await getDocs(collection(db, "closetItems"));

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.log("FETCH ERROR:", error);
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
