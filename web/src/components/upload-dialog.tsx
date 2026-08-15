import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileArrowUp, FileText, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { uploadDocument } from "../lib/api";
import { useAppStore } from "../store/app-store";
import { Button } from "./ui/button";

const ACCEPTED = ".pdf,.docx,.pptx,.txt,.md,.epub";

export function UploadDialog() {
  const open = useAppStore((state) => state.isUploadOpen);
  const setOpen = useAppStore((state) => state.setUploadOpen);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      window.setTimeout(() => {
        setOpen(false);
        setFile(null);
      }, 350);
    },
  });

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    if (nextFile.size > 100 * 1024 * 1024) {
      setError("Choose a file smaller than 100 MB.");
      return;
    }
    setError(null);
    setFile(nextFile);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-[#151820]/35 backdrop-blur-[3px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-panel)] transition-[opacity,transform] duration-200 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-[-0.025em]">Add to your library</Dialog.Title>
              <Dialog.Description className="mt-1.5 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                RAGBOOK preserves the source structure and prepares every passage for grounded search.
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close upload" className="grid size-9 shrink-0 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]">
              <X size={18} />
            </Dialog.Close>
          </div>

          <motion.button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              chooseFile(event.dataTransfer.files[0]);
            }}
            whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            className="mt-6 flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--text-tertiary)_45%,transparent)] bg-[var(--app-bg)] px-6 text-center transition-colors hover:border-accent-500 hover:bg-accent-50/40 dark:hover:border-white/20 dark:hover:bg-black"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-accent-100 text-accent-700 dark:bg-black dark:text-white dark:ring-1 dark:ring-white/10">
              {file ? <FileText size={24} weight="duotone" /> : <FileArrowUp size={24} weight="duotone" />}
            </span>
            <span className="mt-4 text-sm font-semibold">{file ? file.name : "Drop a document here"}</span>
            <span className="mt-1.5 text-xs leading-5 text-[var(--text-tertiary)]">
              {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB ready to upload` : "PDF, DOCX, PPTX, TXT, Markdown, or EPUB up to 100 MB"}
            </span>
          </motion.button>
          <input ref={inputRef} type="file" accept={ACCEPTED} className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />

          {error || mutation.error ? (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error ?? mutation.error?.message}</p>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-2">
            <Dialog.Close render={<Button variant="ghost" />}>Cancel</Dialog.Close>
            <Button disabled={!file || mutation.isPending || mutation.isSuccess} onClick={() => file && mutation.mutate(file)}>
              {mutation.isPending ? "Uploading..." : mutation.isSuccess ? "Added" : "Upload document"}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
