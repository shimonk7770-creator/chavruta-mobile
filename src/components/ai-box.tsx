// src/components/ai-box.tsx
// רכיבי ה-AI של האפליקציה (Gemini דרך השרת - המפתח לעולם לא מגיע לטלפון):
//  - useAi: hook ששולח בקשת AI לשרת ומחזיק את מצב התשובה (טעינה / תשובה / שגיאה)
//  - AiAnswerBox: תיבה שמציגה את המצב הזה בצבעי האתר, כולל ההערה "ה-AI עלול לטעות"
//  - AiAskRow: שורת "שאל את ה-AI" (שדה + כפתור) - משמשת גם בקבוצה וגם בפוסט
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import type { AiAnswer } from "@/types/chavruta";

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; answer: string; disclaimer: string }
  | { status: "error"; message: string };

export function useAi() {
  const { authedFetch } = useAuth();
  const [state, setState] = useState<AiState>({ status: "idle" });

  // path = נתיב ה-AI בשרת (למשל /api/mobile/ai/posts/123/summary), body = גוף הבקשה (למשל { question })
  const run = useCallback(
    async (path: string, body?: unknown) => {
      setState({ status: "loading" });
      try {
        const data = await authedFetch<AiAnswer>(path, { method: "POST", body: body ?? {} });
        setState({ status: "done", answer: data.answer, disclaimer: data.disclaimer ?? "" });
      } catch (error) {
        setState({ status: "error", message: error instanceof Error ? error.message : "אירעה שגיאה. נסו שוב." });
      }
    },
    [authedFetch]
  );

  return { state, run, isLoading: state.status === "loading" };
}

export function AiAnswerBox({ state }: { state: AiState }) {
  const theme = useTheme();
  if (state.status === "idle") return null;

  return (
    <View style={[styles.box, { backgroundColor: theme.background, borderColor: theme.border }]}>
      {state.status === "loading" ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.secondary} />
          <ThemedText type="small" themeColor="textSecondary">
            ה-AI חושב...
          </ThemedText>
        </View>
      ) : null}
      {state.status === "error" ? <ThemedText style={styles.error}>{state.message}</ThemedText> : null}
      {state.status === "done" ? (
        <>
          <ThemedText style={styles.answer}>{state.answer}</ThemedText>
          {state.disclaimer ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
              {state.disclaimer}
            </ThemedText>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

// שורת שאלה ל-AI: שדה טקסט + כפתור "שאל". השאלה נשלחת ל-askPath עם { question }
export function AiAskRow({ askPath, placeholder }: { askPath: string; placeholder: string }) {
  const theme = useTheme();
  const { state, run, isLoading } = useAi();
  const [question, setQuestion] = useState("");
  const canSend = question.trim().length >= 3 && !isLoading;

  return (
    <View style={styles.askWrapper}>
      <View style={styles.askRow}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={question}
          onChangeText={setQuestion}
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => canSend && run(askPath, { question: question.trim() })}
        />
        <TouchableOpacity
          style={[styles.askButton, { backgroundColor: theme.secondary }, !canSend && styles.disabled]}
          disabled={!canSend}
          onPress={() => run(askPath, { question: question.trim() })}>
          <ThemedText style={styles.askButtonText}>שאל</ThemedText>
        </TouchableOpacity>
      </View>
      <AiAnswerBox state={state} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  loadingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.two,
  },
  error: {
    color: "#c0392b",
    textAlign: "right",
  },
  answer: {
    textAlign: "right",
  },
  disclaimer: {
    textAlign: "right",
    opacity: 0.8,
  },
  askWrapper: {
    gap: Spacing.two,
  },
  askRow: {
    flexDirection: "row-reverse",
    gap: Spacing.two,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    textAlign: "right",
  },
  askButton: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  askButtonText: {
    color: "#ffffff",
    fontWeight: 700,
  },
  disabled: {
    opacity: 0.5,
  },
});
