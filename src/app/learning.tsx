// src/app/learning.tsx - מעקב לימוד אישי: יעדים עם התקדמות, רישום יחידת לימוד, עריכה / מחיקה / שיתוף לקבוצה, וסיכום AI. מקביל ל-/learning.
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AiAnswerBox, useAi } from "@/components/ai-box";
import { Banner, Btn, Card, Chips, DateField, Empty, ErrorView, Field, H2, Loading, Muted, Row, Screen, Select, confirmAction } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { ThemedText } from "@/components/themed-text";
import { WEB_PREFIX } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";
import { useTheme } from "@/hooks/use-theme";
import { formatDate, todayIso } from "@/lib/format";

type Log = { id: string; date: string; unit: string; groupId?: string | null; groupName?: string; notes?: string };
type Goal = { id: string; text: string; done: boolean };
type LearningData = {
  logs: Log[];
  myGroups: { id: string; name: string }[];
  goals: Goal[];
  goalProgress: { total: number; done: number; percent: number };
};

export default function LearningScreen() {
  return (
    <RequireLogin>
      <Learning />
    </RequireLogin>
  );
}

function Learning() {
  const router = useRouter();
  const theme = useTheme();
  const { web } = useAuth();
  const { data, error, loading, refresh, refreshing, reload } = useLoad(async () => (await web.get<LearningData>("/learning")).data, []);
  const ai = useAi();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [goalText, setGoalText] = useState("");
  const [date, setDate] = useState(todayIso());
  const [unit, setUnit] = useState("");
  const [groupId, setGroupId] = useState("");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ date: "", unit: "", notes: "" });
  const [shareTo, setShareTo] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // עטיפה לפעולה: מציגה שגיאה כבאנר ומרעננת את הנתונים בסיום
  async function act(fn: () => Promise<unknown>, success?: string) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (success) setMsg({ kind: "success", text: success });
      await reload();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "שגיאה" });
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Row style={{ justifyContent: "space-between" }}>
        <H2>📚 מעקב הלימוד שלי</H2>
        <Btn small variant="outline" title="🎓 חדר לימוד" onPress={() => router.push("/study-room" as never)} />
      </Row>
      <Banner kind={msg?.kind ?? "info"} text={msg?.text} />

      <Card>
        <H2>סיכום AI של ההתקדמות</H2>
        <Chips options={[{ value: "week", label: "השבוע האחרון" }, { value: "month", label: "החודש האחרון" }]} value={period} onChange={setPeriod} />
        <Btn title="✨ סכם לי את הלימוד" variant="secondary" loading={ai.isLoading} onPress={() => ai.run(`${WEB_PREFIX}/api/ai/learning/summary`, { period })} />
        <AiAnswerBox state={ai.state} />
      </Card>

      <Card>
        <H2>🎯 יעדי לימוד</H2>
        {data.goalProgress.total > 0 ? (
          <View style={{ gap: 4 }}>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.border, overflow: "hidden", flexDirection: "row-reverse" }}>
              <View style={{ width: `${data.goalProgress.percent}%`, backgroundColor: theme.secondary }} />
            </View>
            <Muted>{data.goalProgress.done} מתוך {data.goalProgress.total} יעדים הושלמו ({data.goalProgress.percent}%)</Muted>
          </View>
        ) : null}
        {data.goals.length === 0 ? <Muted>עדיין אין יעדים. הוסיפו את הראשון!</Muted> : null}
        {data.goals.map((g) => (
          <Row key={g.id} style={{ justifyContent: "space-between" }}>
            <Btn small variant={g.done ? "secondary" : "outline"} title={g.done ? "✔" : "○"} onPress={() => act(() => web.put(`/learning/goals/${g.id}`, { done: String(!g.done) }))} />
            <ThemedText style={{ flex: 1, textAlign: "right", textDecorationLine: g.done ? "line-through" : "none", opacity: g.done ? 0.6 : 1 }}>{g.text}</ThemedText>
            <Btn small variant="ghost" title="🗑" onPress={() => act(() => web.del(`/learning/goals/${g.id}`))} />
          </Row>
        ))}
        <Row>
          <Btn small title="הוסף" disabled={!goalText.trim() || busy} onPress={() => act(async () => { await web.post("/learning/goals", { text: goalText }); setGoalText(""); })} />
          <Field style={{ flex: 1 }} value={goalText} onChangeText={setGoalText} placeholder="הוסף יעד לימוד חדש..." maxLength={150} />
        </Row>
      </Card>

      <Card>
        <H2>➕ רישום יחידת לימוד</H2>
        <DateField label="תאריך" value={date} onChange={setDate} />
        <Field label="יחידת לימוד" value={unit} onChangeText={setUnit} placeholder="למשל: דף יומי / פרק בתניא" maxLength={150} />
        <Select label="קבוצה (רשות)" options={[{ value: "", label: "ללא קבוצה" }, ...data.myGroups.map((g) => ({ value: g.id, label: g.name }))]} value={groupId} onChange={setGroupId} />
        <Field label="הערות" value={notes} onChangeText={setNotes} multiline maxLength={500} placeholder="מה למדת? תובנות, קושיות, סיכום קצר..." />
        <Btn title="שמירה" loading={busy} disabled={!unit.trim() || !date} onPress={() => act(async () => { await web.post("/learning", { date, unit, groupId, notes }); setUnit(""); setNotes(""); }, "נרשם בהצלחה")} />
      </Card>

      <H2>הרישומים שלי</H2>
      {data.logs.length === 0 ? <Empty text="עדיין לא נרשמה יחידת לימוד." /> : null}
      {data.logs.map((log) =>
        editing === log.id ? (
          <Card key={log.id}>
            <DateField label="תאריך" value={editFields.date} onChange={(v) => setEditFields((p) => ({ ...p, date: v }))} />
            <Field label="יחידת לימוד" value={editFields.unit} onChangeText={(v) => setEditFields((p) => ({ ...p, unit: v }))} maxLength={150} />
            <Field label="הערות" value={editFields.notes} onChangeText={(v) => setEditFields((p) => ({ ...p, notes: v }))} multiline maxLength={500} />
            <Row>
              <Btn title="שמירה" onPress={() => act(async () => { await web.put(`/learning/${log.id}`, editFields); setEditing(null); })} />
              <Btn title="ביטול" variant="outline" onPress={() => setEditing(null)} />
            </Row>
          </Card>
        ) : (
          <Card key={log.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <Muted>{formatDate(log.date)}</Muted>
              {log.groupName ? <Muted>👥 {log.groupName}</Muted> : null}
            </Row>
            <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>{log.unit}</ThemedText>
            {log.notes ? <ThemedText style={{ textAlign: "right" }}>{log.notes}</ThemedText> : null}
            <Row style={{ flexWrap: "wrap" }}>
              <Btn small variant="outline" title="עריכה" onPress={() => { setEditing(log.id); setEditFields({ date: log.date.slice(0, 10), unit: log.unit, notes: log.notes ?? "" }); }} />
              <Btn small variant="danger" title="מחיקה" onPress={async () => { if (await confirmAction("למחוק את הרישום?")) act(() => web.del(`/learning/${log.id}`)); }} />
            </Row>
            {data.myGroups.length ? (
              <Row style={{ flexWrap: "wrap" }}>
                <View style={{ flex: 1, minWidth: 180 }}>
                  <Select options={data.myGroups.map((g) => ({ value: g.id, label: g.name }))} value={shareTo[log.id] ?? log.groupId ?? data.myGroups[0].id} onChange={(v) => setShareTo((p) => ({ ...p, [log.id]: v }))} />
                </View>
                <Btn small variant="secondary" title="שתף לקבוצה" onPress={() => act(async () => {
                  const res = await web.post<{ shareMessage?: string }>(`/learning/${log.id}/share`, { groupId: shareTo[log.id] ?? log.groupId ?? data.myGroups[0].id });
                  setMsg({ kind: "info", text: res.data.shareMessage ?? "שותף" });
                })} />
              </Row>
            ) : null}
          </Card>
        )
      )}
    </Screen>
  );
}
