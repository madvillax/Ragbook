import { useState } from "react";
import { ArrowUp, Copy, Sparkle, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { citations } from "../../lib/mock-data";
import type { ChatMessage, Citation } from "../../lib/types";
import { useAppStore } from "../../store/app-store";

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Ask about this document. I will answer only from indexed passages and link every claim to its source.",
  },
];

const suggested = ["How does the author define reliability?", "What is the difference between a fault and failure?", "Summarize this section"];

export function AssistantPanel({ onCitation }: { onCitation: (citation: Citation) => void }) {
  const open = useAppStore((state) => state.isAssistantOpen);
  const toggle = useAppStore((state) => state.toggleAssistant);
  const reduceMotion = useReducedMotion();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isAnswering, setIsAnswering] = useState(false);

  if (!open) return null;

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isAnswering) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    setInput("");
    setIsAnswering(true);
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Reliability means that a system continues to behave correctly when faults occur. The text distinguishes a fault in one component from a system-level failure, then argues that systems should tolerate expected faults before they affect users.",
          citations,
        },
      ]);
      setIsAnswering(false);
    }, 650);
  }

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className="fixed inset-y-16 right-0 z-20 flex w-[min(92vw,360px)] flex-col border-l border-[var(--line)] bg-[var(--surface)] xl:w-[360px]"
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--line)] px-4">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-[9px] bg-accent-100 text-accent-700 dark:bg-black dark:text-white dark:ring-1 dark:ring-white/10"><Sparkle size={14} weight="fill" /></span>
          <h2 className="text-sm font-semibold">Ask RAGBOOK</h2>
        </div>
        <button onClick={toggle} className="grid size-8 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]" aria-label="Close assistant"><X size={16} /></button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "ml-8" : "mr-2"}>
            {message.role === "assistant" ? (
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-tertiary)]"><Sparkle size={11} weight="fill" /> RAGBOOK</div>
            ) : null}
            <div className={message.role === "user" ? "rounded-2xl rounded-br-md bg-accent-600 px-3.5 py-2.5 text-[13px] leading-5 text-white dark:ring-1 dark:ring-white/10" : "text-[13px] leading-[1.65] text-[var(--text-primary)]"}>
              {message.content}
            </div>
            {message.citations?.length ? (
              <div className="mt-3 grid gap-2">
                {message.citations.map((citation, index) => (
                  <button
                    key={citation.id}
                    onClick={() => onCitation(citation)}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3 text-left transition-colors hover:border-accent-500/45 hover:bg-accent-50/40 dark:hover:border-white/20 dark:hover:bg-black"
                  >
                    <span className="flex items-center justify-between text-[11px] font-semibold text-accent-600 dark:text-accent-100">
                      <span>[{index + 1}] {citation.label}</span>
                      <span className="font-normal text-[var(--text-tertiary)]">p. {citation.page}</span>
                    </span>
                    <span className="mt-1.5 line-clamp-2 block text-[11px] leading-4 text-[var(--text-secondary)]">{citation.excerpt}</span>
                  </button>
                ))}
                <button className="mt-0.5 flex w-fit items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><Copy size={12} /> Copy answer</button>
              </div>
            ) : null}
          </div>
        ))}

        {isAnswering ? (
          <div className="mr-10 rounded-xl bg-[var(--surface-muted)] p-3" aria-label="RAGBOOK is searching the document">
            <div className="skeleton h-3 w-4/5 rounded" />
            <div className="skeleton mt-2 h-3 w-full rounded" />
            <div className="skeleton mt-2 h-3 w-2/3 rounded" />
          </div>
        ) : null}

        {messages.length === 1 ? (
          <div className="pt-1">
            <p className="mb-2 text-[11px] font-medium text-[var(--text-tertiary)]">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {suggested.map((question) => (
                <button key={question} onClick={() => ask(question)} className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2 text-left text-[11px] leading-4 text-[var(--text-secondary)] hover:border-accent-500/40 hover:text-[var(--text-primary)]">{question}</button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); ask(input); }}
        className="border-t border-[var(--line)] p-3"
      >
        <label className="sr-only" htmlFor="rag-question">Ask a question about this document</label>
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] p-2 shadow-[0_5px_20px_rgba(30,40,60,0.06)] focus-within:border-accent-500/55">
          <textarea
            id="rag-question"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                ask(input);
              }
            }}
            placeholder="Ask about this document"
            rows={2}
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1.5 py-1 text-[13px] leading-5 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
          <button disabled={!input.trim() || isAnswering} className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-600 text-white disabled:opacity-40 dark:ring-1 dark:ring-white/15" aria-label="Send question"><ArrowUp size={16} weight="bold" /></button>
        </div>
        <p className="mt-2 text-center text-[9px] text-[var(--text-tertiary)]">Answers are limited to this document. Verify important details.</p>
      </form>
    </motion.aside>
  );
}
