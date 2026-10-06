// src/app/messages.tsx - טאב "הודעות" (בקרוב) - באתר: /messages וצ'אט הקבוצות
import { ComingSoon } from "@/components/coming-soon";

export default function MessagesScreen() {
  return (
    <ComingSoon
      emoji="💬"
      title="הודעות"
      subtitle="שיחות פרטיות וצ'אט קבוצתי בזמן אמת"
      features={[
        "צ'אט פרטי 1-על-1 עם חברי הקהילה",
        "צ'אט קבוצתי בזמן אמת (Socket.io)",
        "שליחת תמונות ואימוג'י",
        "התראות על הודעות חדשות",
      ]}
    />
  );
}
