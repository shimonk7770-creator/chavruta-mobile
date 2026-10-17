// src/components/group-post-card.tsx
// כרטיס פוסט בעמוד קבוצה - מקביל ל-.post-card ב-server/views/groups/show.ejs:
// תגית קטגוריה, כותרת, תוכן, גלריית תמונות, ומתחת שלוש פעולות: 💬 תגובות (נפתחות במקום, ללא מסך נוסף),
// ✨ AI (סיכום + שאלה על הפוסט) ו-🗑️ מחיקה (רק למי שמורשה - השרת קובע ושולח canDelete).
import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, ScrollView, Share, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { AiAnswerBox, AiAskRow, useAi } from "@/components/ai-box";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { VoiceButton } from "@/components/voice-button";
import { PostVideo } from "@/components/post-video";
import { API_BASE_URL, resolveUrl } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { Alert } from "@/lib/alert";
import { useTheme } from "@/hooks/use-theme";
import type { GroupPost, PostComment } from "@/types/chavruta";

const CATEGORY_LABELS: Record<string, string> = {
  dvarTorah: "📖 דבר תורה",
  question: "❓ שאלה",
  update: "📢 עדכון",
  holiday: "🕎 חג",
};

// תאריך קריא בעברית. אם הסביבה לא תומכת בפורמט - מחזירים מחרוזת ריקה במקום לקרוס
function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export function GroupPostCard({ post, onDeleted }: { post: GroupPost; onDeleted: (postId: string) => void }) {
  const theme = useTheme();
  const router = useRouter();
  const { authedFetch, user } = useAuth();

  // --- תגובות ---
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // --- לייק ❤️ (מתעדכן מיד במסך, ומתוקן לפי תשובת השרת) ---
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  // --- AI ---
  const [aiOpen, setAiOpen] = useState(false);
  const summary = useAi();

  async function loadComments() {
    setCommentsError(null);
    try {
      const data = await authedFetch<{ comments: PostComment[] }>(`/api/mobile/posts/${post.id}/comments`);
      setComments(data.comments);
    } catch (e) {
      setCommentsError(e instanceof Error ? e.message : "לא ניתן לטעון תגובות");
    }
  }

  function toggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    // טוענים את התגובות רק בפתיחה הראשונה (חוסך בקשות לפוסטים שאף אחד לא פותח)
    if (next && comments === null) loadComments();
  }

  async function sendComment() {
    const content = commentText.trim();
    if (!content) return;
    setSendingComment(true);
    setCommentsError(null);
    try {
      const data = await authedFetch<{ comment: PostComment }>(`/api/mobile/posts/${post.id}/comments`, {
        method: "POST",
        body: { content },
      });
      setComments((prev) => [...(prev ?? []), data.comment]);
      setCommentText("");
    } catch (e) {
      setCommentsError(e instanceof Error ? e.message : "שליחת התגובה נכשלה");
    } finally {
      setSendingComment(false);
    }
  }

  async function toggleLike() {
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(Math.max(0, likeCount + (liked ? -1 : 1)));
    try {
      const data = await authedFetch<{ liked: boolean; likeCount: number }>(`/api/mobile/posts/${post.id}/like`, { method: "POST" });
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(prev.liked); // הבקשה נכשלה - חוזרים למצב הקודם
      setLikeCount(prev.likeCount);
    }
  }

  async function toggleCommentLike(comment: PostComment) {
    try {
      const data = await authedFetch<{ liked: boolean; likeCount: number }>(`/api/mobile/comments/${comment.id}/like`, { method: "POST" });
      setComments((prev) => (prev ?? []).map((c) => (c.id === comment.id ? { ...c, likedByMe: data.liked, likeCount: data.likeCount } : c)));
    } catch (e) {
      setCommentsError(e instanceof Error ? e.message : "הלייק נכשל");
    }
  }

  // שיתוף דרך חלון השיתוף של הטלפון (וואטסאפ, הודעות וכו') - כולל קישור לפוסט באתר
  async function sharePost() {
    try {
      const snippet = post.content.length > 160 ? `${post.content.slice(0, 160)}...` : post.content;
      await Share.share({ message: `${post.title}\n${snippet}\n${API_BASE_URL}/app/group/${post.groupId}` });
    } catch {
      // המשתמש ביטל או שהשיתוף לא נתמך - אין מה לעשות
    }
  }

  // דיווח למנהל. ב-Android חלון התראה מקבל עד 3 כפתורים, ולכן שלוש הסיבות הנפוצות (ביטול = לחיצה מחוץ לחלון)
  function reportContent(targetType: "post" | "comment", targetId: string) {
    const send = async (reason: string) => {
      try {
        await authedFetch("/api/mobile/reports", { method: "POST", body: { targetType, targetId, reason } });
        Alert.alert("תודה", "הדיווח נשלח למנהל");
      } catch (e) {
        Alert.alert("הדיווח נכשל", e instanceof Error ? e.message : "נסו שוב");
      }
    };
    Alert.alert("דיווח על תוכן", "מה הבעיה?", [
      { text: "פוגעני / לא ראוי", onPress: () => send("offensive") },
      { text: "ספאם / פרסומת", onPress: () => send("spam") },
      { text: "לא מתאים למדור", onPress: () => send("offtopic") },
    ], { cancelable: true });
  }

  function confirmDeleteComment(comment: PostComment) {
    Alert.alert("מחיקת תגובה", "למחוק את התגובה?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחיקה",
        style: "destructive",
        onPress: async () => {
          try {
            await authedFetch(`/api/mobile/comments/${comment.id}`, { method: "DELETE" });
            setComments((prev) => (prev ?? []).filter((c) => c.id !== comment.id));
          } catch (e) {
            setCommentsError(e instanceof Error ? e.message : "המחיקה נכשלה");
          }
        },
      },
    ]);
  }

  function confirmDeletePost() {
    Alert.alert("מחיקת פוסט", "למחוק את הפוסט? אי אפשר לבטל.", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחיקה",
        style: "destructive",
        onPress: async () => {
          try {
            await authedFetch(`/api/mobile/posts/${post.id}`, { method: "DELETE" });
            onDeleted(post.id);
          } catch (e) {
            Alert.alert("המחיקה נכשלה", e instanceof Error ? e.message : "נסו שוב");
          }
        },
      },
    ]);
  }

  // צבעי התגית זהים לפיד: דבר תורה=כתום, שאלה=ירוק, אחר=ניטרלי
  const badge =
    post.category === "dvarTorah"
      ? { backgroundColor: "rgba(201, 123, 60, 0.15)", color: theme.primaryDark, borderColor: "transparent" }
      : post.category === "question"
        ? { backgroundColor: "rgba(31, 111, 92, 0.15)", color: theme.secondary, borderColor: "transparent" }
        : { backgroundColor: theme.background, color: theme.textSecondary, borderColor: theme.border };

  const actionStyle = [styles.action, { borderColor: theme.border }];

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor }]}>
          <ThemedText style={[styles.badgeText, { color: badge.color }]}>{CATEGORY_LABELS[post.category] ?? post.category}</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {post.authorName}
          {formatDate(post.createdAt) ? ` · ${formatDate(post.createdAt)}` : ""}
        </ThemedText>
      </View>

      <ThemedText style={[styles.title, { color: theme.secondary }]}>{post.title}</ThemedText>
      <ThemedText style={styles.content}>{post.content}</ThemedText>

      {post.imageUrls.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {post.imageUrls.map((url) => (
            <Image key={url} source={{ uri: resolveUrl(url) }} style={styles.image} resizeMode="cover" />
          ))}
        </ScrollView>
      ) : null}

      {post.videoUrl ? <PostVideo url={resolveUrl(post.videoUrl)} /> : null}

      {/* שורת הפעולות */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[...actionStyle, liked && { borderColor: "#d6336c" }]} onPress={toggleLike}>
          <ThemedText type="small" style={liked ? { color: "#d6336c" } : undefined}>
            {liked ? "❤️" : "🤍"} {likeCount}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={actionStyle} onPress={sharePost}>
          <ThemedText type="small">🔗 שתף</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={actionStyle} onPress={toggleComments}>
          <ThemedText type="small">💬 תגובות{comments ? ` (${comments.length})` : ""}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={actionStyle} onPress={() => setAiOpen((v) => !v)}>
          <ThemedText type="small">✨ AI</ThemedText>
        </TouchableOpacity>
        {post.authorId !== user?.id ? (
          <TouchableOpacity style={actionStyle} onPress={() => reportContent("post", post.id)}>
            <ThemedText type="small">🚩 דווח</ThemedText>
          </TouchableOpacity>
        ) : null}
        {post.canDelete ? (
          <TouchableOpacity style={actionStyle} onPress={() => router.push(`/post-edit?id=${post.id}` as never)}>
            <ThemedText type="small">✏️ עריכה</ThemedText>
          </TouchableOpacity>
        ) : null}
        {post.canDelete ? (
          <TouchableOpacity style={actionStyle} onPress={confirmDeletePost}>
            <ThemedText type="small" style={styles.deleteText}>
              🗑️ מחיקה
            </ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* אזור ה-AI: סיכום הפוסט + שאלה עליו */}
      {aiOpen ? (
        <View style={[styles.panel, { borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.summaryButton, { backgroundColor: theme.secondary }, summary.isLoading && styles.disabled]}
            disabled={summary.isLoading}
            onPress={() => summary.run(`/api/mobile/ai/posts/${post.id}/summary`)}>
            <ThemedText style={styles.summaryButtonText}>✨ סכם לי את הפוסט</ThemedText>
          </TouchableOpacity>
          <AiAnswerBox state={summary.state} />
          <AiAskRow askPath={`/api/mobile/ai/posts/${post.id}/ask`} placeholder="שאל את ה-AI על הפוסט..." />
        </View>
      ) : null}

      {/* אזור התגובות */}
      {commentsOpen ? (
        <View style={[styles.panel, { borderColor: theme.border }]}>
          {comments === null && !commentsError ? <ActivityIndicator color={theme.secondary} /> : null}
          {comments !== null && comments.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.rtl}>
              אין עדיין תגובות. אפשר להיות הראשון!
            </ThemedText>
          ) : null}
          {(comments ?? []).map((c) => (
            <View key={c.id} style={[styles.comment, { backgroundColor: theme.background }]}>
              <View style={styles.commentHeader}>
                <ThemedText type="smallBold">{c.authorName}</ThemedText>
                <View style={styles.commentTools}>
                  <TouchableOpacity onPress={() => toggleCommentLike(c)} hitSlop={8}>
                    <ThemedText type="small">
                      {c.likedByMe ? "❤️" : "🤍"} {c.likeCount}
                    </ThemedText>
                  </TouchableOpacity>
                  {c.authorId !== user?.id ? (
                    <TouchableOpacity onPress={() => reportContent("comment", c.id)} hitSlop={8}>
                      <ThemedText type="small">🚩</ThemedText>
                    </TouchableOpacity>
                  ) : null}
                  {c.canDelete ? (
                    <TouchableOpacity onPress={() => confirmDeleteComment(c)} hitSlop={8}>
                      <ThemedText type="small" style={styles.deleteText}>
                        ✕
                      </ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              <ThemedText type="small" style={styles.rtl}>
                {c.content}
              </ThemedText>
            </View>
          ))}
          {commentsError ? <ThemedText style={styles.error}>{commentsError}</ThemedText> : null}

          <View style={styles.commentInputRow}>
            {/* הקלטה קולית: הטקסט המתומלל מתווסף לתגובה */}
            <VoiceButton onText={(t) => setCommentText((prev) => (prev ? `${prev} ${t}` : t))} disabled={sendingComment} />
            <TextInput
              style={[styles.commentInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="כתוב תגובה..."
              placeholderTextColor={theme.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={sendComment}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.primary }, (!commentText.trim() || sendingComment) && styles.disabled]}
              disabled={!commentText.trim() || sendingComment}
              onPress={sendComment}>
              {sendingComment ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.sendButtonText}>שלח</ThemedText>}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
  content: {
    textAlign: "right",
  },
  gallery: {
    gap: Spacing.two,
  },
  image: {
    width: 220,
    height: 160,
    borderRadius: 12,
  },
  actionsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  action: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  deleteText: {
    color: "#c0392b",
  },
  panel: {
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  summaryButton: {
    borderRadius: 12,
    paddingVertical: Spacing.two + 2,
    alignItems: "center",
  },
  summaryButtonText: {
    color: "#ffffff",
    fontWeight: 700,
  },
  comment: {
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.half,
  },
  commentHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentTools: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.three,
  },
  commentInputRow: {
    flexDirection: "row-reverse",
    gap: Spacing.two,
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    textAlign: "right",
  },
  sendButton: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    minWidth: 56,
    alignItems: "center",
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: 700,
  },
  rtl: {
    textAlign: "right",
  },
  error: {
    color: "#c0392b",
    textAlign: "right",
  },
  disabled: {
    opacity: 0.5,
  },
});
