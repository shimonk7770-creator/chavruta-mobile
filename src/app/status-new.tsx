// src/app/status-new.tsx - סטטוס חדש (סטוריז, נעלם אחרי 24 שעות): טקסט על רקע צבעוני או תמונה עם כיתוב. מקביל ל-/status/new.
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";

import { Banner, Btn, Card, Chips, Field, H1, Muted, Row, Screen } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { ThemedText } from "@/components/themed-text";
import { STATUS_COLORS } from "@/constants/status-colors";
import { useAuth } from "@/contexts/auth-context";
import { appendFile, pickImages, type PickedFile } from "@/lib/files";

export default function StatusNewScreen() {
  return (
    <RequireLogin>
      <Form />
    </RequireLogin>
  );
}

function Form() {
  const router = useRouter();
  const { web, user } = useAuth();
  const [mode, setMode] = useState<"text" | "image">("text");
  const [content, setContent] = useState("");
  const [bg, setBg] = useState("teal");
  const [image, setImage] = useState<PickedFile | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      if (mode === "text") {
        await web.post("/status/text", { content, bgColor: bg });
      } else {
        if (!image) throw new Error("יש לבחור קובץ תמונה");
        const form = new FormData();
        await appendFile(form, "statusImage", image);
        form.append("caption", caption);
        await web.upload("/status/image", form);
      }
      router.replace(`/status-view?userId=${user?.id}` as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בפרסום הסטטוס");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>סטטוס חדש</H1>
      <Muted>הסטטוס נעלם אוטומטית אחרי 24 שעות, וכל מי שצפה בו מופיע ברשימת הצופים שלך.</Muted>
      <Chips options={[{ value: "text", label: "✍️ טקסט" }, { value: "image", label: "🖼️ תמונה" }]} value={mode} onChange={setMode} />
      <Card>
        {mode === "text" ? (
          <>
            <View style={{ backgroundColor: STATUS_COLORS[bg][0], borderRadius: 16, minHeight: 160, padding: 16, justifyContent: "center" }}>
              <ThemedText style={{ color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center" }}>{content || "כתבו כאן..."}</ThemedText>
            </View>
            <Field value={content} onChangeText={setContent} multiline maxLength={300} placeholder="כתבו כאן..." />
            <Row>
              {Object.entries(STATUS_COLORS).map(([key, [c]]) => (
                <Pressable key={key} onPress={() => setBg(key)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, borderWidth: bg === key ? 3 : 0, borderColor: "#000" }} />
              ))}
            </Row>
          </>
        ) : (
          <>
            {image ? <Image source={{ uri: image.uri }} style={{ height: 240, borderRadius: 14 }} resizeMode="cover" /> : null}
            <Btn title="🖼️ בחירת תמונה" variant="outline" onPress={async () => setImage((await pickImages())[0] ?? null)} />
            <Field value={caption} onChangeText={setCaption} maxLength={300} placeholder="כיתוב קצר לתמונה..." />
          </>
        )}
        <Banner kind="error" text={error} />
        <Btn title="פרסום" loading={busy} disabled={mode === "text" ? !content.trim() : !image} onPress={publish} />
      </Card>
    </Screen>
  );
}
