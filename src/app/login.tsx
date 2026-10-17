// src/app/login.tsx - מסך התחברות/הרשמה עצמאי (נפתח מכפתורי "התחברות" בבית ובמסך "עוד"). אחרי התחברות חוזרים לבית.
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/contexts/auth-context";

export default function LoginScreen() {
  const { token } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (token) router.replace("/");
  }, [token, router]);
  return <LoginForm />;
}
