import { useEffect } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getUserProfile } from "../services/userService";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/welcome");
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);

        if (!profile || !profile.quizComplete) {
          router.replace("/quiz");
          return;
        }

        if (!profile.measurementsComplete) {
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
