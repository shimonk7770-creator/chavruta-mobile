// src/components/group-manager-tools.tsx - כלי ניהול קבוצה (מנהל הקבוצה / מנהל מערכת), מקביל לאזור הניהול ב-views/groups/show.ejs:
// עריכת פרטים, החלפת תמונת קבוצה, הוספת חבר לפי שם משתמש, הסרת חבר ומחיקת הקבוצה.
import { useRouter } from "expo-router";
import { useState } from "react";

import { Banner, Btn, Card, Field, H2, confirmAction } from "@/components/kit";
import { useAuth } from "@/contexts/auth-context";
import { appendFile, pickImages } from "@/lib/files";
import type { GroupMember } from "@/types/chavruta";

export function GroupManagerTools({ groupId, members, onChanged }: { groupId: string; members: GroupMember[]; onChanged: () => void }) {
  const router = useRouter();
  const { web } = useAuth();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "הפעולה נכשלה");
    } finally {
      setBusy(null);
    }
  }

  const addMember = () =>
    run("add", async () => {
      await web.post(`/groups/${groupId}/members`, { username: username.trim() });
      setUsername("");
      setInfo("החבר נוסף");
      onChanged();
    });

  const changePhoto = () =>
    run("photo", async () => {
      const [file] = await pickImages();
      if (!file) return;
      const form = new FormData();
      await appendFile(form, "groupPhoto", file);
      await web.upload(`/groups/${groupId}/photo`, form);
      setInfo("תמונת הקבוצה עודכנה");
      onChanged();
    });

  const removeMember = (m: GroupMember) =>
    run("rm" + m.id, async () => {
      if (!(await confirmAction("הסרת חבר", `להסיר את ${m.fullName} מהקבוצה?`))) return;
      await web.post(`/groups/${groupId}/members/${m.id}/remove`);
      onChanged();
    });

  const deleteGroup = () =>
    run("del", async () => {
      if (!(await confirmAction("מחיקת קבוצה", "למחוק את הקבוצה? אי אפשר לבטל."))) return;
      await web.del(`/groups/${groupId}`);
      router.replace("/groups" as never);
    });

  return (
    <Card>
      <H2>⚙️ ניהול הקבוצה</H2>
      <Btn title="✏️ עריכת פרטי הקבוצה" variant="outline" onPress={() => router.push(`/group-edit?id=${groupId}` as never)} />
      <Btn title="🖼️ החלפת תמונת קבוצה" variant="outline" loading={busy === "photo"} onPress={changePhoto} />
      <Field label="הוספת חבר לפי שם משתמש" value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="שם משתמש" />
      <Btn title="הוספה" loading={busy === "add"} disabled={!username.trim()} onPress={addMember} />
      {members
        .filter((m) => !m.isManager)
        .map((m) => (
          <Btn key={m.id} small variant="ghost" title={`הסרת ${m.fullName}`} loading={busy === "rm" + m.id} onPress={() => removeMember(m)} />
        ))}
      <Banner kind="error" text={error} />
      <Banner kind="success" text={info} />
      <Btn title="🗑️ מחיקת הקבוצה" variant="danger" loading={busy === "del"} onPress={deleteGroup} />
    </Card>
  );
}
