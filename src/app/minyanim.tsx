// src/app/minyanim.tsx - חיפוש מניינים קרובים (לפי מיקום המכשיר / כתובת / עיר), סינון, מונה "אני מגיע" וניווט. מקביל ל-/minyanim.
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, View } from "react-native";

import { Badge, Banner, Btn, Card, Chips, Empty, ErrorView, Field, H2, Loading, Muted, Row, Screen, Select, confirmAction } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";
import { useTheme } from "@/hooks/use-theme";

type Attendance = { count: number; target: number; hasMinyan: boolean; missing: number; percent: number; canVote: boolean; going: boolean };
type Minyan = {
  id: string;
  synagogueName: string;
  prayer: string;
  time: string;
  nusach?: string;
  cityLabel: string;
  address?: string;
  notes?: string;
  lat: number;
  lng: number;
  isDemo?: boolean;
  locationPrecision?: string;
  createdBy?: string;
};
type Result = {
  minyan: Minyan;
  dayLabel: string;
  daysText?: string;
  distanceText: string;
  countdownText: string;
  canMakeItWalking: boolean;
  walkMinutes: number;
  attendance: Attendance;
};
type MinyanimData = {
  results: Result[];
  origin: { label: string; warning?: string; kind: string };
  filters: { prayer: string; sort: string; when: string; radius: number; q: string };
  cities: { key: string; label: string }[];
  selectedCity: string;
  prayerLabels: Record<string, string>;
  nusachLabels: Record<string, string>;
  totalCount: number;
  me?: { userId: string | null; userRole: string | null };
};

