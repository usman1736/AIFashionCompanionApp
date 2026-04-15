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

        if (!profile.colorProfileComplete) {
          router.replace("/color-quiz");
          return;
        }

        router.replace("/home-screen");
      } catch (e) {
        router.replace("/home-screen");
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
