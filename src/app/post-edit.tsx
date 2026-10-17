// src/app/post-edit.tsx - עריכת פוסט: כותרת/תוכן/קטגוריה, הוספת תמונות והעלאת וידאו (בעלים / מנהל קבוצה / אדמין).
// מקביל ל-views/posts/edit.ejs: PUT /posts/:id, POST /posts/:id/images, POST /posts/:id/video.
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";

import { Banner, Btn, Card, Chips, ErrorView, Field, H1, H2, Loading, Muted, Screen } from "@/components/kit";
import { RequireLogin } from "@/components/require-login";
import { resolveUrl } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { appendFile, pickImages, pickVideo, type PickedFile } from "@/lib/files";

type PostData = { post: { id: string; groupId: string; title: string; content: string; category: string; imageUrls?: string[]; videoUrl?: string } };

const CATEGORIES = [
  { value: "dvarTorah", label: "📖 דבר תורה" },
  { value: "question", label: "❓ שאלה" },
  { value: "update", label: "📢 עדכון" },
];

export default function PostEditScreen() {
  return (
    <RequireLogin>
      <Editor />
    </RequireLogin>
  );
}

function Editor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { web } = useAuth();
  const [post, setPost] = useState<PostData["post"] | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("dvarTorah");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    web
      .get<PostData>(`/posts/${id}/edit`)
      .then((res) => {
        const p = res.data.post;
        setPost(p);
        setTitle(p.title);
        setContent(p.content);
        setCategory(p.category || "dvarTorah");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "שגיאה בטעינה"));
  }, [web, id]);

  if (!post) return error ? <ErrorView message={error} /> : <Loading />;

  const back = () => router.replace(`/group/${post.groupId}` as never);

  async function save() {
    setBusy("save");
    setError(null);
    try {
      await web.put(`/posts/${id}`, { title, content, category });
      back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בשמירה");
    } finally {
      setBusy(null);
    }
  }

  async function addImages() {
    const files: PickedFile[] = await pickImages({ multiple: true, limit: 6 });
    if (!files.length) return;
    setBusy("images");
    setError(null);
    try {
      const form = new FormData();
      for (const f of files) await appendFile(form, "images", f);
      await web.upload(`/posts/${id}/images`, form);
      setInfo(`נוספו ${files.length} תמונות`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "העלאת התמונות נכשלה");
    } finally {
      setBusy(null);
    }
  }

  async function addVideo() {
    const file = await pickVideo();
    if (!file) return;
    setBusy("video");
    setError(null);
    try {
      const form = new FormData();
      await appendFile(form, "video", file);
      await web.upload(`/posts/${id}/video`, form);
      setInfo("הוידאו הועלה");
    } catch (e) {
      setError(e instanceof Error ? e.message : "העלאת הוידאו נכשלה (mp4 / webm עד 50MB)");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <H1>עריכת פוסט</H1>
      <Card>
        <Field label="כותרת" value={title} onChangeText={setTitle} maxLength={150} />
        <Field label="תוכן" value={content} onChangeText={setContent} multiline maxLength={5000} style={{ minHeight: 140 }} />
        <Chips options={CATEGORIES} value={category} onChange={setCategory} />
        <Banner kind="error" text={error} />
        <Banner kind="success" text={info} />
        <Btn title="שמירת שינויים" loading={busy === "save"} onPress={save} />
        <Btn title="ביטול" variant="outline" onPress={back} />
      </Card>

      <H2>מדיה</H2>
      <Card>
        {post.imageUrls?.length ? (
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
            {post.imageUrls.map((u) => (
              <Image key={u} source={{ uri: resolveUrl(u) }} style={{ width: 90, height: 90, borderRadius: 10 }} />
            ))}
          </View>
        ) : (
          <Muted>אין תמונות בפוסט</Muted>
        )}
        <Btn title="🖼️ הוספת תמונות (עד 6)" variant="outline" loading={busy === "images"} onPress={addImages} />
        {post.videoUrl ? <Muted>לפוסט כבר יש וידאו - העלאה חדשה תחליף אותו.</Muted> : null}
        <Btn title="🎬 העלאת וידאו (mp4 / webm, עד 50MB)" variant="outline" loading={busy === "video"} onPress={addVideo} />
      </Card>
    </Screen>
  );
}
