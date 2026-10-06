// src/components/coming-soon.tsx
// מסך "בקרוב" מעוצב בפלטת חברותא - משמש לאזורים שכבר קיימים באתר ויועברו לאפליקציה בסבבים הבאים
// (קבוצות, מעגל השנה, הודעות). כל אזור מציג מה בדיוק ייכלל בו, כדי שהניווט כבר ייראה שלם.
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ComingSoonProps = {
  emoji: string;
  title: string;
  subtitle: string;
  features: string[];
};

export function ComingSoon({ emoji, title, subtitle, features }: ComingSoonProps) {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      {/* כרטיס "גיבור" ירוק - כמו ה-hero בעמודי האתר (.learning-hero) */}
      <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
        <ThemedText style={styles.heroEmoji}>{emoji}</ThemedText>
        <ThemedText style={styles.heroTitle}>{title}</ThemedText>
        <ThemedText style={styles.heroSubtitle}>{subtitle}</ThemedText>
      </View>

      <ThemedView
        type="backgroundElement"
        style={[styles.card, { borderColor: theme.border }]}>
        <View style={[styles.pill, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.pillText}>בקרוב באפליקציה</ThemedText>
        </View>
        <ThemedText type="smallBold" style={styles.cardTitle}>
          מה יהיה כאן
        </ThemedText>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <ThemedText style={[styles.check, { color: theme.secondary }]}>✓</ThemedText>
            <ThemedText style={styles.featureText}>{feature}</ThemedText>
          </View>
        ))}
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          האזור הזה כבר פועל באתר חברותא, וייכנס לאפליקציה בעדכון הבא.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  hero: {
    borderRadius: 20,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroEmoji: {
    fontSize: 48,
    lineHeight: 60,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: 700,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pill: {
    alignSelf: 'flex-end',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  pillText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: 700,
  },
  cardTitle: {
    textAlign: 'right',
    fontSize: 16,
  },
  featureRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  check: {
    fontWeight: 700,
  },
  featureText: {
    flex: 1,
    textAlign: 'right',
  },
  note: {
    textAlign: 'right',
    marginTop: Spacing.two,
  },
});
