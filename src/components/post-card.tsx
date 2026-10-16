// src/components/post-card.tsx
// כרטיס פוסט בודד בפיד - מקביל ל-.post-card באתר (server/views/groups/show.ejs): תגית קטגוריה צבעונית,
// כותרת ירוקה, שם קבוצה/מחבר, תוכן, ותמונה (אם יש) - בצבעי האתר
import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

export type FeedPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  groupName: string;
  authorName: string;
  imageUrls: string[];
  groupId: string;
  likeCount: number; // כמה אהבו (❤️)
  likedByMe: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  dvarTorah: "📖 דבר תורה",
  question: "❓ שאלה",
  update: "📢 עדכון",
  holiday: "🕎 חג",
};

export function PostCard({ post }: { post: FeedPost }) {
  const theme = useTheme();
  const { authedFetch } = useAuth();
  // לייק מתעדכן מיד במסך ומתוקן לפי תשובת השרת (חוזר אחורה אם הבקשה נכשלה)
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  async function toggleLike() {
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(Math.max(0, likeCount + (liked ? -1 : 1)));
    try {
      const data = await authedFetch<{ liked: boolean; likeCount: number }>(`/api/mobile/posts/${post.id}/like`, { method: "POST" });
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
    }
  }

  // צבעי התגית זהים ל-.post-category-* באתר: דבר תורה=כתום, שאלה=ירוק, עדכון/חג=ניטרלי
  const badge =
    post.category === "dvarTorah"
      ? { backgroundColor: "rgba(201, 123, 60, 0.15)", color: theme.primaryDark, borderColor: "transparent" }
      : post.category === "question"
        ? { backgroundColor: "rgba(31, 111, 92, 0.15)", color: theme.secondary, borderColor: "transparent" }
        : { backgroundColor: theme.background, color: theme.textSecondary, borderColor: theme.border };

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor }]}>
          <ThemedText style={[styles.badgeText, { color: badge.color }]}>
            {CATEGORY_LABELS[post.category] ?? post.category}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {post.authorName}
        </ThemedText>
      </View>

      <ThemedText style={[styles.title, { color: theme.secondary }]}>{post.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.group}>
        👥 {post.groupName}
      </ThemedText>
      <ThemedText style={styles.content}>{post.content}</ThemedText>

      {post.imageUrls.length > 0 ? (
        <Image source={{ uri: post.imageUrls[0] }} style={styles.image} resizeMode="cover" />
      ) : null}

      <View style={styles.likeRow}>
        <TouchableOpacity style={[styles.likeButton, { borderColor: liked ? "#d6336c" : theme.border }]} onPress={toggleLike}>
          <ThemedText type="small" style={liked ? { color: "#d6336c" } : undefined}>
            {liked ? "❤️" : "🤍"} {likeCount}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: 700,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 700,
    textAlign: "right",
  },
  group: {
    textAlign: "right",
  },
  content: {
    textAlign: "right",
  },
  likeRow: {
    flexDirection: "row-reverse",
  },
  likeButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  image: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    marginTop: Spacing.one,
  },
});
