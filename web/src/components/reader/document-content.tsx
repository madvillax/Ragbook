import type { CSSProperties, ReactNode } from "react";
import type { Citation, DocumentDetail, DocumentSection } from "../../lib/types";
import { useAppStore } from "../../store/app-store";

interface DocumentContentProps {
  document: DocumentDetail;
  activeCitation: Citation | null;
}

function SectionHeading({ section }: { section: DocumentSection }) {
  if (section.level <= 1) {
    return <h2 className="font-sans text-[calc(1.8rem*var(--reader-scale))] font-semibold leading-tight tracking-[-0.035em] text-[var(--text-primary)]">{section.title}</h2>;
  }
  if (section.level === 2) {
    return <h3 className="font-sans text-[calc(1.45rem*var(--reader-scale))] font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)]">{section.title}</h3>;
  }
  return <h4 className="font-sans text-[calc(1.2rem*var(--reader-scale))] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-primary)]">{section.title}</h4>;
}

function highlightedParagraph(text: string, citation: Citation | null): ReactNode {
  if (!citation) return text;
  const fragment = citation.excerpt.split(/\n\s*\n/)[0]?.trim().slice(0, 140);
  if (!fragment || fragment.length < 8) return text;
  const index = text.toLocaleLowerCase().indexOf(fragment.toLocaleLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-accent-100/90 px-1 text-inherit ring-2 ring-accent-500/20 dark:bg-zinc-800 dark:ring-white/20">{text.slice(index, index + fragment.length)}</mark>
      {text.slice(index + fragment.length)}
    </>
  );
}

export function DocumentContent({ document, activeCitation }: DocumentContentProps) {
  const fontScale = useAppStore((state) => state.readerFontScale);
  const style = { "--reader-scale": fontScale } as CSSProperties;

  return (
    <article style={style} className="font-reader text-[calc(1.08rem*var(--reader-scale))] leading-[1.82] text-[color-mix(in_srgb,var(--text-primary)_92%,transparent)]">
      <header className="border-b border-[var(--line)] pb-10">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-accent-600 dark:text-accent-100">{document.format} document</p>
        <h1 className="mt-4 max-w-2xl font-sans text-[calc(2.4rem*var(--reader-scale))] font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--text-primary)] sm:text-[calc(3rem*var(--reader-scale))]">{document.title}</h1>
        <p className="mt-5 font-sans text-sm text-[var(--text-secondary)]">{document.author}{document.pageCount > 0 ? ` · ${document.pageCount} ${document.pageCount === 1 ? "page" : "pages"}` : ""}</p>
      </header>

      {document.sections.map((section, index) => {
        const sectionCitation = activeCitation?.sectionId === section.id ? activeCitation : null;
        let searchStart = 0;
        const paragraphs = section.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean).map((text) => {
          const offset = section.content.indexOf(text, searchStart);
          searchStart = offset + text.length;
          return { text, offset };
        });
        return (
          <section
            id={`document-section-${section.id}`}
            key={section.id}
            className={`scroll-mt-24 py-9 ${index < document.sections.length - 1 ? "border-b border-[var(--line)]" : ""} ${sectionCitation ? "rounded-xl ring-2 ring-accent-500/15" : ""}`}
          >
            <div className="font-sans">
              <SectionHeading section={section} />
              <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">Page {section.pageStart}{section.pageEnd > section.pageStart ? `–${section.pageEnd}` : ""}</p>
            </div>
            {paragraphs.map((paragraph) => (
              <p key={`${section.id}-${paragraph.offset}`} className="mt-6 whitespace-pre-wrap">{highlightedParagraph(paragraph.text, sectionCitation)}</p>
            ))}
          </section>
        );
      })}
    </article>
  );
}
