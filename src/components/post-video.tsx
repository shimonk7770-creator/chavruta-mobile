// src/components/post-video.tsx - נגן וידאו לפוסט (mp4/webm). expo-video עובד בטלפון ובדפדפן.
import { useVideoPlayer, VideoView } from "expo-video";
import { View } from "react-native";

export function PostVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });
  return (
    <View style={{ borderRadius: 12, overflow: "hidden", backgroundColor: "#000", aspectRatio: 16 / 9, width: "100%" }}>
      <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls contentFit="contain" />
    </View>
  );
}
