// src/hooks/use-responsive.ts
// רספונסיביות: הממשק מתאים את עצמו לגודל המסך - טלפון (עד 640), טאבלט (עד 1024) ומחשב.
// isWide = מסך רחב מספיק לסרגל ניווט צדדי ולפריסה בכמה עמודות (כמו האתר במחשב).
import { useWindowDimensions } from "react-native";

export const BREAKPOINTS = { tablet: 640, desktop: 1024 } as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= BREAKPOINTS.tablet;
  const isWide = width >= BREAKPOINTS.desktop;
  return {
    width,
    height,
    isTablet,
    isWide,
    // כמה עמודות של כרטיסים להציג ברשימות
    columns: isWide ? 3 : isTablet ? 2 : 1,
    // רוחב מקסימלי של תוכן ממורכז, כדי שטקסט לא יימתח על פני מסך רחב מדי
    contentMaxWidth: isWide ? 1100 : 820,
  };
}
