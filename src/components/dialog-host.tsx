// src/components/dialog-host.tsx - מצייר את חלונות ההודעה/אישור של lib/alert.ts (מודאל אחיד בטלפון ובדפדפן). מוצב פעם אחת ב-_layout.
import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { Btn } from "@/components/kit";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { type DialogState, registerDialogHost } from "@/lib/alert";
import { useTheme } from "@/hooks/use-theme";

export function DialogHost() {
  const theme = useTheme();
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => {
    registerDialogHost(setDialog);
    return () => registerDialogHost(null);
  }, []);

  if (!dialog) return null;
  const close = (onPress?: () => void) => {
    setDialog(null);
    onPress?.();
  };
  const cancel = dialog.buttons.find((b) => b.style === "cancel");

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => close(cancel?.onPress)}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: Spacing.three }} onPress={() => close(cancel?.onPress)}>
        <Pressable onPress={() => {}} style={{ width: "100%", maxWidth: 420, backgroundColor: theme.backgroundElement, borderRadius: 18, padding: Spacing.four, gap: Spacing.three, borderWidth: 1, borderColor: theme.border }}>
          <ThemedText style={{ fontSize: 18, fontWeight: "700", textAlign: "right" }}>{dialog.title}</ThemedText>
          {dialog.message ? <ThemedText style={{ textAlign: "right" }}>{dialog.message}</ThemedText> : null}
          <View style={{ gap: Spacing.two }}>
            {dialog.buttons.map((b, i) => (
              <Btn
                key={i}
                title={b.text}
                variant={b.style === "destructive" ? "danger" : b.style === "cancel" ? "outline" : "primary"}
                onPress={() => close(b.onPress)}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
