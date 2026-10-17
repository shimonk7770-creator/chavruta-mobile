// src/app/group/[id].tsx - עמוד קבוצה בודדת: פרטים, חברים, הצטרפות/עזיבה, שאלה ל-AI על הקבוצה,
// פרסום פוסט חדש, ורשימת הפוסטים (עם תגובות ו-AI לכל פוסט). מקביל ל-server/views/groups/show.ejs באתר,
// דרך GET /api/mobile/groups/:id. המסך הזה מוסתר מסרגל הטאבים (components/app-tabs.tsx) ונפתח מרשימת הקבוצות.
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { AiAskRow } from "@/components/ai-box";
import { GroupManagerTools } from "@/components/group-manager-tools";
import { GroupAvatar } from "@/components/group-card";
import { GroupPostCard } from "@/components/group-post-card";
import { LoginForm } from "@/components/login-form";
import { NewPostForm } from "@/components/new-post-form";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { resolveUrl } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useResponsive } from "@/hooks/use-responsive";
import { Alert } from "@/lib/alert";
import { useTheme } from "@/hooks/use-theme";
import type { Group, GroupMember, GroupPost } from "@/types/chavruta";

const LEVEL_LABELS: Record<string, string> = {
  beginners: "מתחילים",
  intermediate: "בינוניים",
  advanced: "מתקדמים",
};

export default function GroupScreen() {
  const { token, isRestoring } = useAuth();
  const theme = useTheme();
  if (isRestoring) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }
  if (!token) return <LoginForm />;
  return <GroupDetails />;
}

