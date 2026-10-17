// src/app/status-view.tsx - צפייה בסטטוסים של משתמש (סטוריז): מעבר אוטומטי כל 5 שניות, הקשה לדילוג, רישום צפייה, ולבעלים - רשימת צופים ומחיקה.
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";

import { Avatar, Btn, ErrorView, Loading, Muted, Row, confirmAction } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { ThemedText } from "@/components/themed-text";
import { resolveUrl } from "@/constants/api";
import { STATUS_COLORS } from "@/constants/status-colors";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/use-responsive";


type StatusItem = { id: string; type: "text" | "image"; content?: string; mediaUrl?: string; bgColor?: string; viewers: { userId: string; userName: string }[] };
type ViewData = { targetUser: { id: string; fullName: string; avatarUrl?: string }; statuses: StatusItem[]; isOwner: boolean; myUserId: string };

const SLIDE_MS = 5000;

export default function StatusViewScreen() {
  return (
    <RequireLogin>
      <Viewer />
    </RequireLogin>
  );
}

function Viewer() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { web } = useAuth();
  const { contentMaxWidth } = useResponsive();
  const [data, setData] = useState<ViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);

  useEffect(() => {
    web
      .get<ViewData>(`/status/u/${userId}`)
      .then((res) => {
        // כשאין סטטוסים פעילים האתר מפנה לבית - ב-JSON מקבלים redirect ללא data
        if (!res.data || !res.data.statuses) setError("אין סטטוסים פעילים למשתמש הזה");
        else setData(res.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "שגיאה בטעינת הסטטוס"));
  }, [web, userId]);

  const next = useCallback(() => {
    setShowViewers(false);
    setIndex((i) => {
      if (data && i + 1 >= data.statuses.length) {
        router.replace("/");
        return i;
      }
      return i + 1;
    });
  }, [data, router]);

  const current = data?.statuses[index];

  // רישום צפייה (לא לבעלים) + מעבר אוטומטי
  useEffect(() => {
    if (!data || !current) return;
    if (!data.isOwner) web.post(`/status/${current.id}/view`).catch(() => {});
    if (showViewers) return;
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  }, [data, current, showViewers, next, web]);

  if (error) return <ErrorView message={error} />;
  if (!data || !current) return <Loading />;

  async function remove() {
    if (!current || !(await confirmAction("למחוק את הסטטוס הזה?"))) return;
    await web.post(`/status/${current.id}/delete`);
    router.replace("/");
  }

  const bg = current.type === "text" ? STATUS_COLORS[current.bgColor ?? "teal"]?.[0] ?? "#1f6f5c" : "#000";

  return (
    <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center" }}>
      <View style={{ flex: 1, width: "100%", maxWidth: Math.min(contentMaxWidth, 520), backgroundColor: bg }}>
        <Row style={{ padding: 12, gap: 4 }}>
          {data.statuses.map((s, i) => (
            <View key={s.id} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= index ? "#fff" : "rgba(255,255,255,0.35)" }} />
          ))}
        </Row>
        <Row style={{ paddingHorizontal: 12 }}>
          <Avatar name={data.targetUser.fullName} url={data.targetUser.avatarUrl} size={36} />
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>{data.targetUser.fullName}</ThemedText>
        </Row>
        <Pressable style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }} onPress={next}>
          {current.type === "image" ? (
            <>
              <Image source={{ uri: resolveUrl(current.mediaUrl) }} style={{ width: "100%", flex: 1 }} resizeMode="contain" />
              {current.content ? <ThemedText style={{ color: "#fff", fontSize: 18, textAlign: "center", marginTop: 8 }}>{current.content}</ThemedText> : null}
            </>
          ) : (
            <ThemedText style={{ color: "#fff", fontSize: 28, fontWeight: "700", textAlign: "center", lineHeight: 38 }}>{current.content}</ThemedText>
          )}
        </Pressable>
        {data.isOwner ? (
          <View style={{ padding: 12, gap: 8, backgroundColor: "rgba(0,0,0,0.35)" }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Btn small variant="outline" title={`נצפה ע"י ${current.viewers.length}`} onPress={() => setShowViewers((v) => !v)} style={{ backgroundColor: "#fff" }} />
              <Btn small variant="danger" title="מחיקה" onPress={remove} />
            </Row>
            {showViewers ? (current.viewers.length ? current.viewers.map((v) => <ThemedText key={v.userId} style={{ color: "#fff", textAlign: "right" }}>{v.userName}</ThemedText>) : <Muted>עדיין אף אחד לא צפה.</Muted>) : null}
          </View>
        ) : null}
        <Btn title="סגירה ✕" variant="ghost" onPress={() => router.replace("/")} />
      </View>
    </View>
  );
}
