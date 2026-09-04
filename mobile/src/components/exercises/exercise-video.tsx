import { useEvent } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View } from "react-native";

import { Radius } from "@/constants/theme";
import { useScheme, useTheme } from "@/hooks/use-theme";

type Props = {
  videoDarkUrl: string;
  videoLightUrl: string;
  poster?: string | null;
};

/** Looping muted demo clip, matching the web ExerciseVideo player. */
export function ExerciseVideo({ videoDarkUrl, videoLightUrl, poster }: Props) {
  const scheme = useScheme();
  const src = scheme === "dark" ? videoDarkUrl : videoLightUrl;
  return <ExerciseVideoPlayer key={src} src={src} poster={poster} />;
}

function ExerciseVideoPlayer({ src, poster }: { src: string; poster?: string | null }) {
  const theme = useTheme();
  const player = useVideoPlayer(src, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });
  const { status } = useEvent(player, "statusChange", { status: "loading" as const });

  const failed = status === "error";
  const posterUri = poster || undefined;
  const showPoster = Boolean(posterUri) && (failed || status !== "readyToPlay");

  if (failed && posterUri) {
    return <Image source={{ uri: posterUri }} style={styles.media} contentFit="cover" />;
  }

  return (
    <View style={[styles.wrap, { backgroundColor: theme.muted }]}>
      <VideoView player={player} style={styles.media} contentFit="cover" nativeControls={false} />
      {showPoster && posterUri ? <Image source={{ uri: posterUri }} style={styles.poster} contentFit="cover" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  media: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.lg,
  },
  poster: {
    ...StyleSheet.absoluteFill,
  },
});
