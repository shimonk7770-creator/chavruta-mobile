// src/lib/api.ts
// פונקציית עזר אחת לכל הקריאות לשרת חברותא: מוסיפה את הטוקן, מפענחת JSON, ומתרגמת כל כישלון
// (רשת / שגיאת שרת / success:false) ל-ApiError אחד עם הודעה בעברית שאפשר להציג למשתמש כמו שהיא.
// תומכת גם בהעלאת קבצים (FormData) - הדפדפן / React Native קובעים לבד את Content-Type עם ה-boundary, ולכן לא מגדירים אותו ידנית.
import { API_BASE_URL } from "@/constants/api";

// שגיאה מהשרת. status = קוד HTTP (0 = לא הצלחנו להגיע לשרת בכלל), כך שאפשר להבחין למשל ב-401 (טוקן לא תקף)
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown; // אובייקט (נשלח כ-JSON) או FormData (העלאת קבצים)
  timeoutMs?: number; // ברירת מחדל 60 שניות (שרת חינמי "מתעורר" לאט; נוסח תפילה בטעינה ראשונה יכול לקחת יותר)
};

const DEFAULT_TIMEOUT_MS = 60_000;

export async function apiFetch<T>(path: string, token: string | null, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch {
    // הסיבות הנפוצות: השרת לא פועל / "ישן" (שרת חינמי מתעורר תוך כדקה), אין אינטרנט, או כתובת שגויה (src/constants/api.ts)
    throw new ApiError("לא ניתן להתחבר לשרת. בדקו את החיבור לאינטרנט ונסו שוב (אם השרת היה לא פעיל, ייתכן שהוא מתעורר - המתינו כדקה).", 0);
  } finally {
    clearTimeout(timer);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // תשובה שאינה JSON - נטפל בה למטה לפי קוד ה-HTTP
  }
  const body = (data ?? {}) as { success?: boolean; message?: string };

  if (!res.ok || body.success === false) {
    throw new ApiError(body.message || "אירעה שגיאה. נסו שוב.", res.status);
  }
  return data as T;
}
