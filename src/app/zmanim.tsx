// src/app/zmanim.tsx - זמני היום (עלות השחר, הנץ, חצות, שקיעה ועוד) לפי עיר ותאריך, ומניינים של היום. מקביל ל-/zmanim באתר.
import { useState } from "react";

import { Btn, Card, Empty, ErrorView, H2, Loading, Muted, Row, Screen, Select } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";
import { useTheme } from "@/hooks/use-theme";

type ZmanRow = { key: string; label: string; note?: string; time: string; ts: number };
type ZmanimData = {
  zmanim: {
    cityKey: string;
    cityLabel: string;
    weekdayHe: string;
    hebrewDate: string;
    gregorianDateHe: string;
    dateISO: string;
    isToday: boolean;
    rows: ZmanRow[];
    shabbat?: { fridayISO: string; candleTime: string; candleNote?: string; havdalahTime: string; havdalahNote?: string };
  };
  todaysMinyanim: { minyan: { time: string; prayer: string; synagogueName: string }; countdownText?: string }[];
  prayerLabels: Record<string, string>;
  cities: { key: string; label: string }[];
  prevDate: string;
  nextDate: string;
};

export default function ZmanimScreen() {
  const { web } = useAuth();
  const theme = useTheme();
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const { data, error, loading, refresh, refreshing, reload } = useLoad(async () => {
    const qs = [city && `city=${city}`, date && `date=${date}`].filter(Boolean).join("&");
    return (await web.get<ZmanimData>(`/zmanim${qs ? `?${qs}` : ""}`)).data;
  }, [city, date]);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  const z = data.zmanim;
  // הזמן הבא להיום מודגש - הראשון שעדיין לא עבר
  const nowSec = Date.now();
  const nextKey = z.isToday ? z.rows.find((r) => (r.ts > 1e12 ? r.ts : r.ts * 1000) > nowSec)?.key : undefined;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Card style={{ backgroundColor: theme.secondary, borderColor: theme.secondary }}>
        <ThemedText style={{ color: "#fff", textAlign: "right" }}>📍 {z.cityLabel}</ThemedText>
        <ThemedText style={{ color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "right" }}>
          {z.weekdayHe}, {z.hebrewDate}
        </ThemedText>
        <ThemedText style={{ color: "#fff", opacity: 0.9, textAlign: "right" }}>{z.gregorianDateHe}</ThemedText>
      </Card>

      <Select label="עיר" options={data.cities.map((c) => ({ value: c.key, label: c.label }))} value={z.cityKey} onChange={setCity} />
      <Row style={{ justifyContent: "space-between" }}>
        <Btn title="יום הבא ›" variant="outline" small onPress={() => setDate(data.nextDate)} />
        {!z.isToday ? <Btn title="↺ היום" variant="ghost" small onPress={() => setDate("")} /> : null}
        <Btn title="‹ יום קודם" variant="outline" small onPress={() => setDate(data.prevDate)} />
      </Row>

      <Card>
        {z.rows.map((r) => (
          <Row
            key={r.key}
            style={{
              justifyContent: "space-between",
              paddingVertical: 8,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.border,
              backgroundColor: r.key === nextKey ? "rgba(201,123,60,0.14)" : "transparent",
              paddingHorizontal: 6,
              borderRadius: 8,
            }}>
            <Row style={{ flexDirection: "column", alignItems: "flex-end", gap: 0, flex: 1 }}>
              <ThemedText style={{ textAlign: "right", fontWeight: r.key === nextKey ? "700" : "500" }}>{r.label}</ThemedText>
              {r.note ? <Muted>{r.note}</Muted> : null}
            </Row>
            <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>{r.time}</ThemedText>
          </Row>
        ))}
      </Card>

      {z.isToday ? (
        <>
          <H2>🕍 מניינים היום ב{z.cityLabel}</H2>
          {data.todaysMinyanim.length ? (
            data.todaysMinyanim.map((item, i) => (
              <Card key={i}>
                <Row style={{ justifyContent: "space-between" }}>
                  <ThemedText style={{ fontWeight: "700" }}>{item.minyan.time}</ThemedText>
                  <ThemedText style={{ flex: 1, textAlign: "right" }}>
                    {data.prayerLabels[item.minyan.prayer]} ב{item.minyan.synagogueName}
                  </ThemedText>
                </Row>
                {item.countdownText ? <Muted>{item.countdownText}</Muted> : null}
              </Card>
            ))
          ) : (
            <Empty text="אין מניינים רשומים להיום בעיר הזו." />
          )}
        </>
      ) : null}

      {z.shabbat ? (
        <Card>
          <H2>שבת הקרובה</H2>
          <Muted>ערב שבת: {z.shabbat.fridayISO.split("-").reverse().join("/")}</Muted>
          <Row style={{ justifyContent: "space-between" }}>
            <ThemedText>הדלקת נרות</ThemedText>
            <ThemedText style={{ fontWeight: "700", fontSize: 18 }}>{z.shabbat.candleTime}</ThemedText>
          </Row>
          {z.shabbat.candleNote ? <Muted>{z.shabbat.candleNote}</Muted> : null}
          <Row style={{ justifyContent: "space-between" }}>
            <ThemedText>צאת השבת</ThemedText>
            <ThemedText style={{ fontWeight: "700", fontSize: 18 }}>{z.shabbat.havdalahTime}</ThemedText>
          </Row>
          {z.shabbat.havdalahNote ? <Muted>{z.shabbat.havdalahNote}</Muted> : null}
        </Card>
      ) : null}
    </Screen>
  );
}
