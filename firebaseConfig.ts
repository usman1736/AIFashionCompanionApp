import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAFVx0D0t2bRylsccLU4JzYe-boGZZLPGQ",
  authDomain: "aura-fashion-app-70d22.firebaseapp.com",
  projectId: "aura-fashion-app-70d22",
  storageBucket: "aura-fashion-app-70d22.appspot.com",
  messagingSenderId: "961868527893",
  appId: "1:961868527893:web:626dd0735fc103f6a2511c",
  measurementId: "G-9BJS36WBTP",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
