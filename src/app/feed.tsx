// src/app/index.tsx - טאב "פיד" - אם לא מחוברים, מציג טופס התחברות; אם כן, מציג את פיד הפוסטים
// האישי (מקביל ל-GET /feed באתר, רק דרך GET /api/mobile/feed עם טוקן - server/controllers/mobileController.js)
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";

import { LoginForm } from "@/components/login-form";
import { type FeedPost, PostCard } from "@/components/post-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

export default function FeedScreen() {
  const { token, isRestoring } = useAuth();
  const theme = useTheme();

  // בזמן ששוחזרת התחברות שמורה (מהכספת של הטלפון) לא מציגים את טופס ההתחברות, כדי שלא יהבהב לרגע
  if (isRestoring) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!token) {
    return <LoginForm />;
  }

  return <Feed />;
}

function Feed() {
  const { user, authedFetch } = useAuth();
  const theme = useTheme();
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // שתי לשוניות כמו באתר: "שלי" (הקבוצות שלי) / "הקהילה" (כל הפוסטים האחרונים בבית חב״ד)
  const [tab, setTab] = useState<"mine" | "community">("mine");

  // authedFetch מוסיפה את הטוקן, ואם השרת עונה 401 (טוקן שפג) מנקה את ההתחברות ומחזירה למסך ההתחברות
  const loadFeed = useCallback(async () => {
    setError(null);
    try {
      const data = await authedFetch<{ posts: FeedPost[] }>(`/api/mobile/feed?tab=${tab}`);
      setPosts(data.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בטעינת הפיד");
    }
  }, [authedFetch, tab]);

  useEffect(() => {
    setPosts(null); // בהחלפת לשונית מציגים טעינה במקום הפוסטים של הלשונית הקודמת
    loadFeed();
  }, [loadFeed]);

  async function onRefresh() {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }

  if (posts === null && !error) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity onPress={loadFeed} style={styles.retry}>
          <ThemedText type="small">נסה שוב</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const chip = (selected: boolean) => [
    styles.chip,
    { borderColor: selected ? theme.secondary : theme.border, backgroundColor: selected ? theme.secondary : theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <ThemedText style={styles.empty}>{tab === "mine" ? "אין עדיין פוסטים בקבוצות שלך. הצטרף למדור בבית חב״ד!" : "עדיין לא פורסמו פוסטים"}</ThemedText>
        }
        ListHeaderComponent={
          // כרטיס ברכה ירוק בראש הפיד - כמו ה-hero באתר
          <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
            <ThemedText style={styles.heroTitle}>שלום{user ? `, ${user.fullName}` : ""} 👋</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              {tab === "mine" ? "הפוסטים האחרונים מהקבוצות שלך" : "כל מה שקורה עכשיו בבית חב״ד"}
            </ThemedText>
            <View style={styles.chips}>
              <TouchableOpacity style={chip(tab === "mine")} onPress={() => setTab("mine")}>
                <ThemedText type="small" style={{ color: tab === "mine" ? "#ffffff" : theme.text }}>
                  👤 שלי
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={chip(tab === "community")} onPress={() => setTab("community")}>
                <ThemedText type="small" style={{ color: tab === "community" ? "#ffffff" : theme.text }}>
                  🌍 הקהילה
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  hero: {
    borderRadius: 20,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    alignItems: "center",
    gap: Spacing.one,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 22,
    lineHeight: 30,
    fontWeight: 700,
    textAlign: "center",
  },
  heroSubtitle: {
    color: "#ffffff",
    opacity: 0.9,
    textAlign: "center",
  },
  chips: {
    flexDirection: "row-reverse",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  retry: {
    marginTop: Spacing.three,
    padding: Spacing.two,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    paddingHorizontal: Spacing.four,
    color: "#c0392b",
  },
  empty: {
    textAlign: "center",
    marginTop: Spacing.five,
    opacity: 0.6,
  },
});
