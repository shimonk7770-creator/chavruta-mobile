// src/app/index.tsx - טאב "פיד" - אם לא מחוברים, מציג טופס התחברות; אם כן, מציג את פיד הפוסטים
// האישי (מקביל ל-GET /feed באתר, רק דרך GET /api/mobile/feed עם טוקן - server/controllers/mobileController.js)
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoginForm } from "@/components/login-form";
import { type FeedPost, PostCard } from "@/components/post-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";

export default function FeedScreen() {
  const { token } = useAuth();

  if (!token) {
    return <LoginForm />;
  }

  return <Feed token={token} />;
}

function Feed({ token }: { token: string }) {
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
        <ActivityIndicator size="large" />
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
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<ThemedText style={styles.empty}>אין עדיין פוסטים בקבוצות שלך</ThemedText>}
        ListHeaderComponent={
          <ThemedText type="title" style={styles.header}>
            הפיד שלי
          </ThemedText>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  header: {
    fontSize: 28,
    textAlign: "center",
    marginVertical: Spacing.three,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    paddingHorizontal: Spacing.four,
    color: "#d64545",
  },
  empty: {
    textAlign: "center",
    marginTop: Spacing.five,
    opacity: 0.6,
  },
});
