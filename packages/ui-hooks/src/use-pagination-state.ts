'use client';
import { useCallback, useMemo, useState } from 'react';

export interface UsePaginationStateReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  next: () => void;
  prev: () => void;
  /** Offset for API calls (0-based). */
  offset: number;
}

/** Client pagination state; pair with server-side pagination for >20 rows. */
export function usePaginationState(totalItems: number, initialPageSize = 20): UsePaginationStateReturn {
  const [page, setPageRaw] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const setPage = useCallback(
    (p: number) => setPageRaw(Math.min(Math.max(1, p), Math.max(1, Math.ceil(totalItems / pageSize)))),
    [totalItems, pageSize],
  );
  const setPageSize = useCallback((s: number) => {
    setPageSizeRaw(s);
    setPageRaw(1);
  }, []);
  const next = useCallback(() => setPage(page + 1), [page, setPage]);
  const prev = useCallback(() => setPage(page - 1), [page, setPage]);
  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  return { page, pageSize, totalPages, setPage, setPageSize, next, prev, offset };
}
