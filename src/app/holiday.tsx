// src/app/holiday.tsx - מאמר חג בודד: מה עושים, מה מתפללים, מנהגים, קבוצה קהילתית מקושרת, ושאלה ל-AI. מנהל מערכת: עריכה / מחיקה.
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "react-native";

import { AiAnswerBox, AiAskRow, useAi } from "@/components/ai-box";
import { Btn, Card, ErrorView, H1, H2, Loading, Muted, Row, Screen, confirmAction } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { WEB_PREFIX, resolveUrl } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";

type Holiday = { id: string; holidayName: string; dateHint?: string; whatWeDo?: string; whatWePray?: string; customs?: string; imageUrl?: string };
type HolidayData = { holiday: Holiday; linkedGroup: { id: string; name: string } | null };

export default function HolidayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { web, token, isAdmin } = useAuth();
  const { data, error, loading, reload } = useLoad(async () => (await web.get<HolidayData>(`/holidays/${id}`)).data, [id]);
  const explain = useAi();
  const askPath = `${WEB_PREFIX}/api/ai/holidays/${id}/ask`;

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;
  const h = data.holiday;

  async function remove() {
    if (!(await confirmAction("למחוק את המאמר?"))) return;
    await web.post(`/holidays/${id}/delete`);
    router.replace("/holidays" as never);
  }

  return (
    <Screen>
      {h.imageUrl ? <Image source={{ uri: resolveUrl(h.imageUrl) }} style={{ height: 200, borderRadius: 16 }} resizeMode="cover" /> : null}
      <H1>{h.holidayName}</H1>
      {h.dateHint ? <Muted>{h.dateHint}</Muted> : null}
      {h.whatWeDo ? (
        <Card>
          <H2>מה עושים</H2>
          <ThemedText style={{ textAlign: "right" }}>{h.whatWeDo}</ThemedText>
        </Card>
      ) : null}
      {h.whatWePray ? (
        <Card>
          <H2>מה מתפללים</H2>
          <ThemedText style={{ textAlign: "right" }}>{h.whatWePray}</ThemedText>
        </Card>
      ) : null}
      {h.customs ? (
        <Card>
          <H2>מנהגים</H2>
          <ThemedText style={{ textAlign: "right" }}>{h.customs}</ThemedText>
        </Card>
      ) : null}
      {token ? (
        <Card>
          <H2>💡 שאלו את ה-AI על החג</H2>
          <Row style={{ flexWrap: "wrap" }}>
            <Btn small variant="outline" title="הסבר קצר על החג" loading={explain.isLoading} onPress={() => explain.run(askPath, { mode: "explain" })} />
            <Btn small variant="outline" title="הסבר לילדים" loading={explain.isLoading} onPress={() => explain.run(askPath, { mode: "kids" })} />
          </Row>
          <AiAnswerBox state={explain.state} />
          <AiAskRow askPath={askPath} extraBody={{ mode: "question" }} placeholder="למשל: למה אוכלים סופגניות?" />
        </Card>
      ) : null}
      {data.linkedGroup ? <Btn title={`לקבוצת ה"${data.linkedGroup.name}" הקהילתית ←`} variant="secondary" onPress={() => router.push(`/group/${data.linkedGroup!.id}` as never)} /> : null}
      {isAdmin ? (
        <Row>
          <Btn title="עריכה" variant="outline" onPress={() => router.push(`/holiday-edit?id=${h.id}` as never)} />
          <Btn title="מחיקה" variant="danger" onPress={remove} />
        </Row>
      ) : null}
    </Screen>
  );
}
