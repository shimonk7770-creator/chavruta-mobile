// src/components/app-tabs.tsx - ניווט תחתון ראשי של האפליקציה (כל אזורי האתר: פיד, קבוצות, מעגל השנה, הודעות, חשבון)
// עברנו מ-NativeTabs (שדורש קובץ תמונת אייקון נפרד לכל טאב) ל-Tabs הרגיל של expo-router:
// כך אפשר להשתמש באימוג'י כאייקונים (בדיוק כמו באתר) ולשלוט בצבעים לפי פלטת חברותא.
import { Tabs } from 'expo-router';
import { Text, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

function TabEmoji({ emoji, focused }: { emoji: string; focused: boolean }) {
  // טאב לא פעיל מעומעם מעט, כדי שהפעיל יבלוט
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        // כותרת עליונה ירוקה עם טקסט לבן - כמו ה-header של האתר (.site-header)
        headerStyle: { backgroundColor: colors.secondaryDark },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        headerTitleAlign: 'center',
        // סרגל טאבים בצבעי כרטיס האתר, והטאב הפעיל בכתום הראשי
        tabBarStyle: { backgroundColor: colors.backgroundElement, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'פיד',
          headerTitle: '📖 חברותא',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="📖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'קבוצות',
          headerTitle: 'קבוצות',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'מעגל השנה',
          headerTitle: 'מעגל השנה',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="🕎" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'הודעות',
          headerTitle: 'הודעות',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'חשבון',
          headerTitle: 'החשבון שלי',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
