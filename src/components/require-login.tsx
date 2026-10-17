// src/components/require-login.tsx
// עוטף מסך שדורש התחברות: בזמן שחזור התחברות שמורה מציג טעינה (בלי להבהב מסך התחברות), ובלי התחברות מציג את טופס ההתחברות.
import type { ReactNode } from "react";

import { Loading } from "@/components/kit";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/contexts/auth-context";

export function RequireLogin({ children }: { children: ReactNode }) {
  const { token, isRestoring } = useAuth();
  if (isRestoring) return <Loading />;
  if (!token) return <LoginForm />;
  return <>{children}</>;
}
