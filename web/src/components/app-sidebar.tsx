import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, ClockCounterClockwise, GearSix, Plus, Sparkle } from "@phosphor-icons/react";
import { Brand } from "./brand";
import { useAppStore } from "../store/app-store";
import { cn } from "../lib/cn";

const navItems = [
  { label: "Library", icon: BookOpen, to: "/" },
  { label: "Recent", icon: ClockCounterClockwise, to: "/" },
  { label: "Highlights", icon: Sparkle, to: "/" },
] as const;

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
        {navItems.map((item, index) => {
          const active = index === 0 && pathname === "/";
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                active
                  ? "bg-[var(--surface-muted)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              <item.icon size={18} weight={active ? "fill" : "regular"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]">
          <GearSix size={18} />
          Settings
        </button>
        <div className="mt-3 flex items-center gap-3 border-t border-[var(--line)] px-2 pt-4">
          <div className="grid size-8 place-items-center rounded-xl bg-[#2d3440] text-xs font-semibold text-white dark:bg-[#202020]">MS</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Mohit Sharma</p>
            <p className="truncate text-xs text-[var(--text-tertiary)]">Personal library</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
