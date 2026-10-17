// src/constants/sections.ts - כל אזורי האפליקציה במקום אחד (מקביל לתפריט הניווט של האתר, server/views/partials/header.ejs).
// משמש את סרגל הניווט (components/app-tabs.tsx), את מסך הבית ואת מסך "עוד". route = שם הקובץ תחת src/app.
export type SectionCategory = "main" | "community" | "tools" | "learning" | "admin";

export type SectionDef = {
  route: string;
  title: string;
  emoji: string;
  description: string;
  category: SectionCategory;
  phoneTab?: boolean; // מופיע בסרגל התחתון בטלפון (במסך רחב כל האזורים בסרגל צד)
  adminOnly?: boolean;
  needsLogin?: boolean;
};

export const CATEGORY_TITLES: Record<SectionCategory, string> = {
  main: "ראשי",
  community: "קהילה",
  tools: "כלים ויום יומי",
  learning: "לימוד",
  admin: "ניהול",
};

export const SECTIONS: SectionDef[] = [
  { route: "index", title: "בית", emoji: "🏠", description: "סטטוסים, שבת ופעולות מהירות", category: "main", phoneTab: true },
  { route: "feed", title: "פיד", emoji: "📰", description: "פוסטים מהקבוצות שלי ומהקהילה", category: "main", phoneTab: true },
  { route: "groups", title: "בית חב״ד", emoji: "🕍", description: "מדורים וקבוצות", category: "community", phoneTab: true },
  { route: "messages", title: "הודעות", emoji: "💬", description: "שיחות פרטיות וצ'אטים של קבוצות", category: "community", phoneTab: true, needsLogin: true },
  { route: "notifications", title: "התראות", emoji: "🔔", description: "מה חדש בשבילי", category: "community", needsLogin: true },
  { route: "search", title: "חיפוש", emoji: "🔎", description: "חיפוש פוסטים, קבוצות ושאלה לבינה מלאכותית", category: "community" },
  { route: "minyanim", title: "מניינים", emoji: "🕯️", description: "מניינים קרובים, יצירה ו״אני מגיע״", category: "community" },
  { route: "holidays", title: "חגים", emoji: "🕎", description: "מאמרים, מנהגים ותפילות לכל חג", category: "learning" },
  { route: "zmanim", title: "זמני היום", emoji: "🌅", description: "זמני שבת, הדלקת נרות והלכתיים לפי עיר", category: "tools" },
  { route: "prayers", title: "תפילות", emoji: "📖", description: "סידור לפי נוסח, עם הסבר AI", category: "tools" },
  { route: "compass", title: "מצפן", emoji: "🧭", description: "כיוון התפילה לירושלים", category: "tools" },
  { route: "learning", title: "יומן לימוד", emoji: "📚", description: "מעקב לימוד, רצף ומפת חום", category: "learning", needsLogin: true },
  { route: "study-room", title: "חדר לימוד", emoji: "🎬", description: "ספריית שיעורי וידאו", category: "learning", needsLogin: true },
  { route: "profile", title: "פרופיל", emoji: "👤", description: "הפרופיל שלי והגדרות", category: "main", needsLogin: true },
  { route: "permissions", title: "הרשאות", emoji: "🔐", description: "מה מותר לכל תפקיד במערכת", category: "tools" },
  { route: "admin", title: "לוח בקרה", emoji: "📊", description: "סטטיסטיקות מערכת", category: "admin", adminOnly: true, needsLogin: true },
  { route: "admin-users", title: "משתמשים", emoji: "👥", description: "ניהול משתמשים ותפקידים", category: "admin", adminOnly: true, needsLogin: true },
  { route: "admin-moderation", title: "בקרת תוכן", emoji: "🛡️", description: "דיווחים ותוכן שממתין לבדיקה", category: "admin", adminOnly: true, needsLogin: true },
];
