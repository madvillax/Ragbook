import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileText, FolderOpen, Plus, WarningCircle } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { listDocuments } from "../lib/api";
import { useAppStore } from "../store/app-store";
import { AppSidebar } from "../components/app-sidebar";
import { LibraryHeader } from "../components/library-header";
import { UploadDialog } from "../components/upload-dialog";
import { BookCover } from "../components/book-cover";
import { Button } from "../components/ui/button";
import type { Book } from "../lib/types";

const ALL_DOCUMENTS = "All documents";
const skeletonIds = ["skeleton-one", "skeleton-two", "skeleton-three", "skeleton-four", "skeleton-five"];
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

function BookCard({ book, index }: { book: Book; index: number }) {
  const reduceMotion = useReducedMotion();
  const updatedAt = dateFormatter.format(new Date(book.updatedAt));

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] }}
      className="group min-w-0"
    >
      <Link to="/books/$bookId" params={{ bookId: book.id }} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
        <BookCover book={book} className="w-full transition-transform duration-300 group-hover:-translate-y-1" />
        <div className="mt-3 px-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-[1.35] tracking-[-0.015em]">{book.title}</h3>
            {book.status === "processing" ? <Clock size={15} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" /> : null}
            {book.status === "failed" ? <WarningCircle size={15} className="mt-0.5 shrink-0 text-red-500" /> : null}
          </div>
          <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{book.author}</p>
          {book.status === "ready" ? (
            <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
              {book.pageCount > 0 ? `${book.pageCount} ${book.pageCount === 1 ? "page" : "pages"}` : book.format} · Updated {updatedAt}
            </p>
          ) : null}
          {book.status === "processing" ? <p className="mt-2 text-[11px] font-medium text-[var(--text-secondary)]">Preparing document…</p> : null}
          {book.status === "failed" ? (
            <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-red-600 dark:text-red-400">{book.errorMessage || "Document processing failed."}</p>
          ) : null}
        </div>
      </Link>
    </motion.article>
  );
}

function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-label="Loading library">
      {skeletonIds.map((skeletonId) => (
        <div key={skeletonId}>
          <div className="skeleton aspect-[0.69] rounded-[14px]" />
          <div className="skeleton mt-3 h-4 w-4/5 rounded" />
          <div className="skeleton mt-2 h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

export function LibraryPage() {
  const query = useAppStore((state) => state.query);
  const activeCategory = useAppStore((state) => state.activeCategory);
  const setActiveCategory = useAppStore((state) => state.setActiveCategory);
  const setUploadOpen = useAppStore((state) => state.setUploadOpen);
  const documents = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
    staleTime: 5_000,
    refetchInterval: (result) => result.state.data?.some((book) => book.status === "processing") ? 2_000 : false,
  });

  const categories = useMemo(() => {
    const values = new Set((documents.data ?? []).map((book) => book.category).filter(Boolean));
    return [ALL_DOCUMENTS, ...values];
  }, [documents.data]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (documents.data ?? []).filter((book) => {
      const categoryMatch = activeCategory === ALL_DOCUMENTS || book.category === activeCategory;
      const queryMatch = !term || `${book.title} ${book.author} ${book.format}`.toLowerCase().includes(term);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, documents.data, query]);

  const libraryIsEmpty = !documents.isPending && !documents.isError && (documents.data?.length ?? 0) === 0;

  return (
    <div className="min-h-[100dvh]">
      <AppSidebar />
      <div className="lg:pl-60">
        <LibraryHeader />
        <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-8 sm:px-7 lg:px-10 lg:pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-accent-600 dark:text-accent-100">Your library</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Read deeply. Find anything.</h1>
            </div>
            <p className="hidden max-w-xs text-right text-sm leading-6 text-[var(--text-secondary)] md:block">Every answer stays connected to the passage that supports it.</p>
          </div>

          <section className="mt-11">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-[-0.025em]">Books and documents</h2>
              <span className="text-xs text-[var(--text-tertiary)]">{filtered.length} items</span>
            </div>

            {categories.length > 2 ? (
              <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Library categories">
                {categories.map((category) => (
                  <button
                    key={category}
                    role="tab"
                    aria-selected={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                    className={`h-9 shrink-0 rounded-xl px-3.5 text-sm transition-colors ${activeCategory === category ? "bg-[var(--text-primary)] font-medium text-[var(--surface-raised)]" : "border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-5">
              {documents.isPending ? <LibrarySkeleton /> : null}
              {documents.isError ? (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-6">
                  <p className="font-medium">Your library could not be loaded.</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{documents.error.message}</p>
                  <Button variant="secondary" className="mt-4" onClick={() => documents.refetch()}>Retry</Button>
                </div>
              ) : null}
              {!documents.isPending && !documents.isError && filtered.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {filtered.map((book, index) => <BookCard key={book.id} book={book} index={index} />)}
                </div>
              ) : null}
              {!documents.isPending && !documents.isError && filtered.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 text-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-muted)] text-[var(--text-secondary)]">{libraryIsEmpty ? <FileText size={24} weight="duotone" /> : <FolderOpen size={24} weight="duotone" />}</span>
                  <h3 className="mt-4 font-semibold">{libraryIsEmpty ? "Your library is empty" : "No matching documents"}</h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">{libraryIsEmpty ? "Upload a document to create your first readable, searchable book." : "Try a different search or category."}</p>
                  {libraryIsEmpty ? <Button className="mt-5" onClick={() => setUploadOpen(true)}><Plus size={16} weight="bold" /> Upload document</Button> : null}
                </div>
              ) : null}
            </div>
          </section>
        </main>
      </div>
      <UploadDialog />
    </div>
  );
}
