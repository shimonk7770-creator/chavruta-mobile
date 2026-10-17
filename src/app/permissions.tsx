// src/app/permissions.tsx - "הרשאות באתר": מי יכול לעשות מה (אורח / חבר / מנהל קבוצה / מנהל מערכת) והטבלה המלאה. מקביל ל-/permissions.
import { View } from "react-native";

import { Badge, Card, H1, H2, Muted, Screen } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

const ROLES = [
  { badge: "אורח", text: "לא נרשמת עדיין, או שגלשת בלי להתחבר. אפשר לצפות במדורים ובפוסטים ובעמוד \"מעגל השנה\" - אבל לא לפרסם, להגיב, לדווח או להצטרף." },
  { badge: "חבר קהילה (member)", text: "כל משתמש חדש מקבל הרשאה זו מיד עם ההרשמה. אפשר: להצטרף למדורי בית חב״ד (מדור אחד מכל סוג), לפרסם פוסטים ותגובות בקבוצות שהוא חבר בהן, לצ'וטט, לעקוב אחרי הלימוד האישי ולדווח על תוכן לא ראוי.\n\nלפני פרסום במדור, Gemini בודק שהתוכן מתאים לנושא המדור. אם ה-AI לא זמין, התוכן מתפרסם ומסומן לבדיקת מנהל." },
  { badge: "מנהל קבוצה", text: "מי שמונה כמנהל של קבוצה מסוימת. אפשר: לערוך את הקבוצה שהוא מנהל, להסיר כל פוסט ותגובה בתוך הקבוצה הזו בלבד ולנהל מי חבר בה. בקבוצות אחרות הוא חבר רגיל." },
  { badge: "מנהל מערכת (admin)", text: "הרשאת העל של האתר. בנוסף לכל מה שמנהל קבוצה יכול (בכל קבוצה): יצירת מדורים/קבוצות חדשים, ניהול משתמשים (השבתה, הפעלה מחדש, מינוי), טיפול בדיווחים והסרת תוכן, ופרסום \"מעגל השנה\". כל זה נמצא בקטגוריית \"ניהול\" שמופיעה רק לו." },
];

// [פעולה, אורח, חבר, מנהל קבוצה, מנהל מערכת]
const TABLE: string[][] = [
  ["צפייה בתוכן ציבורי", "✔", "✔", "✔", "✔"],
  ["הצטרפות למדור ופרסום פוסט/תגובה", "✘", "✔", "✔", "✔"],
  ["עריכה/מחיקה של התוכן שלי", "✘", "✔", "✔", "✔"],
  ["דיווח על תוכן של אחרים (🚩)", "✘", "✔", "✔", "✔"],
  ["הסרת פוסט/תגובה של אחרים", "✘", "✘", "✔ בקבוצה שלו", "✔ בכל קבוצה"],
  ["יצירת מדור/קבוצה חדשים", "✘", "✘", "✘", "✔"],
  ["ניהול משתמשים (השבתה, הפעלה, מינוי מנהל)", "✘", "✘", "✘", "✔"],
  ["טיפול בדיווחים ובתוכן שה-AI לא בדק", "✘", "✘", "✘", "✔"],
  ["שליחת הודעת צ'אט", "✘", "✔", "✔", "✔"],
  ["פרסום תוכן \"מעגל השנה\"", "✘", "✘", "✘", "✔"],
];

export default function PermissionsScreen() {
  const theme = useTheme();
  const { user, token } = useAuth();
  const mine = !token ? "אורח" : user?.role === "admin" ? "מנהל מערכת" : user?.role === "manager" ? "מנהל קבוצה" : "חבר קהילה";
  return (
    <Screen>
      <H1>הרשאות באתר - מי יכול לעשות מה?</H1>
      <Muted>בחברותא יש ארבעה סוגי משתמשים: אורח, חבר קהילה, מנהל קבוצה ומנהל מערכת.</Muted>
      <Card style={{ borderColor: theme.secondary }}>
        <H2>ההרשאה שלך כרגע</H2>
        <Badge text={mine} tone="orange" />
      </Card>
      {ROLES.map((r) => (
        <Card key={r.badge}>
          <Badge text={r.badge} />
          <ThemedText style={{ textAlign: "right" }}>{r.text}</ThemedText>
        </Card>
      ))}
      <H2>טבלת הרשאות מלאה</H2>
      <Card>
        <View style={{ flexDirection: "row-reverse", gap: 4 }}>
          {["פעולה", "אורח", "חבר", "מנהל קבוצה", "מנהל מערכת"].map((h, i) => (
            <ThemedText key={h} type="smallBold" style={{ flex: i === 0 ? 3 : 1.2, textAlign: i === 0 ? "right" : "center", color: theme.secondary }}>{h}</ThemedText>
          ))}
        </View>
        {TABLE.map((row, ri) => (
          <View key={ri} style={{ flexDirection: "row-reverse", gap: 4, borderTopWidth: 0.5, borderTopColor: theme.border, paddingTop: 6 }}>
            {row.map((c, i) => (
              <ThemedText key={i} type="small" style={{ flex: i === 0 ? 3 : 1.2, textAlign: i === 0 ? "right" : "center", color: c.startsWith("✘") ? "#c0392b" : theme.text }}>{c}</ThemedText>
            ))}
          </View>
        ))}
      </Card>
      <Muted>עיקרון אבטחה: כל ההרשאות נבדקות בפועל בצד השרת בכל בקשה, ולא רק מוסתרות בממשק - כך שאי אפשר &quot;לעקוף&quot; אותן.</Muted>
    </Screen>
  );
}
