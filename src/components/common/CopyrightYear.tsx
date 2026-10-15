"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function CopyrightYear() {
  const year = useSyncExternalStore(
    emptySubscribe,
    () => new Date().getFullYear(),
    () => 2026
  );

  return <>{year}</>;
}
