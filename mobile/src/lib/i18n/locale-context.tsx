import { useSettings } from "@/lib/settings/settings-context";

export function useLocale() {
  const { locale, setLocale } = useSettings();
  return { locale, setLocale };
}

export function useT() {
  return useSettings().t;
}
