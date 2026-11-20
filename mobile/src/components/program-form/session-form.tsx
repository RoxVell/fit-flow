import {
  Button,
  ContentUnavailableView,
  Form,
  HStack,
  Host,
  List,
  Picker,
  Section,
  Spacer,
  Stepper,
  Text,
  TextField,
  VStack,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  environment,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  keyboardType,
  multilineTextAlignment,
  pickerStyle,
  tag,
  textFieldStyle,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";

import { useScheme } from "@/hooks/use-theme";
import { getExerciseName } from "@/lib/exercises/catalog";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/messages";

import {
  moveExercises,
  removeExercisesAt,
  updateExercise,
  updateSession,
  type DraftExercise,
  type DraftSession,
} from "./store";

type Props = {
  session: DraftSession;
  // SwiftUI edit mode: shows reorder handles and delete controls.
  editing: boolean;
  onAddExercise: () => void;
  onDelete: () => void;
};

// Monday-first, like the web day picker.
const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0];

function getLongDayLabels(locale: Locale): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "long" });
  // 2024-01-07 is a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const label = fmt.format(new Date(2024, 0, 7 + i));
    return label.charAt(0).toUpperCase() + label.slice(1);
  });
}

const secondary = foregroundStyle({ type: "hierarchical", style: "secondary" });

export function SessionForm({ session, editing, onAddExercise, onDelete }: Props) {
  const t = useT();
  const scheme = useScheme();
  const { locale } = useLocale();
  const dayLabels = getLongDayLabels(locale);
  const name = useNativeState(session.name);
  const count = session.exercises.length;

  return (
    <Host style={{ flex: 1 }} colorScheme={scheme}>
      <Form modifiers={[environment("editMode", editing ? "active" : "inactive")]}>
        <Section>
          <TextField
            text={name}
            placeholder={t.programs.sessionName}
            onTextChange={(value) => updateSession(session.id, { name: value })}
            modifiers={[textInputAutocapitalization("sentences")]}
          />
          <Picker
            label={t.programs.dayOfWeek}
            systemImage="calendar"
            selection={session.dayOfWeek}
            onSelectionChange={(day: number) => updateSession(session.id, { dayOfWeek: day })}
            modifiers={[pickerStyle("menu")]}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} modifiers={[tag(day)]}>
                {dayLabels[day]}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section title={t.programs.exercisesHeader(count)}>
          {count === 0 ? (
            <ContentUnavailableView title={t.programs.noExercisesYet} systemImage="dumbbell" />
          ) : (
            <List.ForEach
              onDelete={(indices) => removeExercisesAt(session.id, indices)}
              onMove={(sources, destination) => moveExercises(session.id, sources, destination)}>
              {session.exercises.map((exercise) => (
                <ExerciseRow key={exercise.id} sessionId={session.id} exercise={exercise} />
              ))}
            </List.ForEach>
          )}
          <Button systemImage="plus" label={t.programs.addExercise} onPress={onAddExercise} />
        </Section>

        <Section>
          <Button role="destructive" systemImage="trash" label={t.programs.deleteSession} onPress={onDelete} />
        </Section>
      </Form>
    </Host>
  );
}

function ExerciseRow({ sessionId, exercise }: { sessionId: string; exercise: DraftExercise }) {
  const t = useT();
  const { locale } = useLocale();
  const reps = useNativeState(exercise.targetReps);
  const name = getExerciseName(exercise.exerciseId, locale, t.programs.unknownExercise);

  return (
    <VStack alignment="leading" spacing={8}>
      <Text modifiers={[font({ weight: "medium" })]}>{name}</Text>
      <HStack spacing={12}>
        <Stepper
          label={`${t.programs.sets}: ${exercise.targetSets}`}
          value={exercise.targetSets}
          min={1}
          max={20}
          step={1}
          onValueChange={(value) => updateExercise(sessionId, exercise.id, { targetSets: value })}
          modifiers={[fixedSize()]}
        />
        <Spacer />
        <Text modifiers={[font({ textStyle: "subheadline" }), secondary]}>{t.programs.reps}</Text>
        <TextField
          text={reps}
          placeholder={t.programs.repsPlaceholder}
          onTextChange={(value) => updateExercise(sessionId, exercise.id, { targetReps: value })}
          modifiers={[
            textFieldStyle("roundedBorder"),
            frame({ width: 72 }),
            multilineTextAlignment("center"),
            keyboardType("numbers-and-punctuation"),
          ]}
        />
      </HStack>
    </VStack>
  );
}
