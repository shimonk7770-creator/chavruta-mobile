// src/components/post-card.tsx
// כרטיס פוסט בודד בפיד - כותרת, תגית קטגוריה, תוכן, שם קבוצה/מחבר, ותמונה (אם יש) -
// מקביל ל-.post-card באתר (server/views/groups/show.ejs), רק כרכיב React Native
import { Image, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export type FeedPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  groupName: string;
  authorName: string;
  imageUrls: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  dvarTorah: "📖 דבר תורה",
  question: "❓ שאלה",
  update: "📢 עדכון",
  holiday: "🕎 חג",
};

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold" style={styles.category}>
        {CATEGORY_LABELS[post.category] ?? post.category}
      </ThemedText>
      <ThemedText type="subtitle" style={styles.title}>
        {post.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
        {post.groupName} · {post.authorName}
      </ThemedText>
      <ThemedText style={styles.content}>{post.content}</ThemedText>

      {post.imageUrls.length > 0 ? (
        <Image source={{ uri: post.imageUrls[0] }} style={styles.image} resizeMode="cover" />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  category: {
    color: "#2f8f5b",
    textAlign: "right",
  },
  title: {
    textAlign: "right",
  },
  meta: {
    textAlign: "right",
  },
  content: {
    textAlign: "right",
    marginTop: Spacing.one,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: Spacing.two,
  },
});
