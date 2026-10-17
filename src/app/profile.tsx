// src/app/profile.tsx - הפרופיל שלי: שם, ביו, תמונה (העלאה), עיר לזמני שבת, שינוי סיסמה, התנתקות ומחיקת חשבון. מקביל ל-/profile באתר.
import { useState } from "react";

import { Avatar, Banner, Btn, Card, ErrorView, Field, H1, H2, Loading, Muted, Row, Screen, Select, confirmAction } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";
import { appendFile, pickImages } from "@/lib/files";

type ProfileUser = { id: string; fullName: string; username: string; email?: string; bio?: string; avatarUrl?: string; shabbatCity?: string; role?: string };
type ProfileData = { profileUser: ProfileUser; cityOptions: { key: string; label: string }[] };

export default function ProfileScreen() {
  return (
    <RequireLogin>
      <Profile />
    </RequireLogin>
  );
}

function Profile() {
  const { web, logout, updateUser } = useAuth();
  const { data, error, loading, reload } = useLoad(async () => (await web.get<ProfileData>("/profile")).data, []);
  const [f, setF] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  const u = data.profileUser;
  const val = (k: string, fallback = "") => f[k] ?? (u as unknown as Record<string, string>)[k] ?? fallback;
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "שגיאה" });
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    run(async () => {
      const res = await web.post<ProfileData>("/profile", {
        fullName: val("fullName"),
        bio: val("bio"),
        avatarUrl: u.avatarUrl ?? "",
        shabbatCity: val("shabbatCity"),
        currentPassword: f.currentPassword ?? "",
        newPassword: f.newPassword ?? "",
      });
      updateUser({ fullName: res.data.profileUser.fullName });
      setF((p) => ({ ...p, currentPassword: "", newPassword: "" }));
      setMsg({ kind: "success", text: res.message || "הפרטים עודכנו בהצלחה" });
      reload();
    });

  const changeAvatar = () =>
    run(async () => {
      const [file] = await pickImages();
      if (!file) return;
      const form = new FormData();
      await appendFile(form, "avatar", file);
      const res = await web.upload<ProfileData>("/profile/avatar", form);
      updateUser({ avatarUrl: res.data.profileUser.avatarUrl ?? "" });
      setMsg({ kind: "success", text: "תמונת הפרופיל עודכנה בהצלחה" });
      reload();
    });

  const deleteAccount = async () => {
    if (!(await confirmAction("למחוק את החשבון?", "החשבון יושבת ותנותקו מיד. פעולה זו לא ניתנת לביטול מהאפליקציה."))) return;
    await run(async () => {
      await web.post("/profile/delete");
      logout();
    });
  };

  return (
    <Screen>
      <H1>הפרופיל שלי</H1>
      <Card style={{ alignItems: "center" }}>
        <Avatar name={u.fullName} url={u.avatarUrl} size={96} />
        <Muted>@{u.username}{u.email ? ` · ${u.email}` : ""}</Muted>
        <Btn small variant="outline" title="📷 החלפת תמונה" onPress={changeAvatar} />
      </Card>
      <Banner kind={msg?.kind ?? "info"} text={msg?.text} />
      <Card>
        <Field label="שם מלא" value={val("fullName")} onChangeText={set("fullName")} />
        <Field label="קצת עליי" value={val("bio")} onChangeText={set("bio")} multiline maxLength={300} />
        <Select label="עיר לזמני שבת והיום" options={data.cityOptions.map((c) => ({ value: c.key, label: c.label }))} value={val("shabbatCity", data.cityOptions[0]?.key)} onChange={set("shabbatCity")} />
        <H2>שינוי סיסמה (רשות)</H2>
        <Field label="סיסמה נוכחית" value={f.currentPassword ?? ""} onChangeText={set("currentPassword")} secureTextEntry />
        <Field label="סיסמה חדשה" value={f.newPassword ?? ""} onChangeText={set("newPassword")} secureTextEntry hint="לפחות 8 תווים, אות גדולה וספרה" />
        <Btn title="שמירת שינויים" loading={busy} onPress={save} />
      </Card>
      <Row>
        <Btn title="התנתקות" variant="outline" onPress={logout} style={{ flex: 1 }} />
        <Btn title="מחיקת חשבון" variant="danger" onPress={deleteAccount} style={{ flex: 1 }} />
      </Row>
    </Screen>
  );
}