export default function MinyanimScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { web, token } = useAuth();
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [prayer, setPrayer] = useState("all");
  const [sort, setSort] = useState("distance");
  const [when, setWhen] = useState("24h");
  const [radius, setRadius] = useState("0");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Attendance>>({});

  const { data, error, loading, refresh, refreshing, reload } = useLoad(async () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    } else if (appliedQ) params.set("q", appliedQ);
    params.set("prayer", prayer);
    params.set("sort", sort);
    params.set("when", when);
    params.set("radius", radius);
    setOverrides({});
    const res = await web.get<MinyanimData>(`/minyanim?${params.toString()}`);
    return { ...res.data, me: res.me };
  }, [city, appliedQ, prayer, sort, when, radius, coords, token]);

  async function locate() {
    setLocating(true);
    setMessage(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error("לא אושרה גישה למיקום. אפשר לחפש לפי כתובת או עיר.");
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "לא הצלחנו לאתר את המיקום" });
    } finally {
      setLocating(false);
    }
  }

  async function attend(id: string) {
    try {
      const res = (await web.post(`/api/minyanim/${id}/attend`)) as unknown as { attendance: Attendance };
      setOverrides((o) => ({ ...o, [id]: res.attendance }));
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "שגיאה בסימון הגעה" });
    }
  }

  async function remove(id: string) {
    if (!(await confirmAction("למחוק את המניין?"))) return;
    try {
      await web.post(`/minyanim/${id}/delete`);
      reload();
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "שגיאה במחיקה" });
    }
  }

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <H2>🕍 מניינים</H2>
      <Card>
        <Btn title="📍 המיקום שלי" loading={locating} onPress={locate} />
        <Field label="או כתובת" value={q} onChangeText={setQ} placeholder="למשל: רחוב יפו, ירושלים" maxLength={100} onSubmitEditing={() => { setCoords(null); setAppliedQ(q.trim()); }} />
        <Select label="עיר" options={data.cities.map((c) => ({ value: c.key, label: c.label }))} value={city || data.selectedCity} onChange={(v) => { setCoords(null); setCity(v); }} />
        <Muted>תפילה</Muted>
        <Chips options={[{ value: "all", label: "הכל" }, ...Object.entries(data.prayerLabels).map(([value, label]) => ({ value, label }))]} value={prayer} onChange={setPrayer} />
        <Muted>מיון</Muted>
        <Chips options={[{ value: "distance", label: "הכי קרוב אליי" }, { value: "time", label: "הכי קרוב בזמן" }]} value={sort} onChange={setSort} />
        <Muted>מתי</Muted>
        <Chips options={[{ value: "24h", label: "ב-24 השעות הקרובות" }, { value: "all", label: "כל המניינים" }]} value={when} onChange={setWhen} />
        <Muted>טווח</Muted>
        <Chips options={[{ value: "0", label: "ללא הגבלה" }, ...[1, 3, 5, 10, 25].map((r) => ({ value: String(r), label: `עד ${r} ק"מ` }))]} value={radius} onChange={setRadius} />
        <Btn title="חיפוש" variant="secondary" onPress={() => { setCoords(null); setAppliedQ(q.trim()); }} />
      </Card>

      <Muted>
        מרחקים מחושבים מ: {data.origin.label} · נמצאו {data.results.length} מניינים (מתוך {data.totalCount} במערכת)
      </Muted>
      <Banner kind="info" text={data.origin.warning} />
      <Banner kind={message?.kind ?? "info"} text={message?.text} />
      {token ? <Btn title="+ הוספת מניין" variant="outline" onPress={() => router.push("/minyan-new" as never)} /> : <Banner kind="info" text="התחברו כדי להוסיף מניין ולסמן הגעה." />}

      {data.results.length === 0 ? <Empty text="לא נמצאו מניינים לפי הסינון. נסו להרחיב את הטווח או לבחור 'כל המניינים'." /> : null}
      {data.results.map((r) => {
        const m = r.minyan;
        const att = overrides[m.id] ?? r.attendance;
        const isMine = !!token && (data.me?.userRole === "admin" || (!!m.createdBy && m.createdBy === data.me?.userId));
        return (
          <Card key={m.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <ThemedText style={{ fontSize: 26, fontWeight: "700", color: theme.secondary }}>{m.time}</ThemedText>
              <Badge text={r.dayLabel} tone="orange" />
            </Row>
            <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>
              {data.prayerLabels[m.prayer]} ב{m.synagogueName}
            </ThemedText>
            <Muted>
              {m.address ? `${m.address}, ` : ""}
              {m.cityLabel}
              {m.locationPrecision === "city" ? " (מיקום בקירוב)" : ""}
            </Muted>
            <Row style={{ flexWrap: "wrap" }}>
              {m.isDemo ? <Badge text="דמו" tone="gray" /> : null}
              {r.daysText ? <Badge text={r.daysText} /> : null}
              {m.nusach && m.nusach !== "any" ? <Badge text={data.nusachLabels[m.nusach]} /> : null}
            </Row>
            {m.notes ? <Muted>{m.notes}</Muted> : null}

            <View style={{ backgroundColor: att.hasMinyan ? "rgba(31,111,92,0.12)" : "rgba(201,123,60,0.1)", borderRadius: 12, padding: 10, gap: 6 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <ThemedText style={{ fontWeight: "700" }}>{att.count}/{att.target} מגיעים</ThemedText>
                <ThemedText>{att.hasMinyan ? "✅ יש מניין!" : `חסרים ${att.missing}`}</ThemedText>
              </Row>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.border, overflow: "hidden", flexDirection: "row-reverse" }}>
                <View style={{ width: `${Math.min(100, att.percent)}%`, backgroundColor: theme.secondary }} />
              </View>
              {!token ? (
                <Muted>התחברו כדי לסמן שאתם מגיעים</Muted>
              ) : !att.canVote ? (
                <Muted>אפשר לסמן הגעה 24 שעות לפני התפילה</Muted>
              ) : (
                <Btn small variant={att.going ? "outline" : "primary"} title={att.going ? "✔ אני מגיע (ביטול)" : "🙋 אני מגיע"} onPress={() => attend(m.id)} />
              )}
            </View>

            <Row style={{ flexWrap: "wrap" }}>
              <Btn small variant="ghost" title="🧭 Google Maps" onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}&travelmode=walking`)} />
              <Btn small variant="ghost" title="Waze" onPress={() => Linking.openURL(`https://waze.com/ul?ll=${m.lat},${m.lng}&navigate=yes`)} />
              {isMine ? <Btn small variant="danger" title="מחיקה" onPress={() => remove(m.id)} /> : null}
            </Row>
            <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <Muted>{r.distanceText}</Muted>
              <Muted>{r.countdownText}</Muted>
              <Muted>{r.canMakeItWalking ? `✔ מספיקים ברגל (~${r.walkMinutes} דק')` : `הליכה ~${r.walkMinutes} דק'`}</Muted>
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
