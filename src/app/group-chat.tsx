// src/app/group-chat.tsx - צ'אט קבוצתי בזמן אמת (chat:join / chat:send / chat:message / chat:typing), כולל שליחת תמונה.
// בקבוצות של בית חב״ד הודעה שה-AI מזהה כלא-רלוונטית למדור נחסמת (chat:blocked) והטקסט מוחזר לשולח, כמו באתר.
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { type ChatMessage, ChatView } from "@/components/chat-view";
import { ErrorView, Loading } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { appendFile, pickImages } from "@/lib/files";
import { toIso } from "@/lib/format";
import { Stack } from "expo-router";

type ChatData = { group: { id: string; name: string }; messages: ChatMessage[]; userId: string };

function byTime(a: ChatMessage, b: ChatMessage) {
  return toIso(a.createdAt).localeCompare(toIso(b.createdAt));
}

export default function GroupChatScreen() {
  return (
    <RequireLogin>
      <GroupChat />
    </RequireLogin>
  );
}

function GroupChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { web, user } = useAuth();
  const { socket, connected } = useSocket();
  const [group, setGroup] = useState<ChatData["group"] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const lastTypingSent = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    web
      .get<ChatData>(`/groups/${id}/chat`)
      .then((res) => {
        if (cancelled) return;
        setGroup(res.data.group);
        setMessages([...res.data.messages].sort(byTime));
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "שגיאה בטעינת הצ'אט"));
    return () => {
      cancelled = true;
    };
  }, [web, id]);

  useEffect(() => {
    if (!socket || !connected || !id) return;
    socket.emit("chat:join", id);
    const onMessage = (m: ChatMessage) => setMessages((prev) => (prev.some((p) => p.id && p.id === m.id) ? prev : [...prev, m].sort(byTime)));
    const onTyping = (p: { userName: string }) => {
      setTyping(p.userName);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 2500);
    };
    const onBlocked = (p: { message: string }) => setNotice({ kind: "error", text: p.message });
    const onError = (msg: string) => setNotice({ kind: "error", text: String(msg) });
    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    socket.on("chat:blocked", onBlocked);
    socket.on("chat:error", onError);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
      socket.off("chat:blocked", onBlocked);
      socket.off("chat:error", onError);
    };
  }, [socket, connected, id]);

  const send = useCallback(
    (text: string) => {
      setNotice(null);
      socket?.emit("chat:send", { groupId: id, content: text });
    },
    [socket, id]
  );

  const sendImage = useCallback(async () => {
    try {
      const [file] = await pickImages();
      if (!file) return;
      const form = new FormData();
      await appendFile(form, "image", file);
      const res = await web.upload<{ imageUrl?: string }>(`/api/groups/${id}/chat/image`, form);
      const imageUrl = (res as unknown as { imageUrl?: string }).imageUrl;
      if (imageUrl) socket?.emit("chat:send", { groupId: id, content: "", imageUrl });
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof Error ? e.message : "שגיאה בשליחת התמונה" });
    }
  }, [web, id, socket]);

  const typingPing = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSent.current > 1500) {
      lastTypingSent.current = now;
      socket?.emit("chat:typing", id);
    }
  }, [socket, id]);

  if (error) return <ErrorView message={error} />;
  if (!group) return <Loading />;

  return (
    <>
      <Stack.Screen options={{ title: `צ'אט - ${group.name}` }} />
      <ChatView
        messages={messages}
        myId={user?.id ?? ""}
        onSend={send}
        onTyping={typingPing}
        onPickImage={sendImage}
        typingName={typing}
        showSender
        notice={!connected ? { kind: "info", text: "מתחבר לשרת..." } : notice}
      />
    </>
  );
}
