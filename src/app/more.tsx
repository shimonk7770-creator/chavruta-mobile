// src/app/more.tsx - מסך "עוד": כל אזורי האתר שאינם בסרגל התחתון, מקובצים לפי נושא (בטלפון). כולל התנתקות.
import { useRouter } from "expo-router";

import { Btn, Card, Grid, H2, Muted, Row, Screen } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { CATEGORY_TITLES, SECTIONS, type SectionDef } from "@/constants/sections";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { Avatar } from "@/components/kit";

export default function MoreScreen() {
  const router = useRouter();
  const { user, token, isAdmin, logout } = useAuth();
  const { unreadCount } = useSocket();

  const open = (s: SectionDef) => router.push(s.route === "index" ? "/" : (`/${s.route}` as never));
  const categories = (Object.keys(CATEGORY_TITLES) as SectionDef["category"][]).filter((c) => c !== "main" && (c !== "admin" || isAdmin));

  return (
    <Screen>
      {user ? (
        <Card onPress={() => router.push("/profile" as never)}>
          <Row>
            <Avatar name={user.fullName} url={user.avatarUrl} size={52} />
            <Row style={{ flex: 1, flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
              <ThemedText style={{ fontWeight: "700", fontSize: 18, textAlign: "right" }}>{user.fullName}</ThemedText>
              <Muted>@{user.username} · לפרופיל ›</Muted>
            </Row>
          </Row>
        </Card>
      ) : (
        <Btn title="התחברות / הרשמה" onPress={() => router.push("/login" as never)} />
      )}
      {categories.map((cat) => (
        <Row key={cat} style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <H2>{CATEGORY_TITLES[cat]}</H2>
          <Grid>
            {SECTIONS.filter((s) => s.category === cat && !s.phoneTab && (!s.adminOnly || isAdmin)).map((s) => (
              <Card key={s.route} onPress={() => open(s)} style={{ minHeight: 92 }}>
                <ThemedText style={{ fontSize: 28, lineHeight: 36, textAlign: "right" }}>{s.emoji}</ThemedText>
                <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>
                  {s.title}
                  {s.route === "notifications" && unreadCount ? `  (${unreadCount})` : ""}
                </ThemedText>
                <Muted>{s.description}</Muted>
              </Card>
            ))}
          </Grid>
        </Row>
      ))}
      {token ? <Btn title="התנתקות" variant="outline" onPress={logout} /> : null}
    </Screen>
  );
}
