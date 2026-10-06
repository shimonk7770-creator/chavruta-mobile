// src/contexts/auth-context.tsx
// ניהול מצב ההתחברות של האפליקציה - טוקן + פרטי המשתמש המחובר, משותף לכל הטאבים דרך React Context
// (ראו server/models/MobileToken.js בשרת להסבר המלא על מנגנון הטוקן).
//
// הערה: הטוקן נשמר רק בזיכרון (state) ולא באחסון מתמיד (כמו AsyncStorage) - כלומר בכל הפעלה מחדש
// של האפליקציה צריך להתחבר שוב. זו פשטות מכוונת (כדי לא להוסיף ספריית אחסון/תלות חדשה), סבירה
// לחלוטין לפרויקט לימודי בהיקף הזה.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { API_BASE_URL } from "@/constants/api";

export type ChavrutaUser = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
};

type AuthContextValue = {
  token: string | null;
  user: ChavrutaUser | null;
  isLoggingIn: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ChavrutaUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  async function login(email: string, password: string) {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || "שגיאה בהתחברות");
        return;
      }
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      // הסיבה הנפוצה ביותר לכישלון כאן: API_BASE_URL (src/constants/api.ts) לא מוגדר נכון,
      // השרת לא פועל (npm run dev), או שהטלפון לא מחובר לאותה רשת WiFi כמו המחשב
      setLoginError("לא ניתן להתחבר לשרת - בדוק את API_BASE_URL ושהשרת פועל");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function logout() {
    // אין צורך לקרוא לשרת (POST /api/mobile/logout) כדי שההתנתקות תהיה מיידית בממשק -
    // פשוט שוכחים את הטוקן מקומית. השרת ימשיך לזכור אותו עד שייקרא בנפרד (לא נוצר כאן).
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, isLoggingIn, loginError, login, logout }),
    [token, user, isLoggingIn, loginError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
