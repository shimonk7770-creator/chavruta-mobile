// src/components/chat-view.tsx - תצוגת צ'אט משותפת לצ'אט קבוצתי ולהודעות פרטיות (בועות הודעה, "מקליד...", שליחת תמונה).
// הרכיב "טיפש": מקבל הודעות ופונקציות שליחה מההורה, וההורה מדבר עם Socket.io (ראו group-chat.tsx / dm.tsx).
import { useEffect, useRef, useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";

import { Banner } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { VoiceButton } from "@/components/voice-button";
import { resolveUrl } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { useResponsive } from "@/hooks/use-responsive";
import { formatTime, toIso } from "@/lib/format";
import { useTheme } from "@/hooks/use-theme";

export type ChatMessage = {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  imageUrl?: string;
  createdAt?: unknown;
};

export function ChatView({
  messages,
  myId,
  onSend,
  onTyping,
  onPickImage,
  typingName,
  notice,
  showSender,
  maxLength = 1000,
}: {
  messages: ChatMessage[];
  myId: string;
  onSend: (text: string) => void;
  onTyping?: () => void;
  onPickImage?: () => void;
  typingName?: string | null;
  notice?: { kind: "error" | "info"; text: string } | null;
  showSender: boolean;
  maxLength?: number;
}) {
  const theme = useTheme();
  const { contentMaxWidth } = useResponsive();
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length]);

  function submit() {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View style={{ flex: 1, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m, i) => m.id ?? `${i}-${toIso(m.createdAt)}`}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
          ListEmptyComponent={<ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: 40 }}>עדיין אין הודעות. תהיו הראשונים לכתוב!</ThemedText>}
          renderItem={({ item }) => {
            const mine = item.senderId === myId;
            return (
              <View style={{ alignItems: mine ? "flex-start" : "flex-end" }}>
                <View
                  style={{
                    maxWidth: "82%",
                    backgroundColor: mine ? theme.secondary : theme.backgroundElement,
                    borderColor: theme.border,
                    borderWidth: mine ? 0 : 1,
                    borderRadius: 16,
                    padding: Spacing.two + 2,
                    gap: 2,
                  }}>
                  {showSender && !mine ? (
                    <ThemedText type="smallBold" style={{ color: theme.primary, textAlign: "right" }}>{item.senderName}</ThemedText>
                  ) : null}
                  {item.imageUrl ? <Image source={{ uri: resolveUrl(item.imageUrl) }} style={{ width: 220, height: 220, borderRadius: 12 }} resizeMode="cover" /> : null}
                  {item.content ? <ThemedText style={{ color: mine ? "#fff" : theme.text, textAlign: "right" }}>{item.content}</ThemedText> : null}
                  <ThemedText style={{ color: mine ? "rgba(255,255,255,0.75)" : theme.textSecondary, fontSize: 11, textAlign: "left" }}>{formatTime(toIso(item.createdAt))}</ThemedText>
                </View>
              </View>
            );
          }}
        />
        {typingName ? <ThemedText type="small" themeColor="textSecondary" style={{ paddingHorizontal: Spacing.three, textAlign: "right" }}>{typingName} מקליד/ה...</ThemedText> : null}
        {notice ? <View style={{ paddingHorizontal: Spacing.three }}><Banner kind={notice.kind} text={notice.text} /></View> : null}
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: Spacing.two, padding: Spacing.two, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.backgroundElement }}>
          {onPickImage ? (
            <Pressable onPress={onPickImage} hitSlop={8}>
              <ThemedText style={{ fontSize: 24 }}>🖼️</ThemedText>
            </Pressable>
          ) : null}
          <VoiceButton onText={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))} />
          <TextInput
            value={text}
            onChangeText={(v) => {
              setText(v);
              onTyping?.();
            }}
            onSubmitEditing={submit}
            placeholder="כתבו הודעה..."
            placeholderTextColor={theme.textSecondary}
            maxLength={maxLength}
            style={{ flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, fontSize: 16, color: theme.text, textAlign: "right", backgroundColor: theme.background }}
          />
          <Pressable onPress={submit} style={{ backgroundColor: theme.primary, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 }}>
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>שלח</ThemedText>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
