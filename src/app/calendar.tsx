// src/app/calendar.tsx - טאב "מעגל השנה" (בקרוב) - באתר: /holidays
import { ComingSoon } from '@/components/coming-soon';

export default function CalendarScreen() {
  return (
    <ComingSoon
      emoji="🕎"
      title="מעגל השנה"
      subtitle="חגים, מועדים וזמני שבת"
      features={[
        'לוח חודשי עם הדגשת ימי חג',
        'המועד הקרוב, מחושב אוטומטית לפי התאריך',
        'זמני כניסת ויציאת שבת לפי העיר שלך',
        'ארכיון חגים עם הסברים ותמונות',
      ]}
    />
  );
}
