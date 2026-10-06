// src/app/groups.tsx - טאב "קבוצות" (בקרוב) - באתר: /groups
import { ComingSoon } from '@/components/coming-soon';

export default function GroupsScreen() {
  return (
    <ComingSoon
      emoji="👥"
      title="הקבוצות שלי"
      subtitle="שיעורים, ועדים וקהילות במקום אחד"
      features={[
        'רשימת הקבוצות שאני חבר בהן, עם תמונת קבוצה',
        'עמוד קבוצה עם הפוסטים שלה (דבר תורה, שאלה, עדכון)',
        'פרסום פוסט חדש עם תמונות',
        'הצטרפות לקבוצה ועזיבתה',
        'חיפוש קבוצות לפי נושא, יום ורמה',
      ]}
    />
  );
}
