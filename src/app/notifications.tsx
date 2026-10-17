// src/app/notifications.tsx - "פעמון" ההתראות: הודעות חדשות, תגובות ועוד. לחיצה פותחת את המקום הרלוונטי; "סמן הכל כנקרא". מקביל לפעמון באתר.
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { Btn, Card, Empty, ErrorView, H2, Loading, Muted, Row, Screen } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { useLoad } from "@/hooks/use-load";
import { formatDateTime, toIso } from "@/lib/format";

type Notif = { id: string; type: string; text: string; link: string; read?: boolean; isRead?: boolean; createdAt?: unknown };

// הופך קישור של האתר (/groups/ID/chat, /messages/ID, /groups/ID) לנתיב מסך באפליקציה
export function notificationRoute(link: string): string {
  const chat = link.match(/^\/groups\/([^/]+)\/chat/);
  if (chat) return `/group-chat?id=${chat[1]}`;
  const dm = link.match(/^\/messages\/([^/]+)/);
  if (dm) return `/dm?userId=${dm[1]}`;
  const group = link.match(/^\/groups\/([^/?#]+)/);
  if (group) return `/group/${group[1]}`;
  return "/";
}

export default function NotificationsScreen() {
  return (
    <RequireLogin>
      <List />
    </RequireLogin>
  );
}

function List() {
  const router = useRouter();
  const { web } = useAuth();
  const { unreadCount, setUnreadCount, refreshUnread } = useSocket();
  const { data, error, loading, refresh, refreshing, reload } = useLoad(
    async () => (await web.get("/api/notifications")) as unknown as { notifications: Notif[]; unreadCount: number },
    []
  );

  useEffect(() => {
    if (data) setUnreadCount(data.unreadCount);
  }, [data, setUnreadCount]);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  async function markAll() {
    await web.post("/api/notifications/mark-read");
    setUnreadCount(0);
    await reload();
    refreshUnread();
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Row style={{ justifyContent: "space-between" }}>
        <H2>🔔 התראות {unreadCount ? `(${unreadCount})` : ""}</H2>
        <Btn small variant="outline" title="סמן הכל כנקרא" onPress={markAll} />
      </Row>
      {data.notifications.length === 0 ? <Empty text="אין התראות חדשות." /> : null}
      {data.notifications.map((n) => {
        const unread = n.read === false || n.isRead === false;
        return (
          <Card key={n.id} onPress={() => router.push(notificationRoute(n.link) as never)} style={unread ? { borderColor: "#c97b3c", borderWidth: 2 } : undefined}>
            <ThemedText style={{ textAlign: "right", fontWeight: unread ? "700" : "500" }}>{n.text}</ThemedText>
            <Muted>{formatDateTime(toIso(n.createdAt))}</Muted>
          </Card>
        );
      })}
    </Screen>
  );
}
