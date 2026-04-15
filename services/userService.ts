import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export type UserProfile = {
  email: string;
  displayName: string;
  phone?: string;
  createdAt?: any;
  quizComplete: boolean;
  measurementsComplete: boolean;
  colorProfileComplete: boolean;
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

const isOnline = async (): Promise<boolean> => {
  const state = await Network.getNetworkStateAsync();
  return state.isConnected === true && state.isInternetReachable === true;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const cacheKey = `cache_profile_${uid}`;
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    }
    return null;
  } catch {
    const cached = await AsyncStorage.getItem(cacheKey);
    return cached ? (JSON.parse(cached) as UserProfile) : null;
  }
};

export const getMeasurements = async (uid: string): Promise<Measurements | null> => {
  const cacheKey = `cache_measurements_${uid}`;
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists() && userDoc.data().measurements) {
      const data = userDoc.data().measurements as Measurements;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    }
    return null;
  } catch {
    const cached = await AsyncStorage.getItem(cacheKey);
    return cached ? (JSON.parse(cached) as Measurements) : null;
  }
};

export const saveMeasurements = async (uid: string, measurements: Omit<Measurements, "updatedAt">) => {
  if (!(await isOnline())) {
    throw new Error("You are offline. Please connect to save your measurements.");
  }
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
  if (!(await isOnline())) {
    throw new Error("You are offline. Please connect to update your profile.");
  }
  await updateDoc(doc(db, "users", uid), { ...data });
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
