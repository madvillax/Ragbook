import { BookOpenText } from "@phosphor-icons/react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="RAGBOOK">
      <span className="grid size-8 place-items-center rounded-[10px] bg-accent-600 text-white shadow-[var(--accent-shadow)]">
        <BookOpenText size={18} weight="duotone" />
      </span>
      {compact ? null : <span className="text-[15px] font-semibold tracking-[-0.025em]">RAGBOOK</span>}
    </div>
  );
}
