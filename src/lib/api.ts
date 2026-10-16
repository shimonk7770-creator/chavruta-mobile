// src/lib/api.ts
// פונקציית עזר אחת לכל הקריאות לשרת חברותא: מוסיפה את הטוקן, מפענחת JSON, ומתרגמת כל כישלון
// (רשת / שגיאת שרת / success:false) ל-ApiError אחד עם הודעה בעברית שאפשר להציג למשתמש כמו שהיא.
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
  body?: unknown;
};

export async function apiFetch<T>(path: string, token: string | null, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // הסיבה הנפוצה: API_BASE_URL (src/constants/api.ts) שגוי, השרת לא פועל, או שהטלפון לא באותה רשת WiFi כמו המחשב
    throw new ApiError("לא ניתן להתחבר לשרת - בדוק שהשרת פועל ושהטלפון באותה רשת WiFi", 0);
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
