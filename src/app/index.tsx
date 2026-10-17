// src/app/index.tsx - מסך הבית: כמו דף הבית באתר - זמני שבת, שורת סטטוסים, וקיצורי דרך לכל אזורי האתר.
// הנתונים מגיעים מ-GET / של האתר (pageRoutes.js) דרך הגשר: { shabbat, statusFeed, myActiveStatusCount }.
import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, View } from "react-native";

import { Avatar, Banner, Btn, Card, ErrorView, Grid, H2, Hero, Loading, Muted, Row, Screen } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { SECTIONS } from "@/constants/sections";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";
import { useTheme } from "@/hooks/use-theme";

type Shabbat = { cityHe: string; parashaHe?: string; candleLighting?: string; havdalah?: string; upcoming?: string[] };
type StatusEntry = { userId: string; userName: string; avatarUrl?: string; seenByMe?: boolean };
type HomeData = { shabbat: Shabbat | null; statusFeed: StatusEntry[]; myActiveStatusCount: number };

const INSPIRATION_VIDEO = "https://www.youtube.com/watch?v=ormF3yMohnI"; // אותו סרטון "רגע של השראה" כמו באתר

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { web, user, token, isRestoring, isAdmin } = useAuth();
  const { data, error, loading, refresh, refreshing, reload } = useLoad(
    async () => (await web.get<HomeData>("/")).data,
    [token]
  );

  if (isRestoring || (loading && !data)) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  const go = (path: string) => router.push(path as never);
  const shabbat = data?.shabbat;
  const quick = SECTIONS.filter((s) => !["index", "feed", "profile"].includes(s.route) && (!s.adminOnly || isAdmin) && (!s.needsLogin || token));

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Hero title={user ? `שלום, ${user.fullName} 👋` : 'ברוכים הבאים ל"חברותא"'} subtitle="רשת חברתית קהילתית - שיעורים, קבוצות לימוד, דברי תורה, מעקב התקדמות וחיבור קהילתי.">
        {!token ? <Btn title="הצטרפו עכשיו" variant="primary" onPress={() => go("/login")} style={{ marginTop: Spacing.two }} /> : null}
      </Hero>

      {token ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row-reverse", gap: Spacing.three, paddingVertical: Spacing.one }}>
          <Pressable onPress={() => go(data && data.myActiveStatusCount > 0 ? `/status-view?userId=${user?.id}` : "/status-new")} style={{ alignItems: "center", width: 68 }}>
            <View style={{ borderWidth: 3, borderColor: data && data.myActiveStatusCount > 0 ? theme.primary : theme.border, borderRadius: 40, padding: 2 }}>
              <Avatar name={user?.fullName} url={user?.avatarUrl} size={54} />
            </View>
            <ThemedText type="small" numberOfLines={1}>{data && data.myActiveStatusCount > 0 ? "הסטטוס שלי" : "＋ הוספה"}</ThemedText>
          </Pressable>
          {(data?.statusFeed ?? []).map((s) => (
            <Pressable key={s.userId} onPress={() => go(`/status-view?userId=${s.userId}`)} style={{ alignItems: "center", width: 68 }}>
              <View style={{ borderWidth: 3, borderColor: s.seenByMe ? theme.border : theme.secondary, borderRadius: 40, padding: 2 }}>
                <Avatar name={s.userName} url={s.avatarUrl} size={54} />
              </View>
              <ThemedText type="small" numberOfLines={1}>{s.userName}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {shabbat ? (
        <Card style={{ borderColor: theme.secondary }}>
          <Row style={{ justifyContent: "space-between" }}>
            <Muted>📍 {shabbat.cityHe}</Muted>
            <Muted>{token ? "לשינוי עיר - בפרופיל" : "להתאמת עיר - הרשמה"}</Muted>
          </Row>
          <H2>שבת שלום{shabbat.parashaHe ? ` - פרשת ${shabbat.parashaHe}` : ""}</H2>
          <Row style={{ gap: Spacing.three }}>
            <View style={{ flex: 1, backgroundColor: "rgba(31,111,92,0.14)", borderRadius: 14, padding: Spacing.three }}>
              <Muted>הדלקת נרות</Muted>
              <ThemedText style={{ fontSize: 24, fontWeight: "700", textAlign: "right" }}>{shabbat.candleLighting || "—"}</ThemedText>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(201,123,60,0.18)", borderRadius: 14, padding: Spacing.three }}>
              <Muted>צאת השבת</Muted>
              <ThemedText style={{ fontSize: 24, fontWeight: "700", textAlign: "right" }}>{shabbat.havdalah || "—"}</ThemedText>
            </View>
          </Row>
          {shabbat.upcoming && shabbat.upcoming.length ? <Muted>בקרוב: {shabbat.upcoming.join(" · ")}</Muted> : null}
        </Card>
      ) : null}

      <Card onPress={() => Linking.openURL(INSPIRATION_VIDEO)}>
        <H2>רגע של השראה</H2>
        <Muted>▶ לצפייה בסרטון ההשראה של חברותא</Muted>
      </Card>

      {error ? <Banner kind="error" text={error} /> : null}
      <H2>כל האזורים</H2>
      <Grid>
        {quick.map((s) => (
          <Card key={s.route} onPress={() => go(`/${s.route}`)} style={{ minHeight: 96 }}>
            <ThemedText style={{ fontSize: 28, lineHeight: 36, textAlign: "right" }}>{s.emoji}</ThemedText>
            <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>{s.title}</ThemedText>
            <Muted>{s.description}</Muted>
          </Card>
        ))}
      </Grid>
    </Screen>
  );
}
