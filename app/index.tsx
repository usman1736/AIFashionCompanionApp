import { useEffect } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
export default function Index() {
 const router = useRouter();
 useEffect(() => {
   const unsubscribe = onAuthStateChanged(auth, (user) => {
     if (user) {
       router.replace("/home");
     } else {
       router.replace("/welcome");
     }
   });
   return unsubscribe;
 }, []);
 return null;
}
