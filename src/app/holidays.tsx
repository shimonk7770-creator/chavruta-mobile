// src/app/holidays.tsx - "מעגל השנה": לוח שנה חודשי עם חגים, "המועד הקרוב" ומאגר מאמרים. מנהל מערכת יכול להוסיף מאמר. מקביל ל-/holidays.
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";

import { Btn, Card, Empty, ErrorView, Grid, H2, Loading, Muted, Row, Screen } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { resolveUrl } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";
import { useTheme } from "@/hooks/use-theme";

type Holiday = { id: string; holidayName: string; dateHint?: string; whatWeDo?: string; imageUrl?: string };
type Cell = { day: number; isToday: boolean; holidays: { id: string; holidayName: string }[] } | null;
type HolidaysData = {
  featured: Holiday | null;
  archive: Holiday[];
  calendarMonth: { monthName: string; year: number; weeks: Cell[][] };
  prev: { year: number; month: number };
  next: { year: number; month: number };
  isCurrentMonth: boolean;
  todayYear: number;
  todayMonth1based: number;
};

export default function HolidaysScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { web, isAdmin } = useAuth();
  const [ym, setYm] = useState<{ year: number; month: number } | null>(null);
  const { data, error, loading, refresh, refreshing, reload } = useLoad(
    async () => (await web.get<HolidaysData>(`/holidays${ym ? `?year=${ym.year}&month=${ym.month}` : ""}`)).data,
    [ym?.year, ym?.month]
  );

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  const open = (id: string) => router.push(`/holiday?id=${id}` as never);
  const cal = data.calendarMonth;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Row style={{ justifyContent: "space-between" }}>
        <H2>🕎 מעגל השנה</H2>
        {isAdmin ? <Btn small title="+ מאמר חדש" onPress={() => router.push("/holiday-edit" as never)} /> : null}
      </Row>

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Btn small variant="outline" title="חודש הבא ›" onPress={() => setYm(data.next)} />
          <ThemedText style={{ fontWeight: "700", fontSize: 18 }}>{cal.monthName} {cal.year}</ThemedText>
          <Btn small variant="outline" title="‹ חודש קודם" onPress={() => setYm(data.prev)} />
        </Row>
        {!data.isCurrentMonth ? <Btn small variant="ghost" title="↺ חזרה לחודש הנוכחי" onPress={() => setYm({ year: data.todayYear, month: data.todayMonth1based })} /> : null}
        <Row style={{ gap: 0 }}>
          {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((l) => (
            <View key={l} style={{ flex: 1, alignItems: "center" }}>
              <Muted>{l}</Muted>
            </View>
          ))}
        </Row>
        {cal.weeks.map((week, wi) => (
          <Row key={wi} style={{ gap: 2 }}>
            {week.map((cell, ci) => (
              <Pressable
                key={ci}
                disabled={!cell || !cell.holidays.length}
                onPress={() => cell && open(cell.holidays[0].id)}
                style={{
                  flex: 1,
                  minHeight: 54,
                  borderRadius: 8,
                  padding: 3,
                  alignItems: "center",
                  backgroundColor: cell?.holidays.length ? "rgba(201,123,60,0.2)" : cell?.isToday ? theme.backgroundSelected : "transparent",
                  borderWidth: cell?.isToday ? 2 : 0,
                  borderColor: theme.secondary,
                }}>
                {cell ? (
                  <>
                    <ThemedText type="smallBold">{cell.day}</ThemedText>
                    {cell.holidays.length ? <ThemedText style={{ fontSize: 9, lineHeight: 11, textAlign: "center" }} numberOfLines={2}>{cell.holidays[0].holidayName}</ThemedText> : null}
                  </>
                ) : null}
              </Pressable>
            ))}
          </Row>
        ))}
      </Card>

      {data.featured ? (
        <Card onPress={() => open(data.featured!.id)} style={{ borderColor: theme.primary }}>
          <Muted>המועד הקרוב</Muted>
          {data.featured.imageUrl ? <Image source={{ uri: resolveUrl(data.featured.imageUrl) }} style={{ height: 160, borderRadius: 12 }} resizeMode="cover" /> : null}
          <H2>{data.featured.holidayName}</H2>
          {data.featured.dateHint ? <Muted>{data.featured.dateHint}</Muted> : null}
          {data.featured.whatWeDo ? <ThemedText style={{ textAlign: "right" }} numberOfLines={4}>{data.featured.whatWeDo}</ThemedText> : null}
          <ThemedText style={{ color: theme.primary, textAlign: "right", fontWeight: "700" }}>רוצים ללמוד עוד על החג? לחצו כאן ←</ThemedText>
        </Card>
      ) : null}

      <H2>כל המאמרים</H2>
      {data.archive.length === 0 ? <Empty text="אין עדיין מאמרים נוספים" /> : null}
      <Grid>
        {data.archive.map((h) => (
          <Card key={h.id} onPress={() => open(h.id)}>
            {h.imageUrl ? <Image source={{ uri: resolveUrl(h.imageUrl) }} style={{ height: 110, borderRadius: 10 }} resizeMode="cover" /> : null}
            <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>{h.holidayName}</ThemedText>
            {h.dateHint ? <Muted>{h.dateHint}</Muted> : null}
          </Card>
        ))}
      </Grid>
    </Screen>
  );
}
