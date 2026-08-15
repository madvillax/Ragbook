import type { CSSProperties } from "react";
import { useAppStore } from "../../store/app-store";

export function DocumentContent({ activeCitation }: { activeCitation: string | null }) {
  const fontScale = useAppStore((state) => state.readerFontScale);
  const style = { "--reader-scale": fontScale } as CSSProperties;

  const cited = (id: string) => activeCitation === id
    ? "rounded bg-accent-100/80 px-1 -mx-1 ring-2 ring-accent-500/20 dark:bg-black dark:ring-white/20"
    : "transition-colors duration-500";

  return (
    <article
      style={style}
      className="font-reader text-[calc(1.08rem*var(--reader-scale))] leading-[1.82] text-[color-mix(in_srgb,var(--text-primary)_92%,transparent)]"
    >
      <header id="thinking-data-systems" className="scroll-mt-24 border-b border-[var(--line)] pb-10">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-accent-600 dark:text-accent-100">Chapter 1</p>
        <h1 className="mt-4 max-w-2xl font-sans text-[calc(2.4rem*var(--reader-scale))] font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--text-primary)] sm:text-[calc(3rem*var(--reader-scale))]">
          Reliable, Scalable, and Maintainable Applications
        </h1>
        <p className="mt-5 max-w-2xl text-[1.08em] leading-[1.65] text-[var(--text-secondary)]">
          The internet has changed how applications are built. Modern systems are data-intensive, and their hardest problems often live in the data itself.
        </p>
      </header>

      <section className="pt-10">
        <p>Many applications need to store data, recall it later, search it, process it, and send it to other systems. These capabilities sound familiar, but choosing the right tools is rarely simple. Every system has different requirements for consistency, scale, latency, and complexity.</p>

        <p className="mt-6">A data system may combine several tools so that caches, indexes, queues, and databases behave as one product. Once that happens, the application team becomes responsible for the guarantees that users experience across the whole system.</p>

        <aside className="my-9 rounded-2xl border border-accent-500/20 bg-accent-50/55 p-5 font-sans text-[0.78em] leading-6 text-[#284066] dark:border-white/10 dark:bg-black dark:text-zinc-300">
          <strong className="font-semibold">Reading note</strong>
          <p className="mt-1">RAGBOOK indexes paragraphs with their chapter, section, page, and source coordinates. Citations can return to this exact context.</p>
        </aside>
      </section>

      <section id="reliability" className="scroll-mt-24 pt-6">
        <h2 className="font-sans text-[calc(1.7rem*var(--reader-scale))] font-semibold tracking-[-0.035em] text-[var(--text-primary)]">Reliability</h2>
        <p id="reliability-passage" className={`scroll-mt-28 mt-5 ${cited("citation-reliability")}`}>
          The system should continue to work correctly even when things go wrong. This expectation is reliability. The system performs the function a user expected, tolerates predictable mistakes and misuse, and prevents unauthorized access.
        </p>

        <p className="mt-6">Things that can go wrong are called faults. Systems that anticipate faults and continue operating are fault-tolerant. It is impossible to tolerate every possible fault, so a practical design begins by deciding which fault classes matter.</p>
      </section>

      <section id="hardware-faults" className="scroll-mt-24 pt-10">
        <h3 className="font-sans text-[calc(1.3rem*var(--reader-scale))] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">Hardware Faults</h3>
        <p id="faults-passage" className={`scroll-mt-28 mt-5 ${cited("citation-faults")}`}>
          A fault is one component deviating from its specification, while a failure is when the system stops providing the required service. This distinction matters because a system can be designed to absorb component faults before users experience a failure.
        </p>
        <p className="mt-6">Traditional systems often addressed hardware faults by adding redundancy. Disks used RAID, servers had extra power supplies, and generators backed up datacenters. Larger platforms increasingly add redundancy in software so machines can be replaced without interrupting the service.</p>
      </section>

      <figure className="my-10 border-y border-[var(--line)] py-7">
        <blockquote className="text-[1.12em] font-medium italic leading-[1.65] text-[var(--text-primary)]">
          A reliable system turns local faults into contained events instead of user-visible failures.
        </blockquote>
        <figcaption className="mt-3 font-sans text-xs text-[var(--text-tertiary)]">Key idea from this section</figcaption>
      </figure>

      <section id="software-errors" className="scroll-mt-24 pb-20 pt-2">
        <h3 className="font-sans text-[calc(1.3rem*var(--reader-scale))] font-semibold tracking-[-0.025em] text-[var(--text-primary)]">Software Errors</h3>
        <p className="mt-5">Hardware faults are often independent. Software faults can be harder because the same unexpected input may trigger many nodes at once. Careful assumptions, process isolation, monitoring, and testing help reveal these correlated failures before they spread.</p>
      </section>
    </article>
  );
}
