// src/app/group-edit.tsx - עריכת קבוצה (מנהל הקבוצה / מנהל מערכת). מקביל ל-GET /groups/:id/edit ו-PUT /groups/:id.
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { GroupForm, type GroupFormValues } from "@/components/group-form";
import { ErrorView, H1, Loading, Screen } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { useAuth } from "@/contexts/auth-context";

type GroupData = { group: Partial<GroupFormValues> & { id: string } };

export default function GroupEditScreen() {
  return (
    <RequireLogin>
      <Editor />
    </RequireLogin>
  );
}

function Editor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { web } = useAuth();
  const [initial, setInitial] = useState<GroupFormValues | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    web
      .get<GroupData>(`/groups/${id}/edit`)
      .then((res) => {
        const g = res.data.group;
        setInitial({
          name: g.name ?? "",
          description: g.description ?? "",
          category: g.category ?? "community",
          topic: g.topic ?? "",
          dayOfWeek: g.dayOfWeek ?? "",
          time: g.time ?? "",
          level: g.level ?? "",
          sectionKey: g.sectionKey ?? "",
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "שגיאה בטעינה"));
  }, [web, id]);

  if (!initial) return error ? <ErrorView message={error} /> : <Loading />;

  async function submit(values: GroupFormValues) {
    setBusy(true);
    setError(null);
    try {
      await web.put(`/groups/${id}`, values);
      router.replace(`/group/${id}` as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בשמירה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>עריכת קבוצה</H1>
      <GroupForm initial={initial} submitLabel="שמירה" busy={busy} error={error} onSubmit={submit} />
    </Screen>
  );
}
