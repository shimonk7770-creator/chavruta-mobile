// src/app/group-new.tsx - יצירת קבוצה חדשה (מנהל מערכת בלבד; נאכף גם בשרת). מקביל ל-GET/POST /groups.
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { EMPTY_GROUP, GroupForm, type GroupFormValues, type SectionDef } from "@/components/group-form";
import { ErrorView, H1, Loading, Screen } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { useAuth } from "@/contexts/auth-context";

export default function GroupNewScreen() {
  return (
    <RequireLogin>
      <Editor />
    </RequireLogin>
  );
}

function Editor() {
  const router = useRouter();
  const { web, isAdmin } = useAuth();
  const [sections, setSections] = useState<SectionDef[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    web
      .get<{ sections: SectionDef[] }>("/groups/new")
      .then((res) => setSections(res.data.sections ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "שגיאה בטעינה"));
  }, [web]);

  if (!isAdmin) return <ErrorView message="יצירת קבוצה מותרת למנהל מערכת בלבד" />;
  if (!sections) return error ? <ErrorView message={error} /> : <Loading />;

  async function submit(values: GroupFormValues) {
    setBusy(true);
    setError(null);
    try {
      const res = await web.post("/groups", values);
      // השרת מפנה ל-/groups/<id> של הקבוצה החדשה
      const id = res.redirect?.match(/\/groups\/([^/?]+)/)?.[1];
      router.replace((id ? `/group/${id}` : "/groups") as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה ביצירת הקבוצה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>קבוצה חדשה</H1>
      <GroupForm initial={EMPTY_GROUP} sections={sections} submitLabel="יצירת קבוצה" busy={busy} error={error} onSubmit={submit} />
    </Screen>
  );
}
