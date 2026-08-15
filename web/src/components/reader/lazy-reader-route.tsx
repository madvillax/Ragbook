import { lazy, Suspense } from "react";

const ReaderPage = lazy(() =>
  import("../../pages/reader-page").then((module) => ({ default: module.ReaderPage })),
);

export function LazyReaderRoute() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-[100dvh] place-items-center bg-[var(--app-bg)]" aria-label="Loading reader">
          <div className="w-[min(84vw,620px)] rounded-2xl bg-[var(--surface-raised)] p-10">
            <div className="skeleton h-5 w-24 rounded" />
            <div className="skeleton mt-5 h-10 w-4/5 rounded" />
            <div className="skeleton mt-10 h-3 w-full rounded" />
            <div className="skeleton mt-3 h-3 w-11/12 rounded" />
            <div className="skeleton mt-3 h-3 w-3/4 rounded" />
          </div>
        </main>
      }
    >
      <ReaderPage />
    </Suspense>
  );
}