function GroupDetails() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { authedFetch, isAdmin } = useAuth();
  const { contentMaxWidth } = useResponsive();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [membershipBusy, setMembershipBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await authedFetch<{ group: Group; members: GroupMember[]; posts: GroupPost[] }>(`/api/mobile/groups/${id}`);
      setGroup(data.group);
      setMembers(data.members);
      setPosts(data.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בטעינת הקבוצה");
    }
  }, [authedFetch, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeMembership(action: "join" | "leave") {
    setMembershipBusy(true);
    try {
      await authedFetch(`/api/mobile/groups/${id}/${action}`, { method: "POST" });
      await load(); // טוענים מחדש - רשימת החברים ויכולת הפרסום משתנות
    } catch (e) {
      Alert.alert(action === "join" ? "ההצטרפות נכשלה" : "העזיבה נכשלה", e instanceof Error ? e.message : "נסו שוב");
    } finally {
      setMembershipBusy(false);
    }
  }

  function confirmLeave() {
    Alert.alert("עזיבת הקבוצה", "לעזוב את הקבוצה?", [
      { text: "ביטול", style: "cancel" },
      { text: "עזיבה", style: "destructive", onPress: () => changeMembership("leave") },
    ]);
  }

  if (!group && !error) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }
  if (!group) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.error}>{error}</ThemedText>
        <TouchableOpacity style={[styles.retry, { borderColor: theme.primary }]} onPress={load}>
          <ThemedText style={{ color: theme.primary, fontWeight: 700 }}>ניסיון חוזר</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const meta = [group.topic, group.dayOfWeek, group.time, LEVEL_LABELS[group.level]].filter(Boolean);

  const header = (
    <View style={styles.headerWrap}>
      {/* כותרת הקבוצה - ירוקה עם תמונה עגולה, בהשראת כותרת קבוצה בוואטסאפ (כמו באתר) */}
      <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
        <GroupAvatar group={group} size={84} />
        <ThemedText style={styles.heroTitle}>{group.name}</ThemedText>
        {group.description ? <ThemedText style={styles.heroDesc}>{group.description}</ThemedText> : null}
        <ThemedText style={styles.heroMeta}>
          מנהל: {group.managerName} · {group.memberCount} חברים
        </ThemedText>
        {meta.length > 0 ? <ThemedText style={styles.heroMeta}>{meta.join(" · ")}</ThemedText> : null}
      </View>

      {/* הצטרפות / עזיבה (מנהל הקבוצה לא יכול לעזוב אותה) */}
      {group.isManager ? null : group.isMember ? (
        <TouchableOpacity style={[styles.outlineButton, { borderColor: theme.primary }]} onPress={confirmLeave} disabled={membershipBusy}>
          <ThemedText style={{ color: theme.primary, fontWeight: 700 }}>עזיבת הקבוצה</ThemedText>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.solidButton, { backgroundColor: theme.primary }, membershipBusy && styles.disabled]}
          onPress={() => changeMembership("join")}
          disabled={membershipBusy}>
          {membershipBusy ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.solidButtonText}>הצטרפות לקבוצה</ThemedText>}
        </TouchableOpacity>
      )}

      {/* צ'אט הקבוצה (חברים בלבד) */}
      {group.isMember || group.isManager ? (
        <TouchableOpacity style={[styles.outlineButton, { borderColor: theme.secondary }]} onPress={() => router.push(`/group-chat?id=${group.id}` as never)}>
          <ThemedText style={{ color: theme.secondary, fontWeight: 700 }}>💬 צ'אט הקבוצה</ThemedText>
        </TouchableOpacity>
      ) : null}

      {(group.isManager || isAdmin) ? <GroupManagerTools groupId={group.id} members={members} onChanged={load} /> : null}

      {/* חברי הקבוצה */}
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        חברי הקבוצה
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.members}>
        {members.map((m) => (
          <View key={m.id} style={styles.member}>
            {m.avatarUrl ? (
              <Image source={{ uri: resolveUrl(m.avatarUrl) }} style={styles.memberAvatar} />
            ) : (
              <View style={[styles.memberAvatar, styles.memberFallback, { backgroundColor: theme.secondary }]}>
                <ThemedText style={styles.memberLetter}>{(m.fullName || "?").trim().charAt(0)}</ThemedText>
              </View>
            )}
            <ThemedText type="small" numberOfLines={1} style={styles.memberName}>
              {m.fullName}
            </ThemedText>
            {m.isManager ? (
              <ThemedText type="small" style={{ color: theme.primary, fontSize: 11, lineHeight: 14 }}>
                מנהל
              </ThemedText>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {/* שאל את ה-AI על הקבוצה (דרישת המרצה #2) */}
      <ThemedView type="backgroundElement" style={[styles.aiCard, { borderColor: theme.border }]}>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          🤖 שאל את ה-AI על הקבוצה
        </ThemedText>
        <AiAskRow askPath={`/api/mobile/ai/groups/${group.id}/ask`} placeholder="למשל: על מה למדנו לאחרונה?" />
      </ThemedView>

      {group.isMember ? <NewPostForm groupId={group.id} onPosted={(p, needsReload) => (needsReload ? load() : setPosts((prev) => [p, ...prev]))} /> : null}

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        פוסטים בקבוצה
      </ThemedText>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ThemedView style={styles.screen}>
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <GroupPostCard post={item} onDeleted={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              עדיין אין פוסטים בקבוצה
            </ThemedText>
          }
          contentContainerStyle={[styles.list, { maxWidth: contentMaxWidth, width: "100%", alignSelf: "center" }]}
          keyboardShouldPersistTaps="handled"
        />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  headerWrap: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  error: {
    color: "#c0392b",
    textAlign: "center",
  },
  retry: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  hero: {
    borderRadius: 20,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    gap: Spacing.one,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 700,
    textAlign: "center",
    marginTop: Spacing.one,
  },
  heroDesc: {
    color: "#ffffff",
    opacity: 0.92,
    textAlign: "center",
  },
  heroMeta: {
    color: "#ffffff",
    opacity: 0.85,
    textAlign: "center",
    fontSize: 14,
  },
  solidButton: {
    borderRadius: 14,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  solidButtonText: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 16,
  },
  outlineButton: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: Spacing.two + 2,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    textAlign: "right",
    fontSize: 16,
  },
  members: {
    flexDirection: "row-reverse",
    gap: Spacing.three,
  },
  member: {
    alignItems: "center",
    width: 64,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  memberLetter: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 26,
  },
  memberName: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
  },
  aiCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  empty: {
    textAlign: "center",
    marginTop: Spacing.four,
  },
});
