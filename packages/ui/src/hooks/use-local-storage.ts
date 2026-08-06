"use client";

import { useState, useCallback } from "react";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, val: T) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* quota exceeded or private browsing */
  }
}

export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback));

  const set = useCallback(
    (valOrFn: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof valOrFn === "function"
            ? (valOrFn as (p: T) => T)(prev)
            : valOrFn;
        writeStorage(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, set];
}

export function removeStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}
