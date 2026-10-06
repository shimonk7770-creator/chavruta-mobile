// src/app/explore.tsx - טאב "חשבון" - פרטי המשתמש המחובר + כפתור התנתקות, בצבעי האתר
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const theme = useTheme();

  if (!user) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          יש להתחבר קודם מהטאב "פיד"
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarLetter}>{user.fullName.charAt(0)}</ThemedText>
          </View>
        )}
        <ThemedText style={styles.name}>{user.fullName}</ThemedText>
        <ThemedText style={styles.username}>@{user.username}</ThemedText>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: theme.primary }]}
        onPress={logout}>
        <ThemedText style={[styles.logoutText, { color: theme.primary }]}>התנתקות</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  centerText: {
    textAlign: "center",
  },
  hero: {
    borderRadius: 20,
    paddingVertical: Spacing.five,
    alignItems: "center",
    gap: Spacing.one,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#ffffff",
    marginBottom: Spacing.two,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#ffffff",
    fontSize: 40,
    lineHeight: 48,
    fontWeight: 700,
  },
  name: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 700,
    textAlign: "center",
  },
  username: {
    color: "#ffffff",
    opacity: 0.85,
  },
  logoutButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  logoutText: {
    fontWeight: 700,
    fontSize: 16,
  },
});
