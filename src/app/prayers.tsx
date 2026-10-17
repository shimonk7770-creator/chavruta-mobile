// src/app/prayers.tsx - בחירת נוסח ותפילה (שחרית / מנחה / ערבית), מקביל ל-/prayers באתר. הטקסט עצמו נפתח ב-prayer-read.tsx.
import { useRouter } from "expo-router";
import { useState } from "react";

import { Card, Chips, ErrorView, Grid, Hero, Loading, Muted, Screen } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";

type PrayersData = {
  nusachim: Record<string, { label: string }>;
  prayers: Record<string, { label: string; icon: string }>;
  selectedNusach: string;
};

export default function PrayersScreen() {
  const router = useRouter();
  const { web } = useAuth();
  const [nusach, setNusach] = useState("");
  const { data, error, loading, reload } = useLoad(async () => (await web.get<PrayersData>(`/prayers${nusach ? `?nusach=${nusach}` : ""}`)).data, [nusach]);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  const current = nusach || data.selectedNusach;
  return (
    <Screen>
      <Hero title="נוסח תפילה" subtitle="הנוסח המלא מספריית Sefaria, בכל אחד מהנוסחים" />
      <Chips options={Object.entries(data.nusachim).map(([value, n]) => ({ value, label: n.label }))} value={current} onChange={setNusach} />
      <Grid>
        {Object.entries(data.prayers).map(([key, p]) => (
          <Card key={key} onPress={() => router.push(`/prayer-read?nusach=${current}&prayer=${key}` as never)} style={{ alignItems: "center", minHeight: 110, justifyContent: "center" }}>
            <ThemedText style={{ fontSize: 34, lineHeight: 44 }}>{p.icon}</ThemedText>
            <ThemedText style={{ fontWeight: "700", fontSize: 18 }}>{p.label}</ThemedText>
            <Muted>נוסח {data.nusachim[current]?.label}</Muted>
          </Card>
        ))}
      </Grid>
    </Screen>
  );
}
