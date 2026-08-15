import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Plus } from "@phosphor-icons/react";
import { Brand } from "./brand";
import { useAppStore } from "../store/app-store";
import { cn } from "../lib/cn";

export function AppSidebar() {
  const setUploadOpen = useAppStore((state) => state.setUploadOpen);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-[var(--line)] bg-[var(--surface)] px-3 py-4 lg:flex">
      <div className="px-2 py-1"><Brand /></div>
      <button
        onClick={() => setUploadOpen(true)}
        className="mt-7 flex h-10 items-center gap-2 rounded-xl bg-accent-600 px-3.5 text-sm font-medium text-white shadow-[var(--accent-shadow)] hover:bg-accent-700"
      >
        <Plus size={17} weight="bold" />
        Add document
      </button>

      <nav aria-label="Main navigation" className="mt-6 space-y-1">
        <Link
          to="/"
          className={cn(
            "flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
            pathname === "/"
              ? "bg-[var(--surface-muted)] font-medium text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
          )}
        >
          <BookOpen size={18} weight={pathname === "/" ? "fill" : "regular"} />
          Library
        </Link>
      </nav>

      <div className="mt-auto border-t border-[var(--line)] px-2 pt-4">
        <p className="text-xs leading-5 text-[var(--text-tertiary)]">Your uploaded documents appear here after processing.</p>
      </div>
    </aside>
  );
}
