// src/contexts/auth-context.tsx
// ניהול מצב ההתחברות של האפליקציה - טוקן + פרטי המשתמש המחובר, משותף לכל הטאבים דרך React Context
// (ראו server/models/MobileToken.js בשרת להסבר המלא על מנגנון הטוקן).
//
// עדכון (שלב 1 של ההעברה למובייל): ההתחברות נשמרת עכשיו בכספת המאובטחת של הטלפון (lib/session-storage.ts),
// כך שאין צורך להתחבר מחדש בכל פתיחה של האפליקציה. בעת עלייה האפליקציה משחזרת אותה (isRestoring).
// בנוסף נוספה authedFetch - קריאה לשרת עם הטוקן שמנקה את ההתחברות אוטומטית אם השרת עונה 401 (טוקן לא תקף).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { API_BASE_URL } from "@/constants/api";
import { ApiError, apiFetch, type ApiOptions } from "@/lib/api";
import { clearSession, loadSession, saveSession } from "@/lib/session-storage";

export type ChavrutaUser = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
};

type AuthContextValue = {
  token: string | null;
  user: ChavrutaUser | null;
  isRestoring: boolean; // true בזמן ששוחזרת התחברות שמורה (כדי לא להבהב מסך התחברות לרגע)
  isLoggingIn: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  authedFetch: <T>(path: string, options?: ApiOptions) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ChavrutaUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // בעלייה ראשונה: משחזרים התחברות שמורה (אם יש)
  useEffect(() => {
    let cancelled = false;
    loadSession().then((saved) => {
      if (cancelled) return;
      if (saved) {
        setToken(saved.token);
        setUser(saved.user);
      }
      setIsRestoring(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      await saveSession(data.token, data.user);
    } catch (error) {
      // הסיבה הנפוצה ביותר לכישלון כאן: API_BASE_URL (src/constants/api.ts) לא מוגדר נכון,
      // השרת לא פועל (npm run dev), או שהטלפון לא מחובר לאותה רשת WiFi כמו המחשב
      setLoginError("לא ניתן להתחבר לשרת - בדוק את API_BASE_URL ושהשרת פועל");
    } finally {
      setIsLoggingIn(false);
    }
  }

  // ניקוי ההתחברות מקומית (בלי פנייה לשרת) - משמש גם להתנתקות וגם כשהשרת דחה את הטוקן
  const clearLocalSession = useCallback(() => {
    setToken(null);
    setUser(null);
    clearSession();
  }, []);

  function logout() {
    // מבטלים את הטוקן גם בשרת (עכשיו כשהוא נשמר לאורך זמן, חשוב שלא יישאר תקף). הכישלון לא מעכב את ההתנתקות בממשק
    if (token) {
      apiFetch("/api/mobile/logout", token, { method: "POST" }).catch(() => {});
    }
    clearLocalSession();
  }

  // קריאה לשרת עם הטוקן הנוכחי. אם השרת עונה 401 (הטוקן נמחק/לא תקף) - מתנתקים ומציגים שוב את מסך ההתחברות
  const authedFetch = useCallback(
    async <T,>(path: string, options?: ApiOptions): Promise<T> => {
      try {
        return await apiFetch<T>(path, token, options);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) clearLocalSession();
        throw error;
      }
    },
    [token, clearLocalSession]
  );

  const value = useMemo(
    () => ({ token, user, isRestoring, isLoggingIn, loginError, login, logout, authedFetch }),
    // login/logout נוצרות מחדש בכל רינדור אבל תלויות רק במצב שכבר ברשימה, ולכן אין צורך להוסיף אותן
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, isRestoring, isLoggingIn, loginError, authedFetch]
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
