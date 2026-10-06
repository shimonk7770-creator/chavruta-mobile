import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      {/* טאב ראשון: פיד הפוסטים האישי (או טופס התחברות אם עוד לא מחוברים) - src/app/index.tsx */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>פיד</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {/* טאב שני: פרטי המשתמש המחובר + התנתקות - src/app/explore.tsx */}
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>חשבון</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
