"use client";

import { useCallback } from "react";
import { useLocalStorage, removeStorage } from "./use-local-storage";

const PINS_PREFIX = "unerp:tabs:pins";
const RECENT_PREFIX = "unerp:tabs:recent";
const ORDER_PREFIX = "unerp:tabs:order";
const MAX_RECENT = 5;

export interface UseTabPersistenceReturn {
  pinned: string[];
  togglePin: (tabId: string) => void;
  isPinned: (tabId: string) => boolean;
  recent: string[];
  trackRecent: (tabId: string) => void;
  customOrder: string[];
  setCustomOrder: (order: string[]) => void;
  resetOrder: () => void;
}

export function useTabPersistence(moduleId: string): UseTabPersistenceReturn {
  const [pinned, setPinned] = useLocalStorage<string[]>(
    `${PINS_PREFIX}:${moduleId}`,
    [],
  );
  const [recent, setRecent] = useLocalStorage<string[]>(
    `${RECENT_PREFIX}:${moduleId}`,
    [],
  );
  const [customOrder, setCustomOrder] = useLocalStorage<string[]>(
    `${ORDER_PREFIX}:${moduleId}`,
    [],
  );

  const togglePin = useCallback(
    (tabId: string) => {
      setPinned((prev) =>
        prev.includes(tabId)
          ? prev.filter((p) => p !== tabId)
          : [tabId, ...prev],
      );
    },
    [setPinned],
  );

  const isPinned = useCallback(
    (tabId: string) => pinned.includes(tabId),
    [pinned],
  );

  const trackRecent = useCallback(
    (tabId: string) => {
      if (!tabId || tabId === "overview") return;
      setRecent((prev) =>
        [tabId, ...prev.filter((r) => r !== tabId)].slice(0, MAX_RECENT),
      );
    },
    [setRecent],
  );

  const resetOrder = useCallback(() => {
    setCustomOrder([]);
    removeStorage(`${ORDER_PREFIX}:${moduleId}`);
  }, [moduleId, setCustomOrder]);

  return {
    pinned,
    togglePin,
    isPinned,
    recent,
    trackRecent,
    customOrder,
    setCustomOrder,
    resetOrder,
  };
}
