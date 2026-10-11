"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * The selected row of a master–detail view, kept in `?id=` so a pick survives
 * reloads and can be linked. `replaceState` syncs with `useSearchParams`
 * without a navigation, so selecting stays instant.
 */
export function useSelectionParam(): [string | null, (id: string) => void] {
  const params = useSearchParams();
  const pathname = usePathname();
  const selectedId = params.get("id");

  const select = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params.toString());
      next.set("id", id);
      window.history.replaceState(null, "", pathname + "?" + next.toString());
    },
    [params, pathname]
  );

  return [selectedId, select];
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/**
 * Keyboard driving for a list pane: ↑/↓ (or j/k) move the selection, `/`
 * focuses the filter, Esc leaves it. Arrows keep working while the filter has
 * focus so you can type and pick without reaching for the mouse.
 */
export function useListKeyboard({
  ids,
  selectedId,
  onSelect,
  listRef,
  searchRef,
}: {
  ids: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  listRef: RefObject<HTMLElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  // Latest values for the listener, which is bound once.
  const state = useRef({ ids, selectedId, onSelect });
  useLayoutEffect(() => {
    state.current = { ids, selectedId, onSelect };
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const inSearch = event.target === searchRef.current;
      if (isEditable(event.target) && !inSearch) return;
      // A modal (command palette, dialogs) owns the keyboard while open.
      if (document.querySelector('[role="dialog"][data-open]')) return;

      if (event.key === "/" && !inSearch) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (event.key === "Escape" && inSearch) {
        searchRef.current?.blur();
        return;
      }

      const down = event.key === "ArrowDown" || (!inSearch && event.key === "j");
      const up = event.key === "ArrowUp" || (!inSearch && event.key === "k");
      if (!down && !up) return;

      const { ids, selectedId, onSelect } = state.current;
      if (ids.length === 0) return;
      event.preventDefault();
      const current = selectedId ? ids.indexOf(selectedId) : -1;
      const next =
        current === -1
          ? 0
          : Math.min(ids.length - 1, Math.max(0, current + (down ? 1 : -1)));
      if (ids[next] !== selectedId) onSelect(ids[next]);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchRef]);

  // Keep the active row visible however it was chosen (keys, deep link, click).
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
    row?.scrollIntoView({ block: "nearest" });
  }, [selectedId, listRef]);
}
