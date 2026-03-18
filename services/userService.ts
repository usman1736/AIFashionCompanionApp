import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export type UserProfile = {
  email: string;
  displayName: string;
  phone?: string;
  createdAt?: any;
  quizComplete: boolean;
  measurementsComplete: boolean;
  onboardingComplete: boolean;
};

export type Measurements = {
  height: string;
  weight: string;
  chest: string;
  waist: string;
  hips: string;
  shoulders: string;
  inseam: string;
  updatedAt?: any;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
};

export const getMeasurements = async (uid: string): Promise<Measurements | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists() && userDoc.data().measurements) {
    return userDoc.data().measurements as Measurements;
  }
  return null;
};

export const saveMeasurements = async (uid: string, measurements: Omit<Measurements, "updatedAt">) => {
  await setDoc(
    doc(db, "users", uid),
    {
      measurementsComplete: true,
      onboardingComplete: true,
      measurements: {
        ...measurements,
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
};

export const updateUserProfile = async (uid: string, data: { displayName?: string; phone?: string }) => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
  });
};

export const createUserDocument = async (uid: string, email: string, displayName: string) => {
  await setDoc(doc(db, "users", uid), {
    email,
    displayName,
    createdAt: serverTimestamp(),
    quizComplete: false,
    measurementsComplete: false,
    onboardingComplete: false,
  });
};
