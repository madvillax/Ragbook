"use client";

import { useCallback, useEffect, useState } from "react";
import { listDocuments } from "../lib/api";
import type { Book } from "../lib/types";
import { useAppStore } from "../store/app-store";

interface DocumentsState {
  data: Book[];
  error: Error | null;
  isPending: boolean;
}

const POLL_INTERVAL_MS = 2_000;

export function useDocuments() {
  const libraryRevision = useAppStore((state) => state.libraryRevision);
  const [localRevision, setLocalRevision] = useState(0);
  const [state, setState] = useState<DocumentsState>({
    data: [],
    error: null,
    isPending: true,
  });

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadDocuments() {
      controller?.abort();
      controller = new AbortController();

      try {
        const data = await listDocuments(controller.signal);
        if (!active) return;

        setState({ data, error: null, isPending: false });
        if (data.some((document) => document.status === "processing")) {
          pollTimer = setTimeout(() => void loadDocuments(), POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error : new Error("Your library could not be loaded."),
          isPending: false,
        }));
      }
    }

    void loadDocuments();

    return () => {
      active = false;
      controller?.abort();
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [libraryRevision, localRevision]);

  const refetch = useCallback(() => setLocalRevision((revision) => revision + 1), []);

  return { ...state, refetch };
}
