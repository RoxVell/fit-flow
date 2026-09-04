import { Button, Form, Host, LabeledContent, Picker, Section, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import Constants from "expo-constants";

import { useScheme } from "@/hooks/use-theme";
import { formatDateTime } from "@/lib/i18n/format";
import { locales, type Locale } from "@/lib/i18n/messages";
import { useSettings } from "@/lib/settings/settings-context";
import { themePreferences, type ThemePreference } from "@/lib/settings/settings-store";
import { useSyncState } from "@/lib/sync/sync-service";

const localeLabels: Record<Locale, string> = { en: "English", ru: "Русский" };

// Native SwiftUI Form (inset-grouped list), same rows as the web Settings page.
export default function SettingsScreen() {
  const { t, themePreference, setThemePreference, locale, setLocale } = useSettings();
  const scheme = useScheme();
  const { lastSyncAt, pending, syncing, flush } = useSyncState();

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
            <Text>
              {Constants.expoConfig?.version ?? "—"}
              {Constants.nativeBuildVersion ? ` (${Constants.nativeBuildVersion})` : ""}
            </Text>
          </LabeledContent>
          <LabeledContent label={t.settings.buildDate}>
            <Text>{t.common.emDash}</Text>
          </LabeledContent>
          <LabeledContent label={t.settings.lastSync}>
            <Text>{lastSyncAt ? formatDateTime(lastSyncAt, locale) : t.settings.never}</Text>
          </LabeledContent>
          {pending > 0 ? (
            <LabeledContent label={t.pwa.pendingChanges(pending)}>
              <Button
                label={syncing ? t.pwa.syncing : t.pwa.syncNow}
                systemImage="arrow.triangle.2.circlepath"
                onPress={() => void flush()}
              />
            </LabeledContent>
          ) : null}
        </Section>
      </Form>
    </Host>
  );
}
