// src/components/new-post-form.tsx
// טופס "פרסום פוסט חדש" בעמוד קבוצה - רק לחברי הקבוצה (השרת אוכף זאת גם הוא, BR-004).
// מקביל לטופס ב-server/views/groups/show.ejs: כותרת, תוכן, וסוג פוסט (דבר תורה / שאלה / עדכון).
import { useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { VoiceButton } from "@/components/voice-button";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import type { GroupPost, PostCategory } from "@/types/chavruta";

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "dvarTorah", label: "📖 דבר תורה" },
  { value: "question", label: "❓ שאלה" },
  { value: "update", label: "📢 עדכון" },
];

export function NewPostForm({ groupId, onPosted }: { groupId: string; onPosted: (post: GroupPost) => void }) {
  const theme = useTheme();
  const { authedFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("dvarTorah");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = title.trim().length > 0 && content.trim().length > 0 && !sending;

  const inputStyle = [styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }];

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const data = await authedFetch<{ post: GroupPost }>(`/api/mobile/groups/${groupId}/posts`, {
        method: "POST",
        body: { title: title.trim(), content: content.trim(), category },
      });
      onPosted(data.post);
      setTitle("");
      setContent("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "הפרסום נכשל. נסו שוב.");
    } finally {
      setSending(false);
    }
  }

  // סגור: כפתור אחד גדול שפותח את הטופס (חוסך מקום במסך הקטן)
  if (!open) {
    return (
      <TouchableOpacity style={[styles.openButton, { backgroundColor: theme.primary }]} onPress={() => setOpen(true)}>
        <ThemedText style={styles.openButtonText}>✨ פרסום פוסט חדש</ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <ThemedText type="smallBold" style={styles.heading}>
        ✨ פרסום פוסט חדש
      </ThemedText>
      <TextInput
        style={inputStyle}
        placeholder="על מה תרצה לכתוב?"
        placeholderTextColor={theme.textSecondary}
        value={title}
        onChangeText={setTitle}
        maxLength={150}
      />
      <TextInput
        style={[...inputStyle, styles.multiline]}
        placeholder="שתף דבר תורה, שאלה, או עדכון עם הקבוצה..."
        placeholderTextColor={theme.textSecondary}
        value={content}
        onChangeText={setContent}
        maxLength={5000}
        multiline
      />

      {/* הקלטה קולית: הטקסט המתומלל מתווסף לתוכן הפוסט */}
      <View style={styles.voiceRow}>
        <VoiceButton onText={(t) => setContent((prev) => (prev ? `${prev} ${t}` : t))} disabled={sending} />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          הקלטה קולית לתוכן הפוסט
        </ThemedText>
      </View>

      <View style={styles.pills}>
        {CATEGORIES.map((c) => {
          const selected = c.value === category;
          return (
            <TouchableOpacity
              key={c.value}
              onPress={() => setCategory(c.value)}
              style={[
                styles.pill,
                { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : theme.background },
              ]}>
              <ThemedText type="small" style={{ color: selected ? "#ffffff" : theme.text }}>
                {c.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.send, { backgroundColor: theme.primary }, !canSend && styles.disabled]}
          disabled={!canSend}
          onPress={submit}>
          {sending ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.sendText}>📤 פרסום</ThemedText>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cancel, { borderColor: theme.border }]} onPress={() => setOpen(false)} disabled={sending}>
          <ThemedText type="small">ביטול</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  openButton: {
    borderRadius: 14,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  openButtonText: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  heading: {
    textAlign: "right",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
    textAlign: "right",
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  voiceRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.two,
  },
  pills: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  error: {
    color: "#c0392b",
    textAlign: "right",
  },
  actions: {
    flexDirection: "row-reverse",
    gap: Spacing.two,
    alignItems: "center",
  },
  send: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  sendText: {
    color: "#ffffff",
    fontWeight: 700,
  },
  cancel: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  disabled: {
    opacity: 0.5,
  },
});
