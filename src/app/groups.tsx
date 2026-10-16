// src/app/groups.tsx - טאב "קבוצות": רשימת כל הקבוצות באתר, עם חיפוש וסינון "הקבוצות שלי".
// מקביל ל-/groups באתר (server/views/groups/index.ejs), דרך GET /api/mobile/groups. לחיצה על קבוצה פותחת את group/[id].tsx.
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { GroupCard } from "@/components/group-card";
import { LoginForm } from "@/components/login-form";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import type { Group } from "@/types/chavruta";

export default function GroupsScreen() {
  const { token, isRestoring } = useAuth();
  const theme = useTheme();

  // בזמן ששוחזרת התחברות שמורה לא מציגים את טופס ההתחברות, כדי שלא יהבהב לרגע
  if (isRestoring) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }
  if (!token) return <LoginForm />;
  return <GroupsList />;
}

function GroupsList() {
  const theme = useTheme();
  const router = useRouter();
  const { authedFetch } = useAuth();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await authedFetch<{ groups: Group[] }>("/api/mobile/groups");
      setGroups(data.groups);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בטעינת הקבוצות");
    }
  }, [authedFetch]);

  // טוענים מחדש בכל חזרה למסך (למשל אחרי הצטרפות/עזיבה בעמוד קבוצה) כדי שהתג "חבר" והמספרים יהיו עדכניים
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // סינון בצד הלקוח - רשימת הקבוצות קטנה, ואין צורך בבקשה נוספת בכל הקלדה
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (groups ?? []).filter((g) => {
      if (onlyMine && !g.isMember) return false;
      if (!needle) return true;
      return g.name.toLowerCase().includes(needle) || g.topic.toLowerCase().includes(needle);
    });
  }, [groups, query, onlyMine]);

  if (groups === null && !error) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  const chip = (selected: boolean) => [
    styles.chip,
    { borderColor: selected ? theme.secondary : theme.border, backgroundColor: selected ? theme.secondary : theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(g) => g.id}
        renderItem={({ item }) => (
          <GroupCard group={item} onPress={() => router.push({ pathname: "/group/[id]", params: { id: item.id } })} />
        )}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* משוב המרצה: הכל מרוכז תחת "בית חב״ד" - המדורים הקבועים מופיעים ראשונים (השרת מסדר אותם) */}
            <ThemedText style={[styles.title, { color: theme.secondary }]}>🕍 בית חב״ד</ThemedText>
            <TextInput
              style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
              placeholder="חיפוש קבוצה לפי שם או נושא..."
              placeholderTextColor={theme.textSecondary}
              value={query}
              onChangeText={setQuery}
            />
            <View style={styles.chips}>
              <TouchableOpacity style={chip(!onlyMine)} onPress={() => setOnlyMine(false)}>
                <ThemedText type="small" style={{ color: !onlyMine ? "#ffffff" : theme.text }}>
                  כל הקבוצות
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={chip(onlyMine)} onPress={() => setOnlyMine(true)}>
                <ThemedText type="small" style={{ color: onlyMine ? "#ffffff" : theme.text }}>
                  הקבוצות שלי
                </ThemedText>
              </TouchableOpacity>
            </View>
            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          </View>
        }
        ListEmptyComponent={
          error ? null : (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {onlyMine ? "עדיין לא הצטרפת לקבוצות. עבור ל\"כל הקבוצות\" והצטרף!" : "לא נמצאו קבוצות"}
            </ThemedText>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 700,
    textAlign: "right",
  },
  list: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
    textAlign: "right",
  },
  chips: {
    flexDirection: "row-reverse",
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "#c0392b",
    textAlign: "right",
  },
  empty: {
    textAlign: "center",
    marginTop: Spacing.five,
  },
});
