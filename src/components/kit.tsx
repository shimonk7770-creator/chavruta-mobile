// src/components/ui.tsx
// ספריית הרכיבים המשותפת של כל מסכי האפליקציה, בצבעי האתר (ראו constants/theme.ts) וברספונסיביות מלאה:
// כל הרכיבים מותאמים לעברית (כיוון מימין לשמאל: row-reverse + יישור טקסט לימין), ו-Screen ממרכז את התוכן
// ברוחב מקסימלי כדי שבמסך רחב (מחשב) הוא לא יימתח, ובטלפון הוא תופס את כל הרוחב.
import { createElement, type ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Alert } from "@/lib/alert";
import { Spacing } from "@/constants/theme";
import { resolveUrl } from "@/constants/api";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";

// ---------- מסך ----------
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  style,
  keyboardShouldPersistTaps = "handled",
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
  keyboardShouldPersistTaps?: "handled" | "always" | "never";
}) {
  const theme = useTheme();
  const { contentMaxWidth } = useResponsive();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.screenContent, { maxWidth: contentMaxWidth }, style]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} /> : undefined}>
      {children}
    </ScrollView>
  );
}

// ---------- טקסט ----------
export function H1({ children, color }: { children: ReactNode; color?: string }) {
  const theme = useTheme();
  return <ThemedText style={[styles.h1, { color: color ?? theme.secondary }]}>{children}</ThemedText>;
}
export function H2({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <ThemedText style={[styles.h2, { color: theme.secondary }]}>{children}</ThemedText>;
}
export function Muted({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={[styles.rtl, style]}>
      {children}
    </ThemedText>
  );
}
export function Body({ children, style }: { children: ReactNode; style?: object }) {
  return <ThemedText style={[styles.rtl, style]}>{children}</ThemedText>;
}

// ---------- כרטיס ----------
export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const theme = useTheme();
  const content = (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>{children}</View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}>
      {content}
    </Pressable>
  );
}

// כרטיס "גיבור" ירוק בראש מסך (כמו ה-hero באתר)
export function Hero({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
      <ThemedText style={styles.heroTitle}>{title}</ThemedText>
      {subtitle ? <ThemedText style={styles.heroSubtitle}>{subtitle}</ThemedText> : null}
      {children}
    </View>
  );
}

// ---------- כפתור ----------
export function Btn({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  small = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const bg = { primary: theme.primary, secondary: theme.secondary, outline: "transparent", danger: "#c0392b", ghost: "transparent" }[variant];
  const fg = variant === "outline" ? theme.primary : variant === "ghost" ? theme.secondary : "#ffffff";
  const border = variant === "outline" ? theme.primary : "transparent";
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg, borderColor: border },
        inactive && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <ThemedText style={[styles.btnText, small && { fontSize: 14 }, { color: fg }]}>{title}</ThemedText>}
    </Pressable>
  );
}

// ---------- שדות ----------
export function Field({
  label,
  hint,
  style,
  ...input
}: TextInputProps & { label?: string; hint?: string; style?: object }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      {label ? <ThemedText type="smallBold" style={styles.rtl}>{label}</ThemedText> : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        {...input}
        style={[
          styles.input,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text },
          input.multiline && { minHeight: 90, textAlignVertical: "top" },
          style,
        ]}
      />
      {hint ? <Muted>{hint}</Muted> : null}
    </View>
  );
}

// שדה תאריך (YYYY-MM-DD). בדפדפן - בורר תאריכים אמיתי; בטלפון - הקלדה בפורמט קבוע (בלי תלות בספרייה נוספת)
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const theme = useTheme();
  if (Platform.OS === "web") {
    return (
      <View style={styles.field}>
        <ThemedText type="smallBold" style={styles.rtl}>{label}</ThemedText>
        {createElement("input", {
          type: "date",
          value,
          onChange: (e: { target: { value: string } }) => onChange(e.target.value),
          style: {
            padding: 12,
            fontSize: 16,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.backgroundElement,
            color: theme.text,
            direction: "rtl",
          },
        })}
      </View>
    );
  }
  return <Field label={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} />;
}

export function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <Field label={label} value={value} onChangeText={onChange} placeholder="HH:MM  (למשל 18:30)" keyboardType="numbers-and-punctuation" maxLength={5} />;
}

// ---------- בחירה ----------
export type Option<T extends string = string> = { value: T; label: string };

// שורת "צ'יפים" - בחירה אחת מתוך מעט אפשרויות
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.chip,
              { borderColor: selected ? theme.secondary : theme.border, backgroundColor: selected ? theme.secondary : theme.backgroundElement },
            ]}>
            <ThemedText type="small" style={{ color: selected ? "#ffffff" : theme.text }}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// רשימה נפתחת - בחירה אחת מתוך הרבה אפשרויות (למשל עיר מתוך 21)
