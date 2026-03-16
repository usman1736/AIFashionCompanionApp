import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
 apiKey: "AIza...",
 authDomain: "aura-fashion-app-70d22.firebaseapp.com",
 projectId: "aura-fashion-app-70d22",
 storageBucket: "aura-fashion-app-70d22.firebasestorage.app",
 messagingSenderId: "961868527893",
 appId: "1:961868527893:web:626dd0735fc103f6a2511c",
 measurementId: "G-9BJS36WBTP"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
