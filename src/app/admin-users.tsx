// src/app/admin-users.tsx - ניהול משתמשים (מנהל מערכת): השבתה / הפעלה מחדש / מינוי מנהל / החזרה לחבר. מקביל ל-/admin/users.
import { useState } from "react";

import { Badge, Banner, Btn, Card, ErrorView, H1, Loading, Muted, Row, Screen, confirmAction } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";

type U = { id: string; fullName: string; username: string; email: string; role: string; isActive?: boolean };
type UsersData = { users: U[] };

const ROLE_LABEL: Record<string, string> = { admin: "מנהל מערכת", manager: "מנהל קבוצה", member: "חבר קהילה" };

export default function AdminUsersScreen() {
  return (
    <RequireLogin>
      <Users />
    </RequireLogin>
  );
}

function Users() {
  const { web, user } = useAuth();
  const { data, error, loading, refresh, refreshing, reload } = useLoad(async () => (await web.get<UsersData>("/admin/users")).data, []);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  async function act(u: U, action: string, confirmText?: string) {
    if (confirmText && !(await confirmAction(confirmText))) return;
    try {
      const res = await web.post(`/admin/users/${u.id}/action`, { action });
      setMsg({ kind: "success", text: res.message || "בוצע" });
      reload();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "שגיאה" });
    }
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <H1>🧑‍💼 משתמשים ({data.users.length})</H1>
      <Banner kind={msg?.kind ?? "info"} text={msg?.text} />
      {data.users.map((u) => (
        <Card key={u.id} style={u.isActive === false ? { opacity: 0.6 } : undefined}>
          <Row style={{ justifyContent: "space-between" }}>
            <Badge text={u.isActive === false ? "מושבת" : "פעיל"} tone={u.isActive === false ? "red" : "green"} />
            <ThemedText style={{ fontWeight: "700" }}>{u.fullName}{u.id === user?.id ? " (אני)" : ""}</ThemedText>
          </Row>
          <Muted>@{u.username} · {u.email}</Muted>
          <Badge text={ROLE_LABEL[u.role] ?? u.role} tone="orange" />
          {u.id !== user?.id ? (
            <Row style={{ flexWrap: "wrap" }}>
              {u.isActive === false ? (
                <Btn small variant="outline" title="הפעל מחדש" onPress={() => act(u, "activate")} />
              ) : (
                <Btn small variant="danger" title="השבת" onPress={() => act(u, "suspend", `להשבית את ${u.fullName}? הוא ינותק מיד.`)} />
              )}
              {u.role === "admin" ? (
                <Btn small variant="outline" title="הורד לחבר" onPress={() => act(u, "makeMember")} />
              ) : (
                <Btn small variant="secondary" title="מנה למנהל" onPress={() => act(u, "makeAdmin", `למנות את ${u.fullName} למנהל מערכת?`)} />
              )}
            </Row>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
