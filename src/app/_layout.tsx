import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { DialogHost } from '@/components/dialog-host'; // חלונות הודעה/אישור אחידים
import { AuthProvider } from '@/contexts/auth-context'; // מצב התחברות (טוקן+משתמש) - משותף לכל המסכים
import { SocketProvider } from '@/contexts/socket-context'; // Socket.io אחד לצ'אט, הודעות והתראות בזמן אמת

// ErrorBoundary של Expo Router: אם מסך קורס בזמן רינדור, מוצגת הודעת השגיאה האמיתית עם כפתור "Try again"
// במקום המסך הכללי של Expo Go ("Something went wrong") - מקל מאוד על איתור תקלות.
export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SocketProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
          <DialogHost />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
