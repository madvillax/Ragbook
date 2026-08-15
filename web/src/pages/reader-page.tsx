import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Clock, WarningCircle } from "@phosphor-icons/react";
import { getDocument } from "../lib/api";
import type { Citation } from "../lib/types";
import { useAppStore } from "../store/app-store";
import { ReaderToolbar } from "../components/reader/reader-toolbar";
import { OutlinePanel } from "../components/reader/outline-panel";
import { AssistantPanel } from "../components/reader/assistant-panel";
import { DocumentContent } from "../components/reader/document-content";
import { cn } from "../lib/cn";

function ReaderMessage({ title, detail, warning = false }: { title: string; detail: string; warning?: boolean }) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#e9ebef] p-6 dark:bg-black">
      <div className="max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] p-8 text-center shadow-[var(--shadow-panel)]">
        <span className={`mx-auto grid size-12 place-items-center rounded-2xl ${warning ? "bg-red-500/10 text-red-500" : "bg-[var(--surface-muted)] text-[var(--text-secondary)]"}`}>
          {warning ? <WarningCircle size={24} /> : <Clock size={24} weight="duotone" />}
        </span>
        <h1 className="mt-4 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-600 dark:text-accent-100"><ArrowLeft size={16} /> Back to library</Link>
      </div>
    </main>
  );
}

export function ReaderPage() {
  const { bookId } = useParams({ from: "/books/$bookId" });
  const outlineOpen = useAppStore((state) => state.isOutlineOpen);
  const assistantOpen = useAppStore((state) => state.isAssistantOpen);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const citationTimer = useRef<number | null>(null);
  const documentQuery = useQuery({
    queryKey: ["documents", bookId],
    queryFn: () => getDocument(bookId),
    refetchInterval: (result) => result.state.data?.status === "processing" ? 2_000 : false,
  });

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
      if (citationTimer.current) window.clearTimeout(citationTimer.current);
    };
  }, []);

  if (documentQuery.isPending) return <ReaderMessage title="Loading document" detail="Fetching the document and its normalized sections from RAGBOOK." />;
  if (documentQuery.isError) return <ReaderMessage title="Document unavailable" detail={documentQuery.error.message} warning />;

  const currentDocument = documentQuery.data;
  if (currentDocument.status === "processing") return <ReaderMessage title="Preparing your document" detail="RAGBOOK is parsing and indexing this upload. This page updates automatically." />;
  if (currentDocument.status === "failed") return <ReaderMessage title="Document processing failed" detail={currentDocument.errorMessage || "The document could not be parsed."} warning />;
  if (currentDocument.sections.length === 0) return <ReaderMessage title="No readable content" detail="No normalized sections were found for this document. Try uploading it again." warning />;

  function jumpToCitation(citation: Citation) {
    setActiveCitation(citation);
    if (citation.sectionId) {
      globalThis.document.getElementById(`document-section-${citation.sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (citationTimer.current) window.clearTimeout(citationTimer.current);
    citationTimer.current = window.setTimeout(() => setActiveCitation(null), 3_500);
  }

  const subtitle = `${currentDocument.format}${currentDocument.pageCount > 0 ? ` · ${currentDocument.pageCount} ${currentDocument.pageCount === 1 ? "page" : "pages"}` : ""}`;

  return (
    <div className="min-h-[100dvh] bg-[#e9ebef] dark:bg-black">
      <ReaderToolbar title={currentDocument.title} subtitle={subtitle} />
      <OutlinePanel sections={currentDocument.sections} pageCount={currentDocument.pageCount} />
      <main className={cn("min-h-[100dvh] px-3 pb-14 pt-22 transition-[padding] duration-300 sm:px-6 sm:pt-24", outlineOpen && "lg:pl-[280px]", assistantOpen && "xl:pr-[384px]")}>
        <div className="reader-page mx-auto max-w-[790px] rounded-2xl bg-[var(--surface-raised)] px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16">
          <DocumentContent document={currentDocument} activeCitation={activeCitation} />
        </div>
        <div className="mx-auto mt-5 flex max-w-[790px] items-center justify-between px-2 text-[11px] text-[var(--text-tertiary)]">
          <span>RAGBOOK normalized view</span>
          <span>{currentDocument.sections.length} {currentDocument.sections.length === 1 ? "section" : "sections"}</span>
        </div>
      </main>
      <AssistantPanel key={currentDocument.id} documentId={currentDocument.id} onCitation={jumpToCitation} />
    </div>
  );
}
