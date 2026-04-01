import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  connectFunctionsEmulator,
  getFunctions,
  type Functions,
} from "firebase/functions";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAFVx0D0t2bRylsccLU4JzYe-boGZZLPGQ",
  authDomain: "aura-fashion-app-70d22.firebaseapp.com",
  projectId: "aura-fashion-app-70d22",
  storageBucket: "aura-fashion-app-70d22.firebasestorage.app",
  messagingSenderId: "916868527893",
  appId: "1:916868527893:web:626dd0735fc103f6a2511c",
  measurementId: "G-9BJS36WBTP",
};

const app = initializeApp(firebaseConfig);

const getReactNativePersistenceFn = (
  FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence?: (
      storage: typeof AsyncStorage,
    ) => FirebaseAuth.Persistence;
  }
).getReactNativePersistence;

export const auth = (() => {
  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistenceFn
        ? getReactNativePersistenceFn(AsyncStorage)
        : FirebaseAuth.inMemoryPersistence,
    });
  } catch {
    return FirebaseAuth.getAuth(app);
  }
})();

export const db = getFirestore(app);

const functionsRegion = "us-central1";
export const functions: Functions = getFunctions(app, functionsRegion);

const getDefaultFunctionsHost = () => {
  if (Platform.OS === "android") {
    return "10.0.2.2";
  }

  return "127.0.0.1";
};

const emulatorHost =
  process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST || getDefaultFunctionsHost();

if (__DEV__) {
  connectFunctionsEmulator(functions, emulatorHost, 5001);
}
