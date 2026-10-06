// src/app/index.tsx - טאב "פיד" - אם לא מחוברים, מציג טופס התחברות; אם כן, מציג את פיד הפוסטים
// האישי (מקביל ל-GET /feed באתר, רק דרך GET /api/mobile/feed עם טוקן - server/controllers/mobileController.js)
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";

import { LoginForm } from "@/components/login-form";
import { type FeedPost, PostCard } from "@/components/post-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

export default function FeedScreen() {
  const { token } = useAuth();

  if (!token) {
    return <LoginForm />;
  }

  return <Feed token={token} />;
}

function Feed({ token }: { token: string }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "שגיאה בטעינת הפיד");
        return;
      }
      setPosts(data.posts);
    } catch (e) {
      setError("לא ניתן להתחבר לשרת");
    }
  }, [token]);

  useEffect(() => {
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
      </ThemedView>
    );
  }

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
        ListEmptyComponent={<ThemedText style={styles.empty}>אין עדיין פוסטים בקבוצות שלך</ThemedText>}
        ListHeaderComponent={
          // כרטיס ברכה ירוק בראש הפיד - כמו ה-hero באתר
          <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
            <ThemedText style={styles.heroTitle}>שלום{user ? `, ${user.fullName}` : ""} 👋</ThemedText>
            <ThemedText style={styles.heroSubtitle}>הפוסטים האחרונים מהקבוצות שלך</ThemedText>
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
