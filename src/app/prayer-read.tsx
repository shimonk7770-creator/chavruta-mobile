// src/app/prayer-read.tsx - קריאת התפילה: גודל גופן, הצגה/הסתרה של ניקוד, תוכן עניינים, והסבר AI לכל קטע (כמו prayers.js באתר).
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";

import { useAi, AiAnswerBox } from "@/components/ai-box";
import { Banner, Btn, Card, Chips, ErrorView, Loading, Muted, Row } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { WEB_PREFIX } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";

type Section = { title: string; heTitle: string; lines: string[] };
type PrayerResponse = { prayer?: { title: string; sections: Section[] }; unavailable?: boolean; reason?: string };

const NIKUD_RE = /[֑-ׇ]/g; // ניקוד וטעמי מקרא (בלי אותיות)

export default function PrayerReadScreen() {
  const { nusach, prayer } = useLocalSearchParams<{ nusach: string; prayer: string }>();
  const { web, token } = useAuth();
  const theme = useTheme();
  const { contentMaxWidth } = useResponsive();
  const [result, setResult] = useState<PrayerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nikud, setNikud] = useState(true);
  const [font, setFont] = useState(22);
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;
    // הטעינה הראשונה שולפת עשרות קטעים מ-Sefaria ויכולה לקחת עד שתי דקות
    (async () => {
      try {
        const res = (await web.get(`/prayers/data/${nusach}/${prayer}`)) as unknown as PrayerResponse;
        if (!cancelled) setResult(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "אירעה שגיאה בטעינת הנוסח");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [web, nusach, prayer]);

  if (error) return <ErrorView message={error} />;
  if (!result) return <Loading text="טוענים את הנוסח מ-Sefaria... (בפעם הראשונה זה יכול לקחת כדקה)" />;
  if (result.unavailable) return <ErrorView message={result.reason || "הנוסח הזה לא זמין כרגע"} />;

  const sections = result.prayer?.sections ?? [];
  const clean = (t: string) => (nikud ? t : t.replace(NIKUD_RE, ""));

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen options={{ title: result.prayer?.title ?? "נוסח תפילה" }} />
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", paddingBottom: 80 }}>
        <Card>
          <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <Row>
              <Btn title="א+" small variant="outline" onPress={() => setFont((f) => Math.min(40, f + 3))} />
              <Btn title="א-" small variant="outline" onPress={() => setFont((f) => Math.max(15, f - 3))} />
            </Row>
            <Chips options={[{ value: "yes", label: "עם ניקוד" }, { value: "no", label: "בלי ניקוד" }]} value={nikud ? "yes" : "no"} onChange={(v) => setNikud(v === "yes")} />
          </Row>
          {sections.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row-reverse", gap: Spacing.two }}>
              {sections.map((s, i) => (
                <Btn key={i} title={s.heTitle} small variant="ghost" onPress={() => scrollRef.current?.scrollTo({ y: offsets.current[i] ?? 0, animated: true })} />
              ))}
            </ScrollView>
          ) : null}
        </Card>
        {sections.map((s, i) => (
          <View key={i} onLayout={(e) => (offsets.current[i] = e.nativeEvent.layout.y)} style={{ gap: Spacing.two }}>
            <ThemedText style={{ fontSize: 20, fontWeight: "700", color: theme.secondary, textAlign: "right" }}>{s.heTitle}</ThemedText>
            {token ? <ExplainButton section={s} /> : null}
            {s.lines.map((line, j) => (
              <ThemedText key={j} style={{ fontSize: font, lineHeight: font * 1.7, textAlign: "right", writingDirection: "rtl" }}>
                {clean(line)}
              </ThemedText>
            ))}
          </View>
        ))}
        {!token ? <Banner kind="info" text="להסבר בינה מלאכותית על קטעי התפילה - יש להתחבר." /> : null}
        <Muted>מקור: Sefaria</Muted>
      </ScrollView>
    </View>
  );
}

// "💡 הסבר לי" - AI מסביר קטע מהתפילה (POST /api/ai/prayers/explain, בלי ניקוד כדי לחסוך טוקנים - כמו באתר)
function ExplainButton({ section }: { section: Section }) {
  const { state, run, isLoading } = useAi();
  return (
    <View style={{ gap: Spacing.two, alignItems: "flex-end" }}>
      <Btn
        title="💡 הסבר לי"
        small
        variant="outline"
        loading={isLoading}
        onPress={() => run(`${WEB_PREFIX}/api/ai/prayers/explain`, { title: section.heTitle, text: section.lines.join("\n").replace(NIKUD_RE, "") })}
      />
      <View style={{ alignSelf: "stretch" }}>
        <AiAnswerBox state={state} />
      </View>
    </View>
  );
}
