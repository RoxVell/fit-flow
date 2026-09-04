import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { ProgramForm } from "@/components/program-form/program-form";
import {
  addSession,
  canSaveDraft,
  isDraftDirty,
  startDraft,
  toProgramInput,
  useProgramDraft,
} from "@/components/program-form/store";
import { Notice } from "@/components/program-form/notice";
import { useT } from "@/lib/i18n/locale-context";
import { createProgram, getProgram, updateProgram } from "@/lib/repositories/programs";

// New program, or edit an existing one via `?edit=<id>`.
// Port of the web app's src/app/(main)/programs/create/page.tsx.
export default function CreateProgramScreen() {
  const t = useT();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editId = typeof edit === "string" && edit.length > 0 ? edit : null;

  // Seed the shared draft once per mount, before the first render of the form.
  const [notFound] = useState(() => {
    const program = editId ? getProgram(editId) : undefined;
    startDraft(program);
    return editId !== null && program === undefined;
  });
  const state = useProgramDraft();
  const { draft } = state;
  const canSave = !notFound && canSaveDraft(draft);

  const close = () => router.back();

  const cancel = () => {
    if (!isDraftDirty(state)) {
      close();
      return;
    }
    Alert.alert(t.programs.discardChanges, t.programs.discardChangesMessage, [
      { text: t.programs.keepEditing, style: "cancel" },
      { text: t.programs.discard, style: "destructive", onPress: close },
    ]);
  };

  const save = () => {
    if (!canSave) return;
    const input = toProgramInput(draft);
    if (editId) updateProgram(editId, input);
    else createProgram(input);
    close();
  };

  const openSession = (id: string) => router.push({ pathname: "/programs/session", params: { id } });
  const newSession = () => openSession(addSession(t.programs.sessionDefaultName));

  return (
    <>
      <Stack.Title>{editId ? t.programs.editProgram : t.programs.newProgram}</Stack.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={cancel}>{t.programs.cancel}</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button variant="done" disabled={!canSave} onPress={save}>
          {editId ? t.programs.update : t.programs.save}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      {notFound ? (
        <Notice symbol="exclamationmark.triangle" title={t.programs.programNotFound} />
      ) : (
        <ProgramForm draft={draft} onOpenSession={openSession} onAddSession={newSession} />
      )}
    </>
  );
}
