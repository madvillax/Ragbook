import { Link } from "@tanstack/react-router";
import { ArrowLeft, List, Minus, Plus, SidebarSimple, Sparkle } from "@phosphor-icons/react";
import { Brand } from "../brand";
import { useAppStore } from "../../store/app-store";
import { Button } from "../ui/button";

export function ReaderToolbar({ title, subtitle }: { title: string; subtitle: string }) {
  const fontScale = useAppStore((state) => state.readerFontScale);
  const setFontScale = useAppStore((state) => state.setReaderFontScale);
  const toggleOutline = useAppStore((state) => state.toggleOutline);
  const toggleAssistant = useAppStore((state) => state.toggleAssistant);

  return (
    <header className="glass fixed inset-x-0 top-0 z-30 flex h-16 items-center px-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        <Link
          to="/"
          aria-label="Back to library"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={18} weight="bold" />
        </Link>
        <div className="hidden border-l border-[var(--line)] pl-3 sm:block"><Brand compact /></div>
        <button onClick={toggleOutline} className="ml-0.5 grid size-9 shrink-0 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]" aria-label="Toggle contents">
          <List size={19} />
        </button>
        <div className="ml-1 min-w-0 border-l border-[var(--line)] pl-3">
          <p className="truncate text-[13px] font-medium sm:max-w-72">{title}</p>
          <p className="hidden text-[10px] text-[var(--text-tertiary)] sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="hidden items-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-0.5 md:flex">
        <button
          aria-label="Decrease text size"
          onClick={() => setFontScale(Math.max(0.88, fontScale - 0.06))}
          className="grid size-8 place-items-center rounded-[9px] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        >
          <Minus size={14} weight="bold" />
        </button>
        <span className="w-10 text-center text-xs font-medium tabular-nums">{Math.round(fontScale * 100)}%</span>
        <button
          aria-label="Increase text size"
          onClick={() => setFontScale(Math.min(1.24, fontScale + 0.06))}
          className="grid size-8 place-items-center rounded-[9px] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>

      <div className="ml-2 flex items-center gap-1">
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={toggleAssistant}>
          <SidebarSimple size={17} />
          AI panel
        </Button>
        <button onClick={toggleAssistant} className="grid size-9 place-items-center rounded-xl bg-accent-600 text-white dark:ring-1 dark:ring-white/15 sm:hidden" aria-label="Open AI assistant">
          <Sparkle size={17} weight="fill" />
        </button>
      </div>
    </header>
  );
}
