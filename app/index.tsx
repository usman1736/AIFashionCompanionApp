import { useEffect } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/welcome");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
          router.replace("/quiz");
          return;
        }

        const data = userDoc.data();

        if (!data.quizComplete) {
          router.replace("/quiz");
          return;
        }

        if (!data.measurementsComplete) {
          router.replace("/measurement-choice");
          return;
        }

        router.replace("/home");
      } catch (e) {
        router.replace("/home");
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
