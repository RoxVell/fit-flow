import { Form, Host, LabeledContent, Picker, Section, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import Constants from "expo-constants";

import { useScheme } from "@/hooks/use-theme";
import { locales, type Locale } from "@/lib/i18n/messages";
import { useSettings } from "@/lib/settings/settings-context";
import { themePreferences, type ThemePreference } from "@/lib/settings/settings-store";

const localeLabels: Record<Locale, string> = { en: "English", ru: "Русский" };

// Native SwiftUI Form (inset-grouped list), same rows as the web Settings page.
export default function SettingsScreen() {
  const { t, themePreference, setThemePreference, locale, setLocale } = useSettings();
  const scheme = useScheme();

  const themeLabels: Record<ThemePreference, string> = {
    system: t.settings.themeSystem,
    light: t.settings.themeLight,
    dark: t.settings.themeDark,
  };

  return (
    <Host style={{ flex: 1 }} colorScheme={scheme}>
      <Form>
        <Section title={t.settings.userInterface}>
          <Picker
            label={t.settings.theme}
            systemImage="paintpalette"
            selection={themePreference}
            onSelectionChange={setThemePreference}
            modifiers={[pickerStyle("menu")]}>
            {themePreferences.map((pref) => (
              <Text key={pref} modifiers={[tag(pref)]}>
                {themeLabels[pref]}
              </Text>
            ))}
          </Picker>
          <Picker
            label={t.settings.language}
            systemImage="globe"
            selection={locale}
            onSelectionChange={setLocale}
            modifiers={[pickerStyle("menu")]}>
            {locales.map((code) => (
              <Text key={code} modifiers={[tag(code)]}>
                {localeLabels[code]}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section title={t.settings.about}>
          <LabeledContent label={t.settings.version}>
            <Text>{Constants.expoConfig?.version ?? "—"}</Text>
          </LabeledContent>
        </Section>
      </Form>
    </Host>
  );
}
