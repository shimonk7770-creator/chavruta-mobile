// src/app/compass.tsx - מצפן לכיוון התפילה (ירושלים / הר הבית): כיוון לפי עיר או לפי מיקום המכשיר, ומחוג חי לפי חיישן הכיוון.
// בטלפון - Location.watchHeadingAsync (חיישן מצפן); בדפדפן - DeviceOrientationEvent (דורש HTTPS), בדיוק כמו compass.js באתר.
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";

import { Banner, Btn, Card, ErrorView, H2, Loading, Muted, Screen, Select } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";
import { useTheme } from "@/hooks/use-theme";

type Direction = { bearing: number; bearingRounded: number; pointHe: string; distanceKm: number; isAtTarget: boolean };
type CompassData = { city: { key: string; label: string }; cities: { key: string; label: string }[]; direction: Direction };

const normalize = (d: number) => ((d % 360) + 360) % 360;
const shortest = (from: number, to: number) => ((to - from + 540) % 360) - 180;

export default function CompassScreen() {
  const { web } = useAuth();
  const theme = useTheme();
  const [city, setCity] = useState("");
  const [device, setDevice] = useState<Direction | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const shown = useRef(0);
  const [display, setDisplay] = useState(0);
  const { data, error, loading, reload } = useLoad(async () => (await web.get<CompassData>(`/compass${city ? `?city=${city}` : ""}`)).data, [city]);

  // החלקה של הכיוון (מונעת רעידות), כמו ה-lerp באתר
  useEffect(() => {
    if (heading === null) return;
    const id = setInterval(() => {
      shown.current = normalize(shown.current + shortest(shown.current, heading) * 0.25);
      setDisplay(shown.current);
    }, 50);
    return () => clearInterval(id);
  }, [heading]);

  async function useDeviceLocation() {
    setStatus(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error("לא אושרה גישה למיקום");
      const pos = await Location.getCurrentPositionAsync({});
      const res = (await web.get(`/compass/bearing?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)) as unknown as Direction & { success: boolean };
      setDevice(res);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "לא הצלחנו לאתר את המיקום");
    }
  }

  async function startSensor() {
    setStatus(null);
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") {
        setStatus("הדפדפן/המכשיר לא תומך בחיישן כיוון - מוצג כיוון סטטי (צפון למעלה).");
        return;
      }
      if (window.isSecureContext === false) {
        setStatus("הדפדפן חוסם את חיישן המצפן בחיבור לא מאובטח (HTTP). נדרש HTTPS.");
        return;
      }
      const anyDO = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof anyDO.requestPermission === "function") {
        const answer = await anyDO.requestPermission();
        if (answer !== "granted") {
          setStatus("לא אושרה גישה לחיישן הכיוון.");
          return;
        }
      }
      const onOrient = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
        if (typeof e.webkitCompassHeading === "number") setHeading(normalize(e.webkitCompassHeading));
        else if (e.absolute === true && typeof e.alpha === "number") setHeading(normalize(360 - e.alpha));
      };
      window.addEventListener("deviceorientationabsolute", onOrient as EventListener, true);
      window.addEventListener("deviceorientation", onOrient as EventListener, true);
      setTimeout(() => setStatus((s) => s ?? "אם המחוג לא זז - ייתכן שאין חיישן במכשיר הזה (במחשב שולחני אין)."), 3000);
      return;
    }
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error("נדרשת הרשאת מיקום כדי להפעיל את המצפן");
      await Location.watchHeadingAsync((h) => setHeading(normalize(h.trueHeading >= 0 ? h.trueHeading : h.magHeading)));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "החיישן לא זמין");
    }
  }

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  const dir = device ?? data.direction;
  const needle = normalize(dir.bearing - (heading === null ? 0 : display));
  const ring = heading === null ? 0 : -display;
  const aligned = heading !== null && !dir.isAtTarget && Math.abs(shortest(0, needle)) <= 6;

  return (
    <Screen>
      <H2>🧭 מצפן - כיוון התפילה</H2>
      <Select label="עיר" options={data.cities.map((c) => ({ value: c.key, label: c.label }))} value={city || data.city.key} onChange={(v) => { setDevice(null); setCity(v); }} />
      <Card style={{ alignItems: "center" }}>
        <View style={{ width: 260, height: 260, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: 260, height: 260, borderRadius: 130, borderWidth: 4, borderColor: aligned ? theme.secondary : theme.border, transform: [{ rotate: `${ring}deg` }] }}>
            {[["צ", 0], ["מ", 90], ["ד", 180], ["מע", 270]].map(([l, deg]) => (
              <View key={String(l)} style={{ position: "absolute", width: 260, height: 260, alignItems: "center", transform: [{ rotate: `${deg}deg` }] }}>
                <ThemedText style={{ fontWeight: "700", marginTop: 6, color: l === "צ" ? "#c0392b" : theme.textSecondary }}>{l}</ThemedText>
              </View>
            ))}
          </View>
          <View style={{ position: "absolute", width: 12, height: 200, alignItems: "center", transform: [{ rotate: `${needle}deg` }] }}>
            <View style={{ width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 90, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: theme.primary }} />
            <View style={{ width: 4, height: 100, backgroundColor: theme.border }} />
          </View>
          <ThemedText style={{ fontSize: 30 }}>🕍</ThemedText>
        </View>
        <ThemedText style={{ fontSize: 20, fontWeight: "700" }}>{dir.isAtTarget ? "אתם בהר הבית 🙏" : `${dir.pointHe} (${dir.bearingRounded}°)`}</ThemedText>
        <Muted>{dir.isAtTarget ? "" : `מרחק לירושלים: ${dir.distanceKm} ק"מ`}</Muted>
        {heading !== null ? <Muted>{aligned ? "✓ אתם פונים לירושלים" : "סובבו את המכשיר עד שהמחוג יצביע ישר למעלה"}</Muted> : null}
      </Card>
      <Banner kind="info" text={status} />
      <Btn title="🧭 הפעלת חיישן כיוון" onPress={startSensor} />
      <Btn title="📍 לפי המיקום שלי" variant="outline" onPress={useDeviceLocation} />
      <Muted>הכיוון מחושב לפי העיר שנבחרה (או לפי מיקום המכשיר). בלי חיישן מוצג כיוון סטטי כשצפון למעלה.</Muted>
    </Screen>
  );
}
