// src/lib/session-storage.ts
// שמירת ההתחברות (טוקן + פרטי המשתמש) בכספת המאובטחת של הטלפון (expo-secure-store):
// ב-Android זה SharedPreferences מוצפן במפתח Keystore, וב-iOS זה ה-Keychain. בזכות זה לא צריך להתחבר מחדש בכל פתיחה.
//
// עמידות: הספרייה נטענת בתוך try/catch ולא ב-import רגיל. אם המודול הנייטיבי לא זמין (גרסת Expo Go לא תואמת,
// דפדפן, או חבילה שלא הותקנה) האפליקציה פשוט תעבוד בלי שמירת התחברות, במקום לקרוס כבר בעלייה.
import type { ChavrutaUser } from "@/contexts/auth-context";

type SecureStoreModule = typeof import("expo-secure-store");

let SecureStore: SecureStoreModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SecureStore = require("expo-secure-store") as SecureStoreModule;
} catch {
  SecureStore = null;
}

const TOKEN_KEY = "chavruta_token";
const USER_KEY = "chavruta_user";

export type StoredSession = { token: string; user: ChavrutaUser };

export async function saveSession(token: string, user: ChavrutaUser): Promise<void> {
  if (!SecureStore) return;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch {
    // אין כספת - ממשיכים בלי שמירה
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  if (!SecureStore) return null;
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (!token || !userJson) return null;
    return { token, user: JSON.parse(userJson) as ChavrutaUser };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  if (!SecureStore) return;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // אין מה למחוק
  }
}
