// src/constants/api.ts
// כתובת הבסיס של שרת חברותא (chavruta-app). הטלפון לא יכול להשתמש ב-"localhost" (זה הטלפון עצמו, לא המחשב),
// אלא בכתובת ה-IP של המחשב ברשת ה-WiFi.
//
// עדכון: הכתובת מזוהה עכשיו אוטומטית. כשהאפליקציה רצה ב-Expo Go, שרת הפיתוח (Metro) יושב על המחשב עצמו,
// ו-Constants.expoConfig.hostUri מכיל את הכתובת שדרכה הטלפון הגיע אליו (למשל "192.168.1.5:8081").
// שרת חברותא רץ על אותו מחשב, ולכן מספיק להחליף את הפורט. כך האפליקציה לא נשברת כשה-IP של המחשב משתנה
// (רשת אחרת, אתחול נתב). אם הזיהוי לא מצליח (למשל חיבור Tunnel), משתמשים בכתובת הקבועה למטה.
import Constants from "expo-constants";

const SERVER_PORT = 3000; // הפורט של chavruta-app (PORT ב-.env)
const FALLBACK_URL = "http://10.100.102.3:3000"; // גיבוי ידני - לעדכן אם הזיהוי האוטומטי לא עובד

function detectBaseUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri; // למשל "192.168.1.5:8081"
  const host = hostUri ? hostUri.split(":")[0] : "";
  // מקבלים רק כתובת IPv4 רגילה. כתובת אחרת (דומיין של Tunnel) לא תוביל לשרת שלנו
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return `http://${host}:${SERVER_PORT}`;
  }
  return FALLBACK_URL;
}

export const API_BASE_URL = detectBaseUrl();
