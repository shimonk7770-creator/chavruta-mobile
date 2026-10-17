// src/app/admin-moderation.tsx - פיקוח תוכן (מנהל מערכת): דיווחי משתמשים (הסרה / דחייה) ותוכן שה-AI לא בדק (אישור / הסרה). מקביל ל-/admin/moderation.
import { useState } from "react";

import { Banner, Btn, Card, Empty, ErrorView, H1, H2, Loading, Muted, Row, Screen, confirmAction } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";

type Report = {
  id: string;
  targetType: string;
  groupName?: string;
  reporterName: string;
  reason: string;
  details?: string;
  snapshot?: { title?: string; content?: string; authorName?: string };
};
type Unchecked = { id: string; title?: string; content: string; groupName?: string; authorName: string };
type ModData = { reports: Report[]; uncheckedPosts: Unchecked[]; uncheckedComments: Unchecked[]; reasons: Record<string, string> };

export default function AdminModerationScreen() {
  return (
    <RequireLogin>
      <Moderation />
    </RequireLogin>
  );
}

function Moderation() {
  const { web } = useAuth();
  const { data, error, loading, refresh, refreshing, reload } = useLoad(async () => (await web.get<ModData>("/admin/moderation")).data, []);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  async function run(path: string, confirmText?: string) {
    if (confirmText && !(await confirmAction(confirmText))) return;
    try {
      const res = await web.post(path);
      setMsg({ kind: "success", text: res.message || "בוצע" });
      reload();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "שגיאה" });
    }
  }

  const unchecked = [
    ...data.uncheckedPosts.map((p) => ({ ...p, kind: "post" as const })),
    ...data.uncheckedComments.map((c) => ({ ...c, kind: "comment" as const })),
  ];

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <H1>🚩 פיקוח תוכן</H1>
      <Banner kind={msg?.kind ?? "info"} text={msg?.text} />
      <H2>דיווחי משתמשים ({data.reports.length})</H2>
      {data.reports.length === 0 ? <Empty text="אין דיווחים פתוחים. 🎉" /> : null}
      {data.reports.map((r) => (
        <Card key={r.id}>
          <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>{r.targetType === "post" ? "פוסט" : "תגובה"} ב&quot;{r.groupName || "לא ידוע"}&quot;</ThemedText>
          <Muted>דווח ע&quot;י {r.reporterName} · סיבה: {data.reasons[r.reason] || r.reason}</Muted>
          {r.details ? <Muted>הערת המדווח: {r.details}</Muted> : null}
          {r.snapshot?.title ? <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>{r.snapshot.title}</ThemedText> : null}
          <ThemedText style={{ textAlign: "right" }}>{r.snapshot?.content}</ThemedText>
          <Muted>נכתב ע&quot;י {r.snapshot?.authorName}</Muted>
          <Row>
            <Btn small variant="danger" title="הסר תוכן" onPress={() => run(`/admin/reports/${r.id}/remove`, "להסיר את התוכן?")} />
            <Btn small variant="outline" title="דחה דיווח" onPress={() => run(`/admin/reports/${r.id}/dismiss`)} />
          </Row>
        </Card>
      ))}
      <H2>תוכן שה-AI לא בדק ({unchecked.length})</H2>
      {unchecked.length === 0 ? <Empty text="הכל נבדק." /> : null}
      {unchecked.map((u) => (
        <Card key={`${u.kind}-${u.id}`}>
          <Muted>{u.kind === "post" ? "פוסט" : "תגובה"}{u.groupName ? ` ב"${u.groupName}"` : ""} · {u.authorName}</Muted>
          {u.title ? <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>{u.title}</ThemedText> : null}
          <ThemedText style={{ textAlign: "right" }}>{u.content}</ThemedText>
          <Row>
            <Btn small variant="secondary" title="✔ אשר" onPress={() => run(`/admin/unchecked/${u.kind}/${u.id}/approve`)} />
            <Btn small variant="danger" title="הסר" onPress={() => run(`/admin/unchecked/${u.kind}/${u.id}/remove`, "להסיר?")} />
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
