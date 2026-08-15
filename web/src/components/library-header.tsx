import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { useAppStore } from "../store/app-store";

export function LibraryHeader() {
  const query = useAppStore((state) => state.query);
  const setQuery = useAppStore((state) => state.setQuery);
  const setUploadOpen = useAppStore((state) => state.setUploadOpen);

  return (
    <header className="sticky top-0 z-10 flex h-18 items-center border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--app-bg)_82%,transparent)] px-4 backdrop-blur-xl sm:px-7 lg:px-10">
      <div className="mr-4 lg:hidden"><Brand compact /></div>
      <label className="relative max-w-md flex-1">
        <span className="sr-only">Search library</span>
        <MagnifyingGlass size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your library"
          className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] pl-9 pr-3 text-sm text-[var(--text-primary)] shadow-[0_1px_2px_rgba(30,40,60,0.04)] placeholder:text-[var(--text-tertiary)]"
        />
      </label>
      <Button onClick={() => setUploadOpen(true)} className="ml-3 lg:hidden" size="sm">
        <Plus size={16} weight="bold" />
        <span className="hidden sm:inline">Add</span>
      </Button>
      <button aria-label="Open account menu" className="ml-3 hidden size-9 place-items-center rounded-xl bg-[#2d3440] text-xs font-semibold text-white sm:grid dark:bg-[#202020] lg:hidden">MS</button>
    </header>
  );
}
