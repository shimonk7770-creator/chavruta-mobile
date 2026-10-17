// src/lib/files.ts
// בחירת תמונה/וידאו מהמכשיר והוספתה ל-FormData (להעלאה לשרת). עובד גם בטלפון (אובייקט {uri,name,type}) וגם בדפדפן (Blob).
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type PickedFile = { uri: string; name: string; type: string };

function guessName(asset: ImagePicker.ImagePickerAsset, fallbackExt: string): string {
  if (asset.fileName) return asset.fileName;
  const fromUri = asset.uri.split("?")[0].split("/").pop() || "";
  return fromUri.includes(".") ? fromUri : `upload.${fallbackExt}`;
}

// בוחר תמונה/ות מהגלריה. multiple = כמה תמונות (עד limit)
export async function pickImages(options: { multiple?: boolean; limit?: number } = {}): Promise<PickedFile[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: !!options.multiple,
    selectionLimit: options.limit ?? (options.multiple ? 6 : 1),
    quality: 0.8,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, name: guessName(a, "jpg"), type: a.mimeType || "image/jpeg" }));
}

export async function pickVideo(): Promise<PickedFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 1 });
  if (result.canceled) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: guessName(a, "mp4"), type: a.mimeType || "video/mp4" };
}

// מוסיף קובץ ל-FormData. בדפדפן צריך Blob אמיתי (קוראים אותו מכתובת ה-blob:/data:); ב-React Native מספיק {uri,name,type}
export async function appendFile(form: FormData, field: string, file: PickedFile): Promise<void> {
  if (Platform.OS === "web") {
    const blob = await (await fetch(file.uri)).blob();
    form.append(field, blob, file.name);
    return;
  }
  // React Native מקבל אובייקט כזה כ"קובץ" ב-FormData (הטיפוס של TypeScript לא מכיר אותו)
  form.append(field, { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
}
