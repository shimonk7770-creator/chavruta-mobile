// src/components/login-form.tsx - התחברות / הרשמה (שני מצבים באותו טופס), בצבעי האתר.
// ההרשמה כפופה לאותם כללים כמו באתר: סיסמה של 8 תווים לפחות, אות גדולה אחת וספרה אחת (נבדק גם בשרת).
import { useState } from "react";
import { View } from "react-native";

import { Banner, Btn, Card, Chips, Field, H1, Screen } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

export function LoginForm() {
  const { login, register, isLoggingIn, loginError } = useAuth();
  const theme = useTheme();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSubmit =
    mode === "login" ? !!email && !!password : !!email && !!password && !!fullName && !!username && !!confirmPassword;

  return (
    <Screen>
      <View style={{ backgroundColor: theme.secondary, borderRadius: 20, padding: Spacing.five, alignItems: "center", gap: Spacing.one }}>
        <ThemedText style={{ fontSize: 44, lineHeight: 56 }}>📖</ThemedText>
        <ThemedText style={{ color: "#fff", fontSize: 30, lineHeight: 38, fontWeight: "700" }}>חברותא</ThemedText>
        <ThemedText style={{ color: "#fff", opacity: 0.92, textAlign: "center" }}>הקהילה התורנית שלך - בטלפון, בטאבלט ובמחשב</ThemedText>
      </View>
      <Card>
        <Chips
          options={[
            { value: "login", label: "התחברות" },
            { value: "register", label: "הרשמה" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <H1>{mode === "login" ? "התחברות" : "הצטרפות לקהילה"}</H1>
        {mode === "register" ? (
          <>
            <Field label="שם מלא" value={fullName} onChangeText={setFullName} />
            <Field label="שם משתמש" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </>
        ) : null}
        <Field label="אימייל" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field
          label="סיסמה"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          hint={mode === "register" ? "לפחות 8 תווים, אות גדולה אחת וספרה אחת" : undefined}
        />
        {mode === "register" ? <Field label="אימות סיסמה" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry /> : null}
        <Banner kind="error" text={loginError} />
        <Btn
          title={mode === "login" ? "התחברות" : "הרשמה"}
          loading={isLoggingIn}
          disabled={!canSubmit}
          onPress={() =>
            mode === "login" ? login(email, password) : register({ fullName, username, email, password, confirmPassword })
          }
        />
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center" }}>
          אותו חשבון בדיוק כמו באתר חברותא
        </ThemedText>
      </Card>
    </Screen>
  );
}
