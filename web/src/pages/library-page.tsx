import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenText, CheckCircle, Clock, FolderOpen, Plus } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { listDocuments } from "../lib/api";
import { useAppStore } from "../store/app-store";
import { AppSidebar } from "../components/app-sidebar";
import { LibraryHeader } from "../components/library-header";
import { UploadDialog } from "../components/upload-dialog";
import { BookCover } from "../components/book-cover";
import { Button } from "../components/ui/button";
import type { Book } from "../lib/types";

const categories = ["All books", "Engineering", "Research", "Work", "Notes"];
const skeletonIds = ["skeleton-one", "skeleton-two", "skeleton-three", "skeleton-four", "skeleton-five"];

function BookCard({ book, index }: { book: Book; index: number }) {
  const reduceMotion = useReducedMotion();
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
          </div>
          <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{book.author}</p>
          {book.status === "ready" ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${book.progress}%` }} />
              </div>
              <span className="text-[10px] tabular-nums text-[var(--text-tertiary)]">{book.progress}%</span>
            </div>
          ) : (
            <p className="mt-3 text-[11px] font-medium text-[var(--text-secondary)]">Preparing your book...</p>
          )}
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
  const documents = useQuery({ queryKey: ["documents"], queryFn: listDocuments, staleTime: 30_000 });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (documents.data ?? []).filter((book) => {
      const categoryMatch = activeCategory === "All books" || book.category === activeCategory;
      const queryMatch = !term || `${book.title} ${book.author}`.toLowerCase().includes(term);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, documents.data, query]);

  const featured = documents.data?.find((book) => book.status === "ready" && book.progress > 0);

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

          {featured ? (
            <section className="mt-9 grid overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] shadow-[0_16px_50px_rgba(31,43,67,0.07)] md:grid-cols-[minmax(0,1fr)_250px]">
              <div className="flex min-w-0 flex-col justify-center px-6 py-7 sm:px-8 md:py-9 lg:px-10">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                  <BookOpenText size={16} weight="duotone" />
                  Continue reading
                </div>
                <h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">{featured.title}</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{featured.author}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link to="/books/$bookId" params={{ bookId: featured.id }}>
                    <Button>
                      Resume on page 14 <ArrowRight size={16} weight="bold" />
                    </Button>
                  </Link>
                  <span className="text-xs text-[var(--text-tertiary)]">{featured.progress}% complete</span>
                </div>
              </div>
              <div className="relative hidden overflow-hidden border-l border-[var(--line)] bg-[#dbe4f0] md:block dark:bg-[#111111]">
                <div className="absolute -bottom-20 left-1/2 w-36 -translate-x-1/2 rotate-[-7deg] lg:w-40">
                  <BookCover book={featured} />
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-11">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-[-0.025em]">Books and documents</h2>
              <span className="text-xs text-[var(--text-tertiary)]">{filtered.length} items</span>
            </div>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Library categories">
              {categories.map((category) => (
                <button
                  key={category}
                  role="tab"
                  aria-selected={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  className={`h-9 shrink-0 rounded-xl px-3.5 text-sm transition-colors ${
                    activeCategory === category
                      ? "bg-[var(--text-primary)] font-medium text-[var(--surface-raised)]"
                      : "border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-5">
              {documents.isPending ? <LibrarySkeleton /> : null}
              {documents.isError ? (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-6">
                  <p className="font-medium">Your library could not be loaded.</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">Check the API connection, then try again.</p>
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
                  <span className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-muted)] text-[var(--text-secondary)]"><FolderOpen size={24} weight="duotone" /></span>
                  <h3 className="mt-4 font-semibold">No documents found</h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">Try a different search, or add the first document to this section.</p>
                  <Button className="mt-5" onClick={() => setUploadOpen(true)}><Plus size={16} weight="bold" /> Add document</Button>
                </div>
              ) : null}
            </div>
          </section>

          <div className="mt-14 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
            <CheckCircle size={15} />
            Your documents remain private to your workspace.
          </div>
        </main>
      </div>
      <UploadDialog />
    </div>
  );
}
