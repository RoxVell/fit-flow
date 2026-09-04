import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { SessionForm } from "@/components/program-form/session-form";
import { removeSession, useProgramDraft } from "@/components/program-form/store";
import { Notice } from "@/components/program-form/notice";
import { useT } from "@/lib/i18n/locale-context";

// Edits one session of the shared program draft (`?id=<draft session id>`).
export default function SessionScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { draft } = useProgramDraft();
  const session = draft.sessions.find((s) => s.id === id);
  const [editing, setEditing] = useState(false);

  const confirmDelete = () => {
    if (!session) return;
    Alert.alert(t.programs.deleteSession, t.programs.deleteSessionConfirm(session.name), [
      { text: t.programs.cancel, style: "cancel" },
      {
        text: t.programs.delete,
        style: "destructive",
        onPress: () => {
          removeSession(session.id);
          router.back();
        },
      },
    ]);
  };

  const addExercise = () =>
    router.push({ pathname: "/programs/exercise-picker", params: { session: id } });

  return (
    <>
      <Stack.Title>{t.programs.editSession}</Stack.Title>
      {session ? (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button onPress={() => setEditing((value) => !value)}>
              {editing ? t.programs.done : t.programs.edit}
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
          <SessionForm
            session={session}
            editing={editing}
            onAddExercise={addExercise}
            onDelete={confirmDelete}
          />
        </>
      ) : (
        <Notice symbol="calendar.badge.exclamationmark" title={t.programs.noSessionsYet} />
      )}
    </>
  );
}
