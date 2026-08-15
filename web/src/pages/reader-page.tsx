import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import type { Citation } from "../lib/types";
import { books } from "../lib/mock-data";
import { useAppStore } from "../store/app-store";
import { ReaderToolbar } from "../components/reader/reader-toolbar";
import { OutlinePanel } from "../components/reader/outline-panel";
import { AssistantPanel } from "../components/reader/assistant-panel";
import { DocumentContent } from "../components/reader/document-content";
import { cn } from "../lib/cn";

export function ReaderPage() {
  const { bookId } = useParams({ from: "/books/$bookId" });
  const book = books.find((item) => item.id === bookId) ?? books[0];
  const outlineOpen = useAppStore((state) => state.isOutlineOpen);
  const assistantOpen = useAppStore((state) => state.isAssistantOpen);
  const [activeCitation, setActiveCitation] = useState<string | null>(null);

  useEffect(() => {
    const compactReader = window.matchMedia("(max-width: 1023px)");
    const narrowReader = window.matchMedia("(max-width: 1279px)");

    function closePanelsForViewport() {
      const state = useAppStore.getState();
      if (compactReader.matches && state.isOutlineOpen) state.toggleOutline();
      if (narrowReader.matches && state.isAssistantOpen) state.toggleAssistant();
    }

    closePanelsForViewport();
    compactReader.addEventListener("change", closePanelsForViewport);
    narrowReader.addEventListener("change", closePanelsForViewport);
    return () => {
      compactReader.removeEventListener("change", closePanelsForViewport);
      narrowReader.removeEventListener("change", closePanelsForViewport);
    };
  }, []);

  if (!book) return null;

  function jumpToCitation(citation: Citation) {
    setActiveCitation(citation.id);
    document.getElementById(citation.sectionId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setActiveCitation(null), 2800);
  }

  return (
    <div className="min-h-[100dvh] bg-[#e9ebef] dark:bg-black">
      <ReaderToolbar title={book.title} />
      <OutlinePanel />
      <main
        className={cn(
          "min-h-[100dvh] px-3 pb-14 pt-22 transition-[padding] duration-300 sm:px-6 sm:pt-24",
          outlineOpen && "lg:pl-[280px]",
          assistantOpen && "xl:pr-[384px]",
        )}
      >
        <div className="reader-page mx-auto max-w-[790px] rounded-2xl bg-[var(--surface-raised)] px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16">
          <DocumentContent activeCitation={activeCitation} />
        </div>
        <div className="mx-auto mt-5 flex max-w-[790px] items-center justify-between px-2 text-[11px] text-[var(--text-tertiary)]">
          <span>RAGBOOK normalized view</span>
          <span>Page 6 of {book.pageCount}</span>
        </div>
      </main>
      <AssistantPanel onCitation={jumpToCitation} />
    </div>
  );
}
