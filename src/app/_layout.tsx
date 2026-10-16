import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/contexts/auth-context'; // מצב התחברות (טוקן+משתמש) - משותף לכל הטאבים

// ErrorBoundary של Expo Router: אם מסך קורס בזמן רינדור, מוצגת הודעת השגיאה האמיתית עם כפתור "Try again"
// במקום המסך הכללי של Expo Go ("Something went wrong") - מקל מאוד על איתור תקלות.
export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
      </AuthProvider>
    </ThemeProvider>
  );
}
