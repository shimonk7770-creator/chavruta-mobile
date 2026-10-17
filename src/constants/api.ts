// src/constants/api.ts
// כתובת הבסיס של שרת חברותא (chavruta-app). סדר הזיהוי (הראשון שמתאים מנצח):
//  1. EXPO_PUBLIC_API_URL - כתובת מפורשת (למשל השרת הציבורי ב-Render: https://chavruta.onrender.com). זה מה שבונים לתוכו
//     את גרסת ה-Expo Go הציבורית (EAS Update) ואת גרסאות הבילד. אפשר להגדיר בקובץ .env של הפרויקט.
//  2. גרסת web שמוגשת מהשרת עצמו (https://<השרת>/app) - אותו origin, לכן הנתיבים יחסיים לשרת.
//  3. גרסת web בפיתוח (expo start --web על localhost:8081) - השרת המקומי על פורט 3000.
//  4. Expo Go במצב פיתוח - Metro יושב על המחשב, ולכן hostUri מכיל את כתובת ה-IP של המחשב (למשל 192.168.1.5:8081);
//     שרת חברותא רץ על אותו מחשב, אז מחליפים רק את הפורט.
//  5. גיבוי ידני (FALLBACK_URL) אם שום זיהוי לא הצליח.
import Constants from "expo-constants";
import { Platform } from "react-native";

const SERVER_PORT = 3000; // הפורט של chavruta-app (PORT ב-.env)
const FALLBACK_URL = "http://10.100.102.3:3000"; // גיבוי ידני - לעדכן אם הזיהוי האוטומטי לא עובד

function detectBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const { hostname, port, origin } = window.location;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    // שרת הפיתוח של Expo (8081 / 19006) אינו שרת חברותא - פונים לפורט 3000 באותו מחשב
    if (isLocal && port !== String(SERVER_PORT)) return `http://${hostname}:${SERVER_PORT}`;
    return origin;
  }

  const hostUri = Constants.expoConfig?.hostUri; // למשל "192.168.1.5:8081"
  const host = hostUri ? hostUri.split(":")[0] : "";
  // מקבלים רק כתובת IPv4 רגילה. כתובת אחרת (דומיין של Tunnel) לא תוביל לשרת שלנו
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return `http://${host}:${SERVER_PORT}`;
  return FALLBACK_URL;
}

export const API_BASE_URL = detectBaseUrl();

// כתובת יחסית מהשרת ("/uploads/x.jpg") הופכת לכתובת מלאה; כתובת מלאה נשארת כמו שהיא
export function resolveUrl(url?: string | null): string {
  if (!url) return "";
  if (/^(https?:|data:|file:|blob:)/i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

// כל קריאה לבקרי האתר (מניינים, לימוד, חגים...) עוברת דרך "גשר" השרת - ראו chavruta-app/server/middleware/mobileBridge.js
export const WEB_PREFIX = "/api/mobile/web";
