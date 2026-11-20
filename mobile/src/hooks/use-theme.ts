import { useColorScheme } from "react-native";

import { Colors, type ColorScheme, type ThemeColors } from "@/constants/theme";

export function useScheme(): ColorScheme {
  const scheme = useColorScheme();
  return scheme === "dark" ? "dark" : "light";
}

export function useTheme(): ThemeColors {
  return Colors[useScheme()];
}
