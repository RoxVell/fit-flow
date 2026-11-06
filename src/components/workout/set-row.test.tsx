// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { AppMotionProvider } from "@/components/providers/app-motion-provider";
import type { LoggedSet } from "@/lib/db/types";
import { SetRow } from "./set-row";

type Previous = { weight: number; reps: number } | null;
type Update = { data: Partial<LoggedSet>; options?: { propagateWeight?: boolean; baselineWeight?: number } };

function emptySet(overrides?: Partial<LoggedSet>): LoggedSet {
  return {
    id: "set-1",
    loggedExerciseId: "ex-1",
    type: "working",
    setOrder: 0,
    reps: 0,
    weight: 0,
    completed: false,
    ...overrides,
  };
}

function mountSetRow(initial?: Partial<LoggedSet>) {
  localStorage.setItem(
    "fitflow-locale",
    JSON.stringify({ state: { locale: "en" }, version: 0 })
  );
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const updates: Update[] = [];
  let current = emptySet(initial);
  let previous: Previous = null;

  const draw = () => {
    act(() => {
      root.render(
        <AppMotionProvider>
          <SetRow
            set={current}
            setNumber={1}
            exerciseName="Bench Press"
            previousSet={previous}
            onUpdate={(data, options) => {
              updates.push({ data, options });
            }}
            onRemove={() => {}}
            onComplete={() => {}}
          />
        </AppMotionProvider>
      );
    });
  };

  draw();

  const weight = () =>
    container.querySelector<HTMLInputElement>('[aria-label="Bench Press, set 1 weight (kg)"]')!;
  const reps = () =>
    container.querySelector<HTMLInputElement>('[aria-label="Bench Press, set 1 reps"]')!;

  return {
    updates,
    weight,
    reps,
    focus(input: HTMLInputElement) {
      act(() => {
        input.focus();
      });
    },
    blur(input: HTMLInputElement) {
      act(() => {
        input.blur();
      });
    },
    type(input: HTMLInputElement, value: string) {
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        setter?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    },
    setPrevious(next: Previous) {
      previous = next;
      draw();
    },
    applyUpdates() {
      current = updates.reduce((set, update) => ({ ...set, ...update.data }), current);
      updates.length = 0;
      draw();
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("SetRow previous-set prefill", () => {
  const mounted: Array<{ unmount: () => void }> = [];

  afterEach(() => {
    for (const view of mounted.splice(0)) view.unmount();
  });

  it("prefills after an early weight focus once history arrives, and blur keeps it", () => {
    const view = mountSetRow();
    mounted.push(view);

    view.focus(view.weight());
    expect(view.updates).toEqual([]);

    view.setPrevious({ weight: 80, reps: 6 });
    expect(view.updates.map((update) => update.data)).toEqual([{ weight: 80, reps: 6 }]);

    view.applyUpdates();
    expect(view.weight().value).toBe("80");
    expect(view.reps().value).toBe("6");

    view.blur(view.weight());
    expect(view.updates).toEqual([]);
    expect(view.weight().value).toBe("80");
  });

  it("prefills after an early reps focus and does not queue a zero that overwrites history", () => {
    const view = mountSetRow();
    mounted.push(view);

    view.focus(view.reps());
    view.setPrevious({ weight: 80, reps: 6 });

    expect(view.updates.map((update) => update.data)).toEqual([{ weight: 80, reps: 6 }]);
  });

  it("does not let a focus that lands before the prefill is painted wipe the copy", () => {
    const view = mountSetRow();
    mounted.push(view);

    view.setPrevious({ weight: 80, reps: 6 });
    expect(view.updates.map((update) => update.data)).toEqual([{ weight: 80, reps: 6 }]);

    view.focus(view.weight());
    view.focus(view.reps());
    expect(view.updates.map((update) => update.data)).toEqual([{ weight: 80, reps: 6 }]);

    view.applyUpdates();
    expect(view.weight().value).toBe("80");
    expect(view.reps().value).toBe("6");
  });

  it("does not overwrite a weight the user already typed", () => {
    const view = mountSetRow();
    mounted.push(view);

    view.type(view.weight(), "42");
    view.setPrevious({ weight: 80, reps: 6 });

    expect(view.updates.map((update) => update.data)).toEqual([{ weight: 42 }]);
    view.applyUpdates();
    expect(view.weight().value).toBe("42");
    expect(view.reps().value).toBe("");
  });

  it("does not overwrite a completed set", () => {
    const view = mountSetRow({ completed: true, weight: 20, reps: 5 });
    mounted.push(view);

    view.setPrevious({ weight: 80, reps: 6 });
    expect(view.updates).toEqual([]);
    expect(view.weight().value).toBe("20");
    expect(view.reps().value).toBe("5");
  });

  it("still clears a visible suggestion on focus and commits that clear on blur", () => {
    const view = mountSetRow();
    mounted.push(view);

    view.setPrevious({ weight: 80, reps: 6 });
    view.applyUpdates();

    view.focus(view.weight());
    expect(view.weight().value).toBe("");
    expect(view.updates.map((update) => update.data)).toEqual([{ weight: 0 }]);

    view.blur(view.weight());
    expect(view.updates.at(-1)).toMatchObject({
      data: { weight: 0 },
      options: { propagateWeight: true, baselineWeight: 80 },
    });
  });
});
