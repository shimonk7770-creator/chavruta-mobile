// src/app/study-room.tsx - "בית המדרש האישי": מפת חום של הלימוד (חצי שנה), גרפים קהילתיים, וספריית וידאו מהפוסטים. מקביל ל-/study-room.
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Btn, Card, Empty, ErrorView, H1, H2, Loading, Muted, Row, Screen } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { ThemedText } from "@/components/themed-text";
import { resolveUrl } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";
import { useTheme } from "@/hooks/use-theme";

const COLORS = ["#efe7da", "#e3c9a3", "#c97b3c", "#a85f27", "#7a4419"]; // אותה פלטה כמו studyRoom.js באתר
const WEEKS = 26;

type Video = { id: string; title: string; videoUrl: string; groupName: string; authorName: string };
type RoomData = {
  counts: Record<string, number>;
  videos: Video[];
  postsPerGroup: { groupName: string; count: number }[];
  trend: { date: string; count: number }[];
};

export default function StudyRoomScreen() {
  return (
    <RequireLogin>
      <Room />
    </RequireLogin>
  );
}

function Room() {
  const { web } = useAuth();
  const theme = useTheme();
  const { data, error, loading, refresh, refreshing, reload } = useLoad<RoomData>(async () => {
    const [heat, videos, ppg, trend] = await Promise.all([
      web.get("/api/learning/heatmap") as unknown as Promise<{ counts: Record<string, number> }>,
      web.get("/api/videos/library") as unknown as Promise<{ videos: Video[] }>,
      web.get("/api/stats/posts-per-group") as unknown as Promise<{ data: RoomData["postsPerGroup"] }>,
      web.get("/api/stats/learning-trend") as unknown as Promise<{ data: RoomData["trend"] }>,
    ]);
    return { counts: heat.counts, videos: videos.videos, postsPerGroup: ppg.data, trend: trend.data };
  }, []);
  const [selected, setSelected] = useState(0);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  // מפת חום: עמודה לכל שבוע (מימין לשמאל = מהישן לחדש), שורה לכל יום (א'-ש')
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - WEEKS * 7);
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);
  const weeks: { key: string; count: number; future: boolean }[][] = [];
  for (let w = 0; w <= WEEKS; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start);
      cell.setDate(cell.getDate() + w * 7 + d);
      const key = cell.toISOString().slice(0, 10);
      col.push({ key, count: data.counts[key] || 0, future: cell > today });
    }
    weeks.push(col);
  }
  const maxPosts = Math.max(1, ...data.postsPerGroup.map((r) => r.count));
  const maxTrend = Math.max(1, ...data.trend.map((r) => r.count));
  const video = data.videos[selected];

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <H1>🎓 בית המדרש האישי</H1>
      <Muted>כל משבצת מייצגת יום, וככל שלמדת יותר באותו יום כך היא כהה יותר.</Muted>
      <Card>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row-reverse", gap: 3 }}>
            {weeks.map((col, wi) => (
              <View key={wi} style={{ gap: 3 }}>
                {col.map((c) => (
                  <View key={c.key} style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: c.future ? "transparent" : COLORS[Math.min(c.count, COLORS.length - 1)] }} />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        <Muted>סך הכל למדת ב-{Object.keys(data.counts).length} ימים שונים בחצי השנה האחרונה.</Muted>
        <Row style={{ gap: 4 }}>
          <Muted>פחות</Muted>
          {COLORS.map((c) => <View key={c} style={{ width: 12, height: 12, backgroundColor: c, borderRadius: 2 }} />)}
          <Muted>יותר</Muted>
        </Row>
      </Card>

      <H2>הספרייה שלי - וידאו מהפוסטים באתר</H2>
      {data.videos.length === 0 ? <Empty text="עדיין לא פורסמו סרטוני וידאו בפוסטים." /> : (
        <Card>
          {video ? <VideoBox key={video.id} url={resolveUrl(video.videoUrl)} /> : null}
          {video ? <Muted>{video.title} · {video.groupName} · {video.authorName}</Muted> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row>
              {data.videos.map((v, i) => (
                <Btn key={v.id} small variant={i === selected ? "primary" : "outline"} title={v.title.slice(0, 18)} onPress={() => setSelected(i)} />
              ))}
            </Row>
          </ScrollView>
        </Card>
      )}

      <H2>נתונים קהילתיים</H2>
      <Card>
        <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>פוסטים לפי קבוצה</ThemedText>
        {data.postsPerGroup.length === 0 ? <Muted>עדיין אין מספיק פוסטים בקבוצות כדי להציג גרף פעילות.</Muted> : null}
        {data.postsPerGroup.map((r) => (
          <View key={r.groupName} style={{ gap: 2 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <ThemedText type="small">{r.count}</ThemedText>
              <ThemedText type="small" style={{ flex: 1, textAlign: "right" }} numberOfLines={1}>{r.groupName}</ThemedText>
            </Row>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.border, flexDirection: "row-reverse" }}>
              <View style={{ width: `${(r.count / maxPosts) * 100}%`, backgroundColor: theme.primary, borderRadius: 5 }} />
            </View>
          </View>
        ))}
      </Card>
      <Card>
        <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>מגמת לימוד ב-30 הימים האחרונים</ThemedText>
        {data.trend.length === 0 ? <Muted>אין עדיין נתוני לימוד.</Muted> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row-reverse", alignItems: "flex-end", gap: 4, height: 130 }}>
              {data.trend.map((r) => (
                <Pressable key={r.date} style={{ alignItems: "center", width: 18 }}>
                  <ThemedText style={{ fontSize: 10 }}>{r.count}</ThemedText>
                  <View style={{ width: 14, height: Math.max(4, (r.count / maxTrend) * 90), backgroundColor: theme.secondary, borderRadius: 3 }} />
                  <ThemedText style={{ fontSize: 9 }}>{r.date.slice(8)}</ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </Card>
    </Screen>
  );
}

// נגן וידאו (expo-video) עם בקרים מובנים - עובד בטלפון ובדפדפן
function VideoBox({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return <VideoView player={player} style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: "#000" }} nativeControls />;
}
