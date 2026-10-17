// src/components/app-tabs.tsx - ניווט ראשי של האפליקציה, רספונסיבי:
//  - טלפון: סרגל תחתון עם 5 לשוניות (בית, פיד, קבוצות, הודעות, עוד); שאר האזורים נפתחים ממסך "עוד".
//  - מסך רחב (מחשב / טאבלט גדול): סרגל צדדי בצד ימין (כמו תפריט האתר) עם כל אזורי האתר.
// כל המסכים נמצאים בתוך אותו Tabs, כדי שהסרגל יישאר במקומו בכל מעבר; מסכים שאינם לשוניות מוסתרים עם href:null.
import { Tabs, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { SECTIONS } from "@/constants/sections";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsive } from "@/hooks/use-responsive";

function TabEmoji({ emoji, focused, badge }: { emoji: string; focused: boolean; badge?: number }) {
  return (
    <View>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
      {badge ? (
        <View style={{ position: "absolute", top: -4, right: -8, backgroundColor: "#c0392b", borderRadius: 9, minWidth: 18, paddingHorizontal: 4 }}>
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", textAlign: "center" }}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

// כפתור "חזרה" בכותרת של מסכי משנה. ב-Tabs אין כפתור חזרה אוטומטי; אם אין לאן לחזור עוברים לבית.
function BackButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={12} style={{ paddingHorizontal: 16 }}>
      <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "600" }}>‹ חזרה</Text>
    </Pressable>
  );
}

// מסכים שאינם בסרגל (נפתחים מתוך מסכים אחרים): שם הקובץ ← כותרת
const HIDDEN_SCREENS: { name: string; title: string }[] = [
  { name: "group/[id]", title: "קבוצה" },
  { name: "group-new", title: "קבוצה חדשה" },
  { name: "group-edit", title: "עריכת קבוצה" },
  { name: "group-chat", title: "צ'אט קבוצתי" },
  { name: "post-edit", title: "עריכת פוסט" },
  { name: "dm", title: "שיחה" },
  { name: "holiday", title: "מעגל השנה" },
  { name: "holiday-edit", title: "מאמר חג" },
  { name: "prayer-read", title: "נוסח תפילה" },
  { name: "minyan-new", title: "הוספת מניין" },
  { name: "status-new", title: "סטטוס חדש" },
  { name: "status-view", title: "סטטוס" },
  { name: "login", title: "התחברות" },
  { name: "more", title: "עוד" },
];

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const { isWide } = useResponsive();
  const { isAdmin, token } = useAuth();
  const { unreadCount } = useSocket();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.secondaryDark },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "700", fontSize: 20 },
        headerTitleAlign: "center",
        tabBarPosition: isWide ? "right" : "bottom",
        tabBarVariant: isWide ? "material" : undefined,
        tabBarLabelPosition: isWide ? "beside-icon" : undefined,
        tabBarStyle: { backgroundColor: colors.backgroundElement, borderColor: colors.border, ...(isWide ? { width: 230 } : null) },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: isWide ? 15 : 12, fontWeight: "600" },
      }}>
      {SECTIONS.map((s) => {
        // בטלפון רק לשוניות ה-phoneTab מוצגות בסרגל; במסך רחב כל האזורים (ולמנהל מערכת בלבד - אזורי הניהול)
        const visible = (s.phoneTab || isWide) && (!s.adminOnly || isAdmin) && !(s.route === "profile" && !token);
        return (
          <Tabs.Screen
            key={s.route}
            name={s.route}
            options={{
              href: visible ? undefined : null,
              title: s.title,
              headerTitle: s.route === "index" ? "📖 חברותא" : s.title,
              tabBarIcon: ({ focused }) => (
                <TabEmoji emoji={s.emoji} focused={focused} badge={s.route === "notifications" || (!isWide && s.route === "messages") ? unreadCount : 0} />
              ),
            }}
          />
        );
      })}
      {/* "עוד" - לשונית אחרונה בטלפון, שפותחת את כל שאר האזורים */}
      <Tabs.Screen
        name="more"
        options={{
          href: isWide ? null : undefined,
          title: "עוד",
          headerTitle: "עוד",
          tabBarIcon: ({ focused }) => <TabEmoji emoji="☰" focused={focused} />,
        }}
      />
      {HIDDEN_SCREENS.filter((h) => h.name !== "more").map((h) => (
        <Tabs.Screen key={h.name} name={h.name} options={{ href: null, title: h.title, headerTitle: h.title, headerLeft: () => <BackButton /> }} />
      ))}
    </Tabs>
  );
}
