"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function useSearchParamTab<T extends string>(
  values: readonly T[],
  defaultValue: T,
  param = "tab"
): [T, (tab: T) => void] {
  const searchParams = useSearchParams();
  const raw = searchParams.get(param);
  const paramTab =
    raw !== null && (values as readonly string[]).includes(raw)
      ? (raw as T)
      : null;

  const [tab, setTab] = useState<T>(paramTab ?? defaultValue);
  const [prevParamTab, setPrevParamTab] = useState(paramTab);

  if (paramTab !== prevParamTab) {
    setPrevParamTab(paramTab);
    if (paramTab !== null) {
      setTab(paramTab);
    }
  }

  return [tab, setTab];
}
