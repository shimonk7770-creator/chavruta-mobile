// src/components/login-form.tsx
// טופס התחברות - אותו משתמש בדיוק כמו באתר חברותא (לא הרשמה חדשה, רק התחברות), בצבעי האתר
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // סגנון משותף לשני שדות הקלט - צבעי כרטיס/מסגרת/טקסט נלקחים מהפלטה כדי שיעבדו גם במצב כהה
  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      {/* כרטיס מותג ירוק - כמו ה-hero באתר */}
      <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
        <ThemedText style={styles.heroEmoji}>📖</ThemedText>
        <ThemedText style={styles.heroTitle}>חברותא</ThemedText>
        <ThemedText style={styles.heroSubtitle}>הקהילה התורנית שלך, גם מהטלפון</ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          התחברות
        </ThemedText>

        <TextInput
          style={inputStyle}
          placeholder="אימייל"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={inputStyle}
          placeholder="סיסמה"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {loginError ? <ThemedText style={styles.error}>{loginError}</ThemedText> : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            (isLoggingIn || !email || !password) && styles.buttonDisabled,
          ]}
          disabled={isLoggingIn || !email || !password}
          onPress={() => login(email, password)}>
          {isLoggingIn ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.buttonText}>התחברות</ThemedText>
          )}
        </TouchableOpacity>

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          יש להתחבר עם אותו אימייל וסיסמה כמו באתר חברותא
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.three,
    gap: Spacing.three,
  },
  hero: {
    borderRadius: 20,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    gap: Spacing.one,
  },
  heroEmoji: {
    fontSize: 44,
    lineHeight: 56,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: 700,
  },
  heroSubtitle: {
    color: "#ffffff",
    opacity: 0.9,
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    textAlign: "right",
  },
  error: {
    color: "#c0392b",
    textAlign: "right",
  },
  button: {
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.one,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 16,
  },
  hint: {
    textAlign: "center",
  },
});
