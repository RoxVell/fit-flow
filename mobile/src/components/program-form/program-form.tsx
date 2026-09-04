import {
  Button,
  ContentUnavailableView,
  Form,
  HStack,
  Host,
  Image,
  List,
  Section,
  Spacer,
  Stepper,
  Text,
  TextField,
  VStack,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  shapes,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";

import { useScheme, useTheme } from "@/hooks/use-theme";
import { getDayLabels } from "@/lib/i18n/format";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import {
  REST_DURATION_MAX_SECONDS,
  REST_DURATION_MIN_SECONDS,
  REST_DURATION_STEP_SECONDS,
  formatRestDuration,
} from "@/lib/workout/rest-duration";

import { removeSessionsAt, updateDraft, type DraftSession, type ProgramDraft } from "./store";

type Props = {
  draft: ProgramDraft;
  onOpenSession: (id: string) => void;
  onAddSession: () => void;
};

const secondary = foregroundStyle({ type: "hierarchical", style: "secondary" });

// Native SwiftUI Form: program info + sessions list (swipe to delete).
export function ProgramForm({ draft, onOpenSession, onAddSession }: Props) {
  const t = useT();
  const scheme = useScheme();
  // Native text state is seeded once; edits flow back through onTextChange.
  const name = useNativeState(draft.name);
  const description = useNativeState(draft.description);
  const count = draft.sessions.length;

  return (
    <Host style={{ flex: 1 }} colorScheme={scheme}>
      <Form>
        <Section title={t.programs.programInfo}>
          <TextField
            text={name}
            placeholder={t.programs.namePlaceholder}
            onTextChange={(value) => updateDraft({ name: value })}
            modifiers={[textInputAutocapitalization("sentences")]}
          />
          <TextField
            text={description}
            placeholder={t.programs.descriptionPlaceholder}
            axis="vertical"
            onTextChange={(value) => updateDraft({ description: value })}
          />
          <Stepper
            label={`${t.programs.restDuration}: ${formatRestDuration(draft.restDurationSeconds)}`}
            value={draft.restDurationSeconds}
            min={REST_DURATION_MIN_SECONDS}
            max={REST_DURATION_MAX_SECONDS}
            step={REST_DURATION_STEP_SECONDS}
            onValueChange={(value) => updateDraft({ restDurationSeconds: value })}
          />
        </Section>

        <Section title={t.programs.sessionsHeader(count)} footer={<Text>{t.programs.sessionsFooter}</Text>}>
          {count === 0 ? (
            <ContentUnavailableView title={t.programs.noSessionsYet} systemImage="calendar" />
          ) : (
            <List.ForEach onDelete={removeSessionsAt}>
              {draft.sessions.map((session) => (
                <SessionRow key={session.id} session={session} onPress={() => onOpenSession(session.id)} />
              ))}
            </List.ForEach>
          )}
          <Button
            systemImage="plus"
            label={count === 0 ? t.programs.createFirstSession : t.programs.addSession}
            onPress={onAddSession}
          />
        </Section>
      </Form>
    </Host>
  );
}

function SessionRow({ session, onPress }: { session: DraftSession; onPress: () => void }) {
  const t = useT();
  const theme = useTheme();
  const { locale } = useLocale();
  const day = getDayLabels(locale)[session.dayOfWeek % 7];
  const summary =
    session.exercises.length > 0
      ? t.programs.sessionExercises(session.exercises.length)
      : t.programs.noExercisesYet;

  return (
    <Button onPress={onPress} modifiers={[buttonStyle("plain")]}>
      <HStack spacing={12} modifiers={[contentShape(shapes.rectangle())]}>
        <VStack alignment="leading" spacing={3}>
          <Text modifiers={[font({ weight: "medium" })]}>{session.name || t.programs.sessionName}</Text>
          <HStack spacing={6}>
            <Text
              modifiers={[
                font({ textStyle: "caption", weight: "semibold" }),
                foregroundStyle(theme.primary),
              ]}>
              {day.toUpperCase()}
            </Text>
            <Text modifiers={[font({ textStyle: "footnote" }), secondary]}>{`· ${summary}`}</Text>
          </HStack>
        </VStack>
        <Spacer />
        <Image systemName="chevron.right" size={13} color={theme.textSecondary} />
      </HStack>
    </Button>
  );
}
