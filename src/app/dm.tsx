// src/app/dm.tsx - שיחה פרטית 1-על-1 בזמן אמת (dm:join / dm:send / dm:message / dm:typing), כמו /messages/:userId באתר.
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { type ChatMessage, ChatView } from "@/components/chat-view";
import { ErrorView, Loading } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { toIso } from "@/lib/format";

type DmData = { otherUser: { id: string; fullName: string }; messages: ChatMessage[]; userId: string };

function byTime(a: ChatMessage, b: ChatMessage) {
  return toIso(a.createdAt).localeCompare(toIso(b.createdAt));
}

export default function DmScreen() {
  return (
    <RequireLogin>
      <Dm />
    </RequireLogin>
  );
}

function Dm() {
  const { userId: otherId } = useLocalSearchParams<{ userId: string }>();
  const { web, user } = useAuth();
  const { socket, connected } = useSocket();
  const [other, setOther] = useState<DmData["otherUser"] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const lastTypingSent = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    web
      .get<DmData>(`/messages/${otherId}`)
      .then((res) => {
        if (cancelled) return;
        setOther(res.data.otherUser);
        setMessages([...res.data.messages].sort(byTime));
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "שגיאה בטעינת השיחה"));
    return () => {
      cancelled = true;
    };
  }, [web, otherId]);

  // הצטרפות לחדר + האזנה; בחיבור מחדש משלימים הודעות שהוחמצו (REST: /api/messages/:userId/history?since=)
  useEffect(() => {
    if (!socket || !connected || !otherId) return;
    socket.emit("dm:join", otherId);
    const onMessage = (m: ChatMessage) => setMessages((prev) => (prev.some((p) => p.id && p.id === m.id) ? prev : [...prev, m].sort(byTime)));
    const onTyping = (p: { userName: string }) => {
      setTyping(p.userName);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 2500);
    };
    const onError = (msg: string) => setNotice({ kind: "error", text: String(msg) });
    socket.on("dm:message", onMessage);
    socket.on("dm:typing", onTyping);
    socket.on("chat:error", onError);
    return () => {
      socket.off("dm:message", onMessage);
      socket.off("dm:typing", onTyping);
      socket.off("chat:error", onError);
    };
  }, [socket, connected, otherId]);

  const send = useCallback(
    (text: string) => {
      setNotice(null);
      socket?.emit("dm:send", { recipientId: otherId, content: text });
    },
    [socket, otherId]
  );
  const typingPing = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSent.current > 1500) {
      lastTypingSent.current = now;
      socket?.emit("dm:typing", otherId);
    }
  }, [socket, otherId]);

  if (error) return <ErrorView message={error} />;
  if (!other) return <Loading />;

  return (
    <>
      <Stack.Screen options={{ title: other.fullName }} />
      <ChatView
        messages={messages}
        myId={user?.id ?? ""}
        onSend={send}
        onTyping={typingPing}
        typingName={typing}
        showSender={false}
        notice={!connected ? { kind: "info", text: "מתחבר לשרת..." } : notice}
      />
    </>
  );
}
