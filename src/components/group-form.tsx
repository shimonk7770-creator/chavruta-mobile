// src/components/group-form.tsx - טופס משותף ליצירת קבוצה (מנהל מערכת) ולעריכת קבוצה (מנהל הקבוצה). מקביל ל-views/groups/new.ejs ו-edit.ejs.
import { useState } from "react";

import { Banner, Btn, Card, Chips, Field, Select } from "@/components/kit";

export type GroupFormValues = {
  name: string;
  description: string;
  category: string;
  topic: string;
  dayOfWeek: string;
  time: string;
  level: string;
  sectionKey: string;
};

export const EMPTY_GROUP: GroupFormValues = { name: "", description: "", category: "community", topic: "", dayOfWeek: "", time: "", level: "", sectionKey: "" };

export type SectionDef = { key: string; name: string; emoji: string };

export function GroupForm({
  initial,
  sections,
  submitLabel,
  busy,
  error,
  onSubmit,
}: {
  initial: GroupFormValues;
  sections?: SectionDef[]; // רק ביצירה
  submitLabel: string;
  busy: boolean;
  error: string | null;
  onSubmit: (values: GroupFormValues) => void;
}) {
  const [f, setF] = useState<GroupFormValues>(initial);
  const set = (k: keyof GroupFormValues) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <Card>
      {sections ? (
        <Select
          label="מדור בבית חב״ד (אופציונלי)"
          options={[{ value: "", label: "קבוצה רגילה (ללא מדור)" }, ...sections.map((s) => ({ value: s.key, label: `${s.emoji} ${s.name}` }))]}
          value={f.sectionKey}
          onChange={(v) => {
            const sec = sections.find((s) => s.key === v);
            setF((p) => ({ ...p, sectionKey: v, name: sec && !p.name ? sec.name : p.name }));
          }}
        />
      ) : null}
      <Field label="שם הקבוצה" value={f.name} onChangeText={set("name")} maxLength={80} />
      <Field label="תיאור" value={f.description} onChangeText={set("description")} multiline maxLength={500} />
      <Chips
        options={[
          { value: "shiur", label: "שיעור" },
          { value: "vaad", label: "ועד" },
          { value: "community", label: "קהילה" },
        ]}
        value={f.category}
        onChange={set("category")}
      />
      <Field label="נושא" value={f.topic} onChangeText={set("topic")} maxLength={80} />
      <Field label="יום בשבוע" value={f.dayOfWeek} onChangeText={set("dayOfWeek")} placeholder="לדוגמה: שלישי" />
      <Field label="שעה" value={f.time} onChangeText={set("time")} placeholder="20:00" />
      <Select
        label="רמה"
        options={[
          { value: "", label: "לא רלוונטי" },
          { value: "beginners", label: "מתחילים" },
          { value: "intermediate", label: "בינוני" },
          { value: "advanced", label: "מתקדמים" },
        ]}
        value={f.level}
        onChange={set("level")}
      />
      <Banner kind="error" text={error} />
      <Btn title={submitLabel} loading={busy} onPress={() => onSubmit(f)} />
    </Card>
  );
}
