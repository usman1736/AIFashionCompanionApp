import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFVx0D0t2bRylsccLU4JzYe-boGZZLPGQ",
  authDomain: "aura-fashion-app-70d22.firebaseapp.com",
  projectId: "aura-fashion-app-70d22",
  storageBucket: "aura-fashion-app-70d22.firebasestorage.app",
  messagingSenderId: "916868527893",
  appId: "1:916868527893:web:626dd0735fc103f6a2511c",
  measurementId: "G-9BJS36WBTP"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