export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={styles.field}>
      {label ? <ThemedText type="smallBold" style={styles.rtl}>{label}</ThemedText> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.input, styles.selectBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText style={styles.rtl}>{current ? current.label : "בחרו..."}</ThemedText>
        <ThemedText themeColor="textSecondary">▾</ThemedText>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onPress={() => {}}>
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={[styles.modalItem, { borderBottomColor: theme.border }, o.value === value && { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText style={styles.rtl}>{o.label}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------- מצבים ----------
export function Loading({ text }: { text?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.primary} />
      {text ? <Muted style={{ marginTop: Spacing.two, textAlign: "center" }}>{text}</Muted> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <ThemedText style={styles.errorText}>{message}</ThemedText>
      {onRetry ? <Btn title="נסו שוב" variant="outline" onPress={onRetry} small style={{ marginTop: Spacing.three }} /> : null}
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return <Muted style={styles.empty}>{text}</Muted>;
}

// הודעת הצלחה / שגיאה בתוך מסך
export function Banner({ kind, text }: { kind: "error" | "success" | "info"; text?: string | null }) {
  if (!text) return null;
  const colors = {
    error: { bg: "rgba(192,57,43,0.12)", fg: "#c0392b" },
    success: { bg: "rgba(31,111,92,0.14)", fg: "#1f6f5c" },
    info: { bg: "rgba(201,123,60,0.14)", fg: "#a85f27" },
  }[kind];
  return (
    <View style={[styles.banner, { backgroundColor: colors.bg }]}>
      <ThemedText type="small" style={[styles.rtl, { color: colors.fg }]}>
        {text}
      </ThemedText>
    </View>
  );
}

// ---------- אווטאר ותגים ----------
export function Avatar({ name, url, size = 44 }: { name?: string; url?: string; size?: number }) {
  const theme = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  const src = resolveUrl(url);
  if (src) return <Image source={{ uri: src }} style={shape} />;
  return (
    <View style={[shape, styles.avatarFallback, { backgroundColor: theme.primary }]}>
      <ThemedText style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.42, lineHeight: size * 0.6 }}>
        {(name || "?").trim().charAt(0)}
      </ThemedText>
    </View>
  );
}

export function Badge({ text, tone = "green" }: { text: string; tone?: "green" | "orange" | "gray" | "red" }) {
  const tones = {
    green: { bg: "rgba(31,111,92,0.15)", fg: "#1f6f5c" },
    orange: { bg: "rgba(201,123,60,0.18)", fg: "#a85f27" },
    gray: { bg: "rgba(120,110,100,0.15)", fg: "#6b6259" },
    red: { bg: "rgba(192,57,43,0.14)", fg: "#c0392b" },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: tones.bg }]}>
      <ThemedText style={{ color: tones.fg, fontSize: 12, lineHeight: 18, fontWeight: "700" }}>{text}</ThemedText>
    </View>
  );
}

// שורה מימין לשמאל
export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

// רשת רספונסיבית: כרטיסים בעמודה אחת בטלפון, שתיים בטאבלט, שלוש במחשב
export function Grid({ children }: { children: ReactNode[] | ReactNode }) {
  const { columns } = useResponsive();
  const items = Array.isArray(children) ? children : [children];
  return (
    <View style={styles.grid}>
      {items.map((child, i) => (
        <View key={i} style={{ width: `${100 / columns}%`, padding: Spacing.one }}>
          {child}
        </View>
      ))}
    </View>
  );
}

// אישור לפני פעולה הרסנית (מחיקה): חלון אחיד בכל הפלטפורמות (lib/alert.ts)
export function confirmAction(title: string, message = ""): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "ביטול", style: "cancel", onPress: () => resolve(false) },
      { text: "אישור", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

const styles = StyleSheet.create({
  screenContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: "100%",
    alignSelf: "center",
  },
  h1: { fontSize: 24, lineHeight: 32, fontWeight: "700", textAlign: "right" },
  h2: { fontSize: 19, lineHeight: 26, fontWeight: "700", textAlign: "right" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  card: { borderRadius: 16, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  hero: { borderRadius: 20, padding: Spacing.four, alignItems: "center", gap: Spacing.one },
  heroTitle: { color: "#ffffff", fontSize: 22, lineHeight: 30, fontWeight: "700", textAlign: "center" },
  heroSubtitle: { color: "#ffffff", opacity: 0.92, textAlign: "center" },
  btn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  btnSmall: { paddingVertical: 8, paddingHorizontal: Spacing.three, minHeight: 36, borderRadius: 10 },
  btnText: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 11,
    fontSize: 16,
    textAlign: "right",
    writingDirection: "rtl",
  },
  selectBox: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  chips: { flexDirection: "row-reverse", flexWrap: "wrap", gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: Spacing.three },
  modalSheet: { width: "100%", maxWidth: 420, maxHeight: "75%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  modalItem: { padding: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.four },
  errorText: { color: "#c0392b", textAlign: "center" },
  empty: { textAlign: "center", marginVertical: Spacing.four },
  banner: { borderRadius: 12, padding: Spacing.three },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  badge: { borderRadius: 999, paddingHorizontal: Spacing.two + 2, paddingVertical: 2, alignSelf: "flex-start" },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: Spacing.two },
  grid: { flexDirection: "row-reverse", flexWrap: "wrap", marginHorizontal: -Spacing.one },
});
