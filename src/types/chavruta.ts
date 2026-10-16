// src/types/chavruta.ts
// טיפוסי הנתונים שמגיעים משרת חברותא (server/utils/mobileSerializers.js) - מקור אחד לכל המסכים,
// כדי ששינוי בשדה בשרת יתגלה כבר בבדיקת הטיפוסים (npx tsc --noEmit) ולא רק בזמן ריצה.

// קבוצה (שורה ברשימה / כותרת עמוד קבוצה)
export type Group = {
  id: string;
  name: string;
  description: string;
  category: string;
  topic: string;
  dayOfWeek: string;
  time: string;
  level: string;
  managerId: string;
  managerName: string;
  groupPhotoUrl: string;
  sectionKey: string; // מדור בית חב״ד (ריק = קבוצה רגילה)
  emoji: string; // אימוג'י של המדור (ריק לקבוצה רגילה)
  memberCount: number;
  isMember: boolean;
  isManager: boolean;
};

// חבר קבוצה (פרטים ציבוריים בלבד)
export type GroupMember = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  isManager: boolean;
};

// קטגוריות פוסט שאפשר לפרסם מהאפליקציה (כמו באתר)
export type PostCategory = "dvarTorah" | "question" | "update";

// פוסט בעמוד קבוצה. canDelete נקבע בשרת (בעלים / מנהל קבוצה / אדמין)
export type GroupPost = {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  imageUrls: string[];
  videoUrl: string;
  aiSummary: string;
  createdAt: string; // ISO
  canDelete: boolean;
  likeCount: number; // כמה אהבו (❤️)
  likedByMe: boolean; // האם אני נתתי לייק
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string; // ISO
  canDelete: boolean;
  likeCount: number; // כמה אהבו (❤️)
  likedByMe: boolean; // האם אני נתתי לייק
};

// תשובת AI מהשרת (סיכום / שאלה)
export type AiAnswer = {
  answer: string;
  disclaimer?: string;
};
