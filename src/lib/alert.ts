// src/lib/alert.ts
// חלון הודעה / אישור אחיד לכל הפלטפורמות. Alert של React Native לא עובד בדפדפן (כפתורים נעלמים), ולכן כל האפליקציה משתמשת
// ב-Alert מכאן: אותו API כמו של React Native (title, message, buttons), אבל החלון עצמו מצויר ע"י components/dialog-host.tsx.
export type AlertButton = { text: string; style?: "default" | "cancel" | "destructive"; onPress?: () => void };
export type DialogState = { title: string; message?: string; buttons: AlertButton[] };

type Listener = (dialog: DialogState | null) => void;
let listener: Listener | null = null;

export function registerDialogHost(fn: Listener | null) {
  listener = fn;
}

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], _options?: { cancelable?: boolean }) {
    const finalButtons = buttons && buttons.length ? buttons : [{ text: "אישור" }];
    if (listener) listener({ title, message, buttons: finalButtons });
  },
};
