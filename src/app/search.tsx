// src/app/search.tsx - חיפוש גלובלי בקבוצות ובפוסטים + "שאל את האתר" (AI עונה על בסיס פוסטים בפועל, עם מקורות). מקביל ל-/search.
import { useRouter } from "expo-router";
import { useState } from "react";

import { AiAnswerBox, useAi } from "@/components/ai-box";
import { Btn, Card, Empty, Field, H2, Muted, Row, Screen } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { WEB_PREFIX } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";

type Group = { id: string; name: string; topic?: string };
type Post = { id: string; title: string; authorName: string; groupName: string; groupId: string };

export default function SearchScreen() {
  const router = useRouter();
  const { web, token } = useAuth();
  const [q, setQ] = useState("");
  const [result, setResult] = useState<{ q: string; groups: Group[]; posts: Post[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const ai = useAi();

  async function search() {
    if (!q.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await web.get<{ q: string; groups: Group[]; posts: Post[] }>(`/search?q=${encodeURIComponent(q.trim())}`);
      setResult(res.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "שגיאה בחיפוש");
    } finally {
      setBusy(false);
    }
  }

  function ask() {
    ai.run(`${WEB_PREFIX}/api/ai/search`, { question: question.trim() });
  }

  return (
    <Screen>
      <H2>🔎 חיפוש</H2>
      <Row>
        <Btn title="חפש" small loading={busy} onPress={search} />
        <Field style={{ flex: 1 }} value={q} onChangeText={setQ} placeholder="חפש קבוצה, שיעור, דבר תורה..." onSubmitEditing={search} />
      </Row>
      {err ? <Muted>{err}</Muted> : null}

      {token ? (
        <Card>
          <H2>💡 שאל את האתר</H2>
          <Muted>שאלה בעברית חופשית - ה-AI עונה על סמך הפוסטים שבאתר.</Muted>
          <Field value={question} onChangeText={setQuestion} placeholder="למשל: מה למדו על שבת?" maxLength={500} />
          <Btn title="שאל" variant="secondary" loading={ai.isLoading} disabled={question.trim().length < 3} onPress={ask} />
          <AiAnswerBox state={ai.state} />
        </Card>
      ) : null}

      {result ? (
        <>
          <H2>קבוצות ושיעורים ({result.groups.length})</H2>
          {result.groups.length === 0 ? <Empty text={`לא נמצאו קבוצות התואמות את "${result.q}".`} /> : null}
          {result.groups.map((g) => (
            <Card key={g.id} onPress={() => router.push(`/group/${g.id}` as never)}>
              <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>{g.name}</ThemedText>
              {g.topic ? <Muted>נושא: {g.topic}</Muted> : null}
            </Card>
          ))}
          <H2>פוסטים ודברי תורה ({result.posts.length})</H2>
          {result.posts.length === 0 ? <Empty text={`לא נמצאו פוסטים התואמים את "${result.q}".`} /> : null}
          {result.posts.map((p) => (
            <Card key={p.id} onPress={() => router.push(`/group/${p.groupId}` as never)}>
              <ThemedText style={{ fontWeight: "700", textAlign: "right" }}>{p.title}</ThemedText>
              <Muted>{p.authorName} | {p.groupName}</Muted>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
