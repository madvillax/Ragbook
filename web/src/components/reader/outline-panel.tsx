import { CaretRight, X } from "@phosphor-icons/react";
import { sections } from "../../lib/mock-data";
import { cn } from "../../lib/cn";
import { useAppStore } from "../../store/app-store";

export function OutlinePanel() {
  const open = useAppStore((state) => state.isOutlineOpen);
  const toggle = useAppStore((state) => state.toggleOutline);

  if (!open) return null;

  function jumpTo(sectionId: string) {
    const normalized = ["reliability", "hardware-faults"].includes(sectionId)
      ? sectionId
      : "thinking-data-systems";
    document.getElementById(normalized)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (window.innerWidth < 1024) toggle();
  }

  return (
    <aside className="fixed inset-y-16 left-0 z-20 flex w-[min(84vw,280px)] flex-col border-r border-[var(--line)] bg-[var(--surface)] lg:w-64">
      <div className="flex h-14 items-center justify-between px-4">
        <h2 className="text-sm font-semibold">Contents</h2>
        <button onClick={toggle} className="grid size-8 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]" aria-label="Close contents">
          <X size={16} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-5" aria-label="Document outline">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => jumpTo(section.id)}
            className={cn(
              "group flex w-full items-start gap-1.5 rounded-xl py-2 pr-2 text-left text-[12px] leading-[1.35] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
              section.level === 1 && "pl-2 font-semibold text-[var(--text-primary)]",
              section.level === 2 && "pl-4",
              section.level === 3 && "pl-7 text-[11px]",
              section.id === "reliability" && "bg-accent-50 text-accent-700 dark:bg-black dark:text-white dark:ring-1 dark:ring-white/10",
            )}
          >
            <CaretRight size={12} className={cn("mt-0.5 shrink-0 opacity-0", section.level < 3 && "opacity-60")} />
            <span className="flex-1">{section.title}</span>
            <span className="shrink-0 text-[10px] tabular-nums text-[var(--text-tertiary)]">{section.page}</span>
          </button>
        ))}
      </nav>
      <div className="border-t border-[var(--line)] p-4">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
          <span>Reading progress</span><span>42%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div className="h-full w-[42%] rounded-full bg-accent-500" />
        </div>
      </div>
    </aside>
  );
}
