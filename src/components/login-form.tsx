// src/components/login-form.tsx
// טופס התחברות פשוט - אותו משתמש בדיוק כמו באתר חברותא (לא הרשמה חדשה, רק התחברות)
import { useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        חברותא
      </ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>
        התחברות
      </ThemedText>

      <TextInput
        style={styles.input}
        placeholder="אימייל"
        placeholderTextColor="#9a9a9a"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="סיסמה"
        placeholderTextColor="#9a9a9a"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loginError ? <ThemedText style={styles.error}>{loginError}</ThemedText> : null}

      <TouchableOpacity
        style={styles.button}
        disabled={isLoggingIn || !email || !password}
        onPress={() => login(email, password)}>
        {isLoggingIn ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <ThemedText style={styles.buttonText}>התחברות</ThemedText>
        )}
      </TouchableOpacity>

      <ThemedText type="small" style={styles.hint}>
        יש להתחבר עם אותו אימייל וסיסמה כמו באתר חברותא
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    textAlign: "right",
  },
  error: {
    color: "#d64545",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2f8f5b",
    borderRadius: 12,
    paddingVertical: Spacing.two + 4,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 16,
  },
  hint: {
    textAlign: "center",
    marginTop: Spacing.three,
  },
});
