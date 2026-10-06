/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// פלטת הצבעים של חברותא - זהה בדיוק למשתני ה-CSS של האתר (server/public/css/style.css, :root ו-[data-theme="dark"]),
// כדי שהאפליקציה והאתר ייראו כמשפחה אחת: כתום-חום חם (primary), ירוק-טורקיז (secondary), ורקע קרם.
// השמות הישנים של התבנית (text/background/backgroundElement/backgroundSelected/textSecondary) נשארו
// כדי שהרכיבים הקיימים (ThemedText/ThemedView) ימשיכו לעבוד, ונוספו שמות הצבעים של האתר.
export const Colors = {
  light: {
    text: '#2b2620',
    background: '#fbf7f1', // רקע קרם חם (--color-bg)
    backgroundElement: '#ffffff', // כרטיסים (--color-surface)
    backgroundSelected: '#f1e9dc',
    textSecondary: '#6b6259', // --color-text-muted
    border: '#e7dfd3',
    primary: '#c97b3c',
    primaryDark: '#a85f27',
    secondary: '#1f6f5c',
    secondaryDark: '#16503f',
  },
  dark: {
    text: '#f0ebe3',
    background: '#1c1a17',
    backgroundElement: '#2a2723',
    backgroundSelected: '#423d36',
    textSecondary: '#b5ac9e',
    border: '#423d36',
    primary: '#e08f4f',
    primaryDark: '#c97b3c',
    secondary: '#3fa38a',
    secondaryDark: '#2c8a72',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
