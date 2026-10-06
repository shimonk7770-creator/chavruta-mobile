// src/app/explore.tsx - טאב "חשבון" - פרטי המשתמש המחובר + כפתור התנתקות
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";

export default function AccountScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>יש להתחבר קודם מהטאב "פיד"</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <ThemedView type="backgroundElement" style={styles.avatarPlaceholder} />
        )}
        <ThemedText type="title" style={styles.name}>
          {user.fullName}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          @{user.username}
        </ThemedText>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <ThemedText style={styles.logoutText}>התנתקות</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: Spacing.two,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: Spacing.two,
  },
  name: {
    fontSize: 24,
    textAlign: "center",
  },
  logoutButton: {
    marginTop: Spacing.four,
    backgroundColor: "#d64545",
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: 700,
  },
});
