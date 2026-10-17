// src/components/group-card.tsx
// כרטיס קבוצה ברשימת הקבוצות - מקביל לכרטיס הקבוצה ב-server/views/groups/index.ejs:
// תמונת קבוצה עגולה (או אות ראשונה), שם, נושא, כמות חברים, ותג "חבר"/"מנהל" אם רלוונטי.
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { resolveUrl } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Group } from "@/types/chavruta";

export function GroupAvatar({ group, size }: { group: Pick<Group, "name" | "groupPhotoUrl"> & { emoji?: string }; size: number }) {
  const theme = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (group.groupPhotoUrl) {
    return <Image source={{ uri: resolveUrl(group.groupPhotoUrl) }} style={shape} />;
  }
  // מדור של בית חב״ד מציג את האימוג'י שלו במקום האות הראשונה
  const symbol = group.emoji || (group.name || "?").trim().charAt(0);
  return (
    <View style={[shape, styles.fallback, { backgroundColor: theme.primary }]}>
      <ThemedText style={[styles.fallbackLetter, { fontSize: size * 0.45, lineHeight: size * 0.6 }]}>{symbol}</ThemedText>
    </View>
  );
}

export function GroupCard({ group, onPress }: { group: Group; onPress: () => void }) {
  const theme = useTheme();
  const tag = group.isManager ? "מנהל" : group.isMember ? "חבר" : null;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
        <GroupAvatar group={group} size={56} />
        <View style={styles.info}>
          <ThemedText style={[styles.name, { color: theme.secondary }]} numberOfLines={1}>
            {group.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rtl} numberOfLines={1}>
            {group.topic ? `${group.topic} · ` : ""}
            {group.memberCount} חברים
          </ThemedText>
        </View>
        {tag ? (
          <View style={[styles.tag, { backgroundColor: "rgba(31, 111, 92, 0.15)" }]}>
            <ThemedText style={[styles.tagText, { color: theme.secondary }]}>{tag}</ThemedText>
          </View>
        ) : null}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.two + 2,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  name: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: 700,
    textAlign: "right",
  },
  rtl: {
    textAlign: "right",
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: 700,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackLetter: {
    color: "#ffffff",
    fontWeight: 700,
  },
});
