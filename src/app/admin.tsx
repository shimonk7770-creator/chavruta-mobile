// src/app/admin.tsx - לוח בקרה למנהל מערכת: ספירות כלליות (משתמשים, קבוצות, פוסטים...). מקביל ל-/admin/dashboard. נאכף גם בשרת.
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Btn, Card, ErrorView, H1, Loading, Muted, Row, Screen } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";

type Dash = {
  totals: { users: number; groups: number; posts: number; comments: number; messages: number; holidays: number };
  roleCounts: { member?: number; manager?: number; admin?: number };
  lockedCount: number;
  inactiveCount: number;
};

export default function AdminScreen() {
  return (
    <RequireLogin>
      <Dashboard />
    </RequireLogin>
  );
}

function Dashboard() {
  const router = useRouter();
  const { web } = useAuth();
  const { data, error, loading, refresh, refreshing, reload } = useLoad(async () => (await web.get<Dash>("/admin/dashboard")).data, []);
  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  const tiles: [string, number][] = [
    ["משתמשים", data.totals.users],
    ["קבוצות", data.totals.groups],
    ["פוסטים פעילים", data.totals.posts],
    ["תגובות", data.totals.comments],
    ["הודעות צ'אט", data.totals.messages],
    ["מאמרי מעגל השנה", data.totals.holidays],
    ["חברי קהילה", data.roleCounts.member || 0],
    ["מנהלי קבוצה", data.roleCounts.manager || 0],
    ["מנהלי מערכת", data.roleCounts.admin || 0],
    ["חשבונות נעולים כרגע", data.lockedCount],
    ["חשבונות מחוקים", data.inactiveCount],
  ];
  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <H1>📊 לוח בקרה</H1>
      <Row style={{ flexWrap: "wrap" }}>
        <Btn small title="ניהול משתמשים" onPress={() => router.push("/admin-users" as never)} />
        <Btn small title="פיקוח תוכן" onPress={() => router.push("/admin-moderation" as never)} />
      </Row>
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 }}>
        {tiles.map(([label, n]) => (
          <Card key={label} style={{ flexBasis: "30%", flexGrow: 1, minWidth: 140, alignItems: "center" }}>
            <ThemedText style={{ fontSize: 30, fontWeight: "700" }}>{n}</ThemedText>
            <Muted>{label}</Muted>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
