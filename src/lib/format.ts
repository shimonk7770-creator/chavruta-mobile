// src/lib/format.ts - עיצוב תאריכים ושעות בעברית (מקביל ל-toLocaleDateString("he-IL") באתר)
export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("he-IL");
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("he-IL")} ${d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
}

export function formatTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

// YYYY-MM-DD של היום (לשדה תאריך בטפסים)
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// תאריך ממבנים שונים שמגיעים מהשרת: מחרוזת ISO, Date, או Timestamp של Firestore ({_seconds}/{seconds}) - בהודעות שמשודרות ב-Socket.io
export function toIso(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const v = value as { _seconds?: number; seconds?: number };
    const secs = v._seconds ?? v.seconds;
    if (typeof secs === "number") return new Date(secs * 1000).toISOString();
  }
  return "";
}
