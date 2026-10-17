// src/app/minyan-new.tsx - הוספת מניין (נבדק בשרת: minyanimLogic.validateMinyanInput), עם אפשרות למלא מיקום מהמכשיר.
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";

import { Banner, Btn, Card, Chips, ErrorView, Field, H1, Loading, Screen, Select, TimeField } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";

type NewData = {
  cities: { key: string; label: string }[];
  prayerLabels: Record<string, string>;
  nusachLabels: Record<string, string>;
  dayPresets: Record<string, { label: string }>;
  form: { city: string; prayer: string; daysPreset: string; nusach: string };
};

export default function MinyanNewScreen() {
  return (
    <RequireLogin>
      <Form />
    </RequireLogin>
  );
}

function Form() {
  const router = useRouter();
  const { web } = useAuth();
  const { data, error, loading, reload } = useLoad(async () => (await web.get<NewData>("/minyanim/new")).data, []);
  const [f, setF] = useState<Record<string, string>>({});
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  const val = (k: keyof NewData["form"] | string, fallback = "") => f[k] ?? (data.form as Record<string, string>)[k] ?? fallback;
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function useMyLocation() {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error("לא אושרה גישה למיקום");
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "לא הצלחנו לאתר את המיקום");
    }
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      await web.post("/minyanim", {
        synagogueName: val("synagogueName"),
        prayer: val("prayer"),
        time: val("time"),
        daysPreset: val("daysPreset"),
        nusach: val("nusach"),
        city: val("city"),
        address: val("address"),
        notes: val("notes"),
        lat: coords ? String(coords.lat) : "",
        lng: coords ? String(coords.lng) : "",
      });
      router.replace("/minyanim" as never);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "שגיאה בהוספת המניין");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>הוספת מניין</H1>
      <Card>
        <Field label="שם בית הכנסת" value={val("synagogueName")} onChangeText={set("synagogueName")} />
        <Chips options={Object.entries(data.prayerLabels).map(([value, label]) => ({ value, label }))} value={val("prayer")} onChange={set("prayer")} />
        <TimeField label="שעה" value={val("time")} onChange={set("time")} />
        <Select label="ימים" options={Object.entries(data.dayPresets).map(([value, p]) => ({ value, label: p.label }))} value={val("daysPreset")} onChange={set("daysPreset")} />
        <Select label="נוסח" options={Object.entries(data.nusachLabels).map(([value, label]) => ({ value, label }))} value={val("nusach")} onChange={set("nusach")} />
        <Select label="עיר" options={data.cities.map((c) => ({ value: c.key, label: c.label }))} value={val("city")} onChange={set("city")} />
        <Field label="כתובת (רשות)" value={val("address")} onChangeText={set("address")} maxLength={120} />
        <Field label="הערות (רשות)" value={val("notes")} onChangeText={set("notes")} maxLength={200} multiline />
        <Btn title={coords ? "✔ המיקום שלי נשמר" : "📍 השתמש במיקום שלי"} variant="outline" onPress={useMyLocation} />
        <Banner kind="error" text={msg} />
        <Btn title="הוספה" loading={busy} onPress={submit} />
      </Card>
    </Screen>
  );
}
