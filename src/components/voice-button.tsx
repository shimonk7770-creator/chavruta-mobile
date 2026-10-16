// src/components/voice-button.tsx
// כפתור 🎤 להקלטת קול ותמלול לטקסט (שרת: POST /api/mobile/ai/transcribe, Gemini). לחיצה ראשונה מתחילה הקלטה,
// לחיצה שנייה עוצרת, שולחת לשרת, ומעבירה את הטקסט שהתקבל ל-onText (בדרך כלל: מוסיפים אותו לשדה הטקסט).
// חשוב: expo-audio נטען בצורה "זהירה" (require בתוך try) - אם החבילה עדיין לא הותקנה האפליקציה לא קורסת,
// והכפתור פשוט מציג הודעה מה צריך להתקין. כך מסך ה"Something went wrong" לא חוזר בגלל תלות חסרה.
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { API_BASE_URL } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

// טעינה בטוחה של expo-audio (מחזיר null אם לא מותקן)
function loadAudioModule(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-audio");
  } catch {
    return null;
  }
}

const MAX_SECONDS = 60; // מגבלת השרת: עד כדקה

type Props = {
  onText: (text: string) => void; // מקבל את הטקסט המתומלל
  disabled?: boolean;
};

export function VoiceButton({ onText, disabled }: Props) {
  const theme = useTheme();
  const { token } = useAuth();
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const recorderRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ניקוי טיימר ביציאה מהמסך
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      try {
        recorderRef.current?.stop?.();
      } catch {
        // המקליט כבר נעצר - אין מה לעשות
      }
    };
  }, []);

  async function start() {
    const audio = loadAudioModule();
    if (!audio) {
      Alert.alert("הקלטה קולית", "חסרה החבילה expo-audio. הריצו בטרמינל: npx expo install expo-audio");
      return;
    }
    try {
      const perm = await audio.AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("אין הרשאה", "יש לאשר גישה למיקרופון בהגדרות המכשיר כדי להקליט.");
        return;
      }
      await audio.setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      // יוצרים מקליט ידנית (לא Hook) כי הרכיב נטען רק כשצריך
      const recorder = new audio.AudioModule.AudioRecorder(audio.RecordingPresets.HIGH_QUALITY);
      await recorder.prepareToRecordAsync();
      recorder.record();
      recorderRef.current = recorder;
      setState("recording");
      // עצירה אוטומטית אחרי דקה
      timerRef.current = setTimeout(() => void stopAndSend(), MAX_SECONDS * 1000);
    } catch (e) {
      setState("idle");
      Alert.alert("הקלטה נכשלה", e instanceof Error ? e.message : "לא ניתן להתחיל הקלטה.");
    }
  }

  async function stopAndSend() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    recorderRef.current = null;
    setState("transcribing");
    try {
      await recorder.stop();
      const uri: string | null = recorder.uri;
      if (!uri) throw new Error("ההקלטה ריקה. נסו שוב.");

      // שליחה כ-multipart: השדה "audio" (כך השרת מצפה). ב-React Native מעבירים אובייקט {uri,name,type}
      const form = new FormData();
      form.append("audio", { uri, name: "voice.m4a", type: "audio/m4a" } as unknown as Blob);
      const res = await fetch(`${API_BASE_URL}/api/mobile/ai/transcribe`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; text?: string; message?: string };
      if (!res.ok || !data.text) throw new Error(data.message || "התמלול נכשל. נסו שוב.");
      onText(data.text);
    } catch (e) {
      Alert.alert("תמלול", e instanceof Error ? e.message : "התמלול נכשל. נסו שוב.");
    } finally {
      setState("idle");
    }
  }

  const recording = state === "recording";
  return (
    <TouchableOpacity
      accessibilityLabel={recording ? "עצור הקלטה" : "הקלטה קולית"}
      disabled={disabled || state === "transcribing"}
      onPress={recording ? () => void stopAndSend() : () => void start()}
      style={[
        styles.button,
        { borderColor: recording ? "#c0392b" : theme.border, backgroundColor: recording ? "#c0392b" : theme.background },
        disabled && styles.disabled,
      ]}>
      {state === "transcribing" ? (
        <ActivityIndicator size="small" />
      ) : (
        <ThemedText style={{ color: recording ? "#ffffff" : theme.text }}>{recording ? "⏹" : "🎤"}</ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
});
