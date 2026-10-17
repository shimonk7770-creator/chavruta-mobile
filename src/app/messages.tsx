// src/app/messages.tsx - הודעות פרטיות: רשימת שיחות + חיפוש משתמש להתחלת שיחה חדשה (מקביל ל-/messages באתר).
import { useRouter } from "expo-router";
import { useState } from "react";

import { Avatar, Btn, Card, Empty, ErrorView, Field, H2, Loading, Muted, Row, Screen } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useLoad } from "@/hooks/use-load";

type PublicUser = { id: string; fullName: string; username: string; avatarUrl?: string };
type Conversation = { otherUserId: string; otherUser: PublicUser; lastMessage: { senderId: string; content: string } };
type InboxData = { conversations: Conversation[]; searchResults: PublicUser[]; q: string };

export default function MessagesScreen() {
  return (
    <RequireLogin>
      <Inbox />
    </RequireLogin>
  );
}

function Inbox() {
  const router = useRouter();
  const { web } = useAuth();
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const { data, error, loading, refresh, refreshing, reload } = useLoad(
    async () => (await web.get<InboxData>(`/messages${applied ? `?q=${encodeURIComponent(applied)}` : ""}`)).data,
    [applied]
  );

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  const open = (id: string) => router.push(`/dm?userId=${id}` as never);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Row>
        <Btn title="חיפוש" small onPress={() => setApplied(query.trim())} />
        <Field style={{ flex: 1 }} value={query} onChangeText={setQuery} placeholder="חיפוש משתמש לפי שם / שם משתמש" onSubmitEditing={() => setApplied(query.trim())} />
      </Row>
      {applied ? (
        <>
          <H2>תוצאות חיפוש</H2>
          {data?.searchResults.length ? (
            data.searchResults.map((u) => (
              <Card key={u.id} onPress={() => open(u.id)}>
                <Row>
                  <Avatar name={u.fullName} url={u.avatarUrl} />
                  <Row style={{ flex: 1, flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
                    <ThemedText style={{ fontWeight: "700" }}>{u.fullName}</ThemedText>
                    <Muted>@{u.username}</Muted>
                  </Row>
                </Row>
              </Card>
            ))
          ) : (
            <Empty text="לא נמצאו משתמשים" />
          )}
        </>
      ) : null}
      <H2>השיחות שלי</H2>
      {data?.conversations.length ? (
        data.conversations.map((c) => (
          <Card key={c.otherUserId} onPress={() => open(c.otherUser.id)}>
            <Row>
              <Avatar name={c.otherUser.fullName} url={c.otherUser.avatarUrl} />
              <Row style={{ flex: 1, flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
                <ThemedText style={{ fontWeight: "700" }}>{c.otherUser.fullName}</ThemedText>
                <Muted>
                  {c.lastMessage.senderId === c.otherUser.id ? `${c.otherUser.fullName}: ` : "אתה: "}
                  {c.lastMessage.content}
                </Muted>
              </Row>
            </Row>
          </Card>
        ))
      ) : (
        <Empty text="אין עדיין שיחות. חפשו משתמש למעלה כדי להתחיל." />
      )}
    </Screen>
  );
}
