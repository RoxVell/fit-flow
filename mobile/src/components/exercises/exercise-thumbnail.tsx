import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  uri: string | null;
  style?: StyleProp<ViewStyle>;
  symbolSize?: number;
  contentFit?: "cover" | "contain";
};

// Remote thumbnail with a dumbbell fallback (mirrors the web ExerciseThumbnail).
export function ExerciseThumbnail({ uri, style, symbolSize = 20, contentFit = "cover" }: Props) {
  const theme = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = uri !== null && uri !== failedUri;

  return (
    <View style={[styles.box, { backgroundColor: theme.muted }, style]}>
      {showImage ? (
        <Image
          source={{ uri }}
          recyclingKey={uri}
          contentFit={contentFit}
          cachePolicy="memory-disk"
          transition={150}
          style={StyleSheet.absoluteFill}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <SymbolView name="dumbbell" size={symbolSize} tintColor={theme.textSecondary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: Radius.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
