// src/contexts/auth-context.tsx
// ניהול מצב ההתחברות של האפליקציה - טוקן + פרטי המשתמש המחובר, משותף לכל הטאבים דרך React Context
// (ראו server/models/MobileToken.js בשרת להסבר המלא על מנגנון הטוקן).
//
// עדכון (שלב 1 של ההעברה למובייל): ההתחברות נשמרת עכשיו בכספת המאובטחת של הטלפון (lib/session-storage.ts),
// כך שאין צורך להתחבר מחדש בכל פתיחה של האפליקציה. בעת עלייה האפליקציה משחזרת אותה (isRestoring).
// בנוסף נוספה authedFetch - קריאה לשרת עם הטוקן שמנקה את ההתחברות אוטומטית אם השרת עונה 401 (טוקן לא תקף).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { API_BASE_URL, resolveUrl, WEB_PREFIX } from "@/constants/api";
import { ApiError, apiFetch, type ApiOptions } from "@/lib/api";
import { clearSession, loadSession, saveSession } from "@/lib/session-storage";

export type ChavrutaUser = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  role?: string; // member / manager / admin - קובע אילו אזורים מוצגים (למשל לוח בקרה למנהל)
};

// תשובת "גשר" השרת (chavruta-app/server/middleware/mobileBridge.js): אותם בקרים של האתר, כ-JSON.
// data = בדיוק הנתונים שהאתר מציג בתבנית (EJS), me = המשתמש המחובר, message/redirect = תוצאת פעולה (במקום הפניה בדפדפן)
export type BridgeMe = { isLoggedIn: boolean; userId: string | null; userRole: string | null; userName: string | null };
export type BridgeResponse<T = Record<string, unknown>> = {
  success: boolean;
  view?: string;
  data: T;
  me?: BridgeMe;
  message?: string;
  redirect?: string;
};

export type WebClient = {
  get: <T = Record<string, unknown>>(path: string) => Promise<BridgeResponse<T>>;
  post: <T = Record<string, unknown>>(path: string, body?: unknown) => Promise<BridgeResponse<T>>;
  put: <T = Record<string, unknown>>(path: string, body?: unknown) => Promise<BridgeResponse<T>>;
  del: <T = Record<string, unknown>>(path: string, body?: unknown) => Promise<BridgeResponse<T>>;
  // העלאת קבצים (FormData) - למשל תמונת פרופיל / סטטוס / תמונות לפוסט
  upload: <T = Record<string, unknown>>(path: string, form: FormData, method?: "POST" | "PUT") => Promise<BridgeResponse<T>>;
};

export type RegisterFields = { fullName: string; username: string; email: string; password: string; confirmPassword: string };

type AuthContextValue = {
  token: string | null;
  user: ChavrutaUser | null;
  isRestoring: boolean; // true בזמן ששוחזרת התחברות שמורה (כדי לא להבהב מסך התחברות לרגע)
  isLoggingIn: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fields: RegisterFields) => Promise<void>;
  logout: () => void;
  authedFetch: <T>(path: string, options?: ApiOptions) => Promise<T>;
  web: WebClient; // קריאות לבקרי האתר דרך הגשר (נתיב כמו באתר, למשל web.get("/minyanim?city=jerusalem"))
  updateUser: (patch: Partial<ChavrutaUser>) => void; // אחרי עריכת פרופיל - מרענן את השם/התמונה בכל האפליקציה
  isAdmin: boolean;
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
      await startSession(data.token, data.user);
    } catch (error) {
      // הסיבה הנפוצה ביותר לכישלון כאן: כתובת השרת (src/constants/api.ts) לא נכונה, השרת לא פועל, או שאין אינטרנט.
      // בשרת חינמי (Render) הבקשה הראשונה אחרי תקופה ללא פעילות יכולה לקחת כדקה, עד שהשרת מתעורר
      setLoginError("לא ניתן להתחבר לשרת. בדקו את החיבור לאינטרנט ונסו שוב (אם השרת היה לא פעיל, המתינו כדקה ונסו שוב).");
    } finally {
      setIsLoggingIn(false);
    }
  }

  // שמירת התחברות שהצליחה (גם מהתחברות וגם מהרשמה): טוקן + משתמש בזיכרון ובכספת המאובטחת
  async function startSession(newToken: string, newUser: ChavrutaUser) {
    const normalized = { ...newUser, avatarUrl: resolveUrl(newUser.avatarUrl) };
    setToken(newToken);
    setUser(normalized);
    await saveSession(newToken, normalized);
  }

  // הרשמה - אותם כללים כמו באתר (סיסמה 8+ תווים, אות גדולה וספרה); בהצלחה מתחברים אוטומטית
  async function register(fields: RegisterFields) {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || "שגיאה בהרשמה");
        return;
      }
      await startSession(data.token, data.user);
    } catch {
      setLoginError("לא ניתן להתחבר לשרת. בדקו את החיבור לאינטרנט ונסו שוב.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  const updateUser = useCallback((patch: Partial<ChavrutaUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch, avatarUrl: patch.avatarUrl !== undefined ? resolveUrl(patch.avatarUrl) : prev.avatarUrl };
      saveSession(token ?? "", next);
      return next;
    });
  }, [token]);

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

  // לקוח הגשר: כל נתיב מקבל את הקידומת /api/mobile/web והטוקן, והשגיאות עוברות דרך authedFetch (401 = התנתקות)
  const web = useMemo<WebClient>(() => {
    const call = <T,>(path: string, options?: ApiOptions) => authedFetch<BridgeResponse<T>>(`${WEB_PREFIX}${path}`, options);
    return {
      // נוסח תפילה בטעינה ראשונה (עשרות קריאות ל-Sefaria) ושרת חינמי "מתעורר" יכולים לקחת זמן - לכן מגבלת זמן נדיבה
      get: (path) => call(path, { timeoutMs: 120_000 }),
      post: (path, body) => call(path, { method: "POST", body: body ?? {}, timeoutMs: 120_000 }),
      put: (path, body) => call(path, { method: "PUT", body: body ?? {}, timeoutMs: 120_000 }),
      del: (path, body) => call(path, { method: "DELETE", body, timeoutMs: 120_000 }),
      upload: (path, form, method = "POST") => call(path, { method, body: form, timeoutMs: 120_000 }),
    };
  }, [authedFetch]);

  const isAdmin = user?.role === "admin";

  const value = useMemo(
    () => ({ token, user, isRestoring, isLoggingIn, loginError, login, register, logout, authedFetch, web, updateUser, isAdmin }),
    // login/logout נוצרות מחדש בכל רינדור אבל תלויות רק במצב שכבר ברשימה, ולכן אין צורך להוסיף אותן
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, isRestoring, isLoggingIn, loginError, authedFetch, web, updateUser, isAdmin]
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
