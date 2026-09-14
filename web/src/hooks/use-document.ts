"use client";

import { useEffect, useState } from "react";
import { getDocument } from "../lib/api";
import type { DocumentDetail } from "../lib/types";

interface DocumentState {
  data: DocumentDetail | null;
  error: Error | null;
  isPending: boolean;
}

const POLL_INTERVAL_MS = 2_000;

export function useDocument(documentId: string) {
  const [state, setState] = useState<DocumentState>({
    data: null,
    error: null,
    isPending: true,
  });

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadDocument() {
      controller?.abort();
      controller = new AbortController();

      try {
        const data = await getDocument(documentId, controller.signal);
        if (!active) return;

        setState({ data, error: null, isPending: false });
        if (data.status === "processing") {
          pollTimer = setTimeout(() => void loadDocument(), POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setState({
          data: null,
          error: error instanceof Error ? error : new Error("The document could not be loaded."),
          isPending: false,
        });
      }
    }

    void loadDocument();

    return () => {
      active = false;
      controller?.abort();
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [documentId]);

  return state;
}
