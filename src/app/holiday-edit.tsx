// src/app/holiday-edit.tsx - יצירה / עריכה של מאמר חג (מנהל מערכת בלבד; נאכף גם בשרת). כולל העלאת תמונה.
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image } from "react-native";

import { Banner, Btn, Card, DateField, ErrorView, Field, H1, Loading, Screen, Select } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { resolveUrl } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { appendFile, pickImages, type PickedFile } from "@/lib/files";

type Holiday = { id: string; holidayName: string; dateHint?: string; whatWeDo?: string; whatWePray?: string; customs?: string; linkedGroupId?: string; gregorianDate?: string; order?: number; imageUrl?: string };
type EditData = { holiday?: Holiday; groups: { id: string; name: string }[] };

export default function HolidayEditScreen() {
  return (
    <RequireLogin>
      <Editor />
    </RequireLogin>
  );
}

function Editor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { web, isAdmin } = useAuth();
  const [groups, setGroups] = useState<EditData["groups"]>([]);
  const [f, setF] = useState<Record<string, string>>({});
  const [image, setImage] = useState<PickedFile | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    web
      .get<EditData>(id ? `/holidays/${id}/edit` : "/holidays/new")
      .then((res) => {
        setGroups(res.data.groups);
        const h = res.data.holiday;
        if (h) {
          setF({
            holidayName: h.holidayName ?? "",
            dateHint: h.dateHint ?? "",
            gregorianDate: h.gregorianDate ?? "",
            order: h.order !== undefined ? String(h.order) : "",
            whatWeDo: h.whatWeDo ?? "",
            whatWePray: h.whatWePray ?? "",
            customs: h.customs ?? "",
            linkedGroupId: h.linkedGroupId ?? "",
          });
          setExistingImage(h.imageUrl ?? "");
        }
        setReady(true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "שגיאה בטעינה"));
  }, [web, id]);

  if (!isAdmin) return <ErrorView message="פעולה זו מותרת למנהל מערכת בלבד" />;
  if (error && !ready) return <ErrorView message={error} />;
  if (!ready) return <Loading />;

  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      Object.entries(f).forEach(([k, v]) => form.append(k, v ?? ""));
      if (image) await appendFile(form, "holidayImage", image);
      const res = await web.upload(id ? `/holidays/${id}` : "/holidays", form);
      void res;
      router.replace((id ? `/holiday?id=${id}` : "/holidays") as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בשמירה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>{id ? "עריכת מאמר חג" : "מאמר חג חדש"}</H1>
      <Card>
        <Field label="שם החג" value={f.holidayName ?? ""} onChangeText={set("holidayName")} />
        <Field label="מתי (תיאור)" value={f.dateHint ?? ""} onChangeText={set("dateHint")} />
        <DateField label="תאריך לועזי (להצגה בלוח)" value={f.gregorianDate ?? ""} onChange={set("gregorianDate")} />
        <Field label="סדר תצוגה" value={f.order ?? ""} onChangeText={set("order")} keyboardType="numeric" />
        <Field label="מה עושים" value={f.whatWeDo ?? ""} onChangeText={set("whatWeDo")} multiline />
        <Field label="מה מתפללים" value={f.whatWePray ?? ""} onChangeText={set("whatWePray")} multiline />
        <Field label="מנהגים" value={f.customs ?? ""} onChangeText={set("customs")} multiline />
        <Select label="קבוצה מקושרת" options={[{ value: "", label: "ללא" }, ...groups.map((g) => ({ value: g.id, label: g.name }))]} value={f.linkedGroupId ?? ""} onChange={set("linkedGroupId")} />
        {image ? <Image source={{ uri: image.uri }} style={{ height: 140, borderRadius: 12 }} /> : existingImage ? <Image source={{ uri: resolveUrl(existingImage) }} style={{ height: 140, borderRadius: 12 }} /> : null}
        <Btn title="🖼️ בחירת תמונה" variant="outline" onPress={async () => setImage((await pickImages())[0] ?? null)} />
        <Banner kind="error" text={error} />
        <Btn title="שמירה" loading={busy} onPress={save} />
      </Card>
    </Screen>
  );
}
