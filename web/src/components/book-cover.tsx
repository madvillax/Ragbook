import { FileText } from "@phosphor-icons/react";
import type { Book } from "../lib/types";
import { cn } from "../lib/cn";

export function BookCover({ book, className }: { book: Book; className?: string }) {
  return (
    <div
      className={cn(
        "book-cover relative flex aspect-[0.69] overflow-hidden rounded-[14px] p-4 text-white",
        `cover-${book.cover}`,
        className,
      )}
      aria-label={`${book.title} cover`}
    >
      <div className="relative z-[1] flex w-full flex-col">
        <FileText size={20} weight="duotone" className="opacity-75" />
        <div className="mt-auto">
          <p className="line-clamp-4 text-[clamp(0.85rem,1.25vw,1.1rem)] font-semibold leading-[1.1] tracking-[-0.025em]">{book.title}</p>
          <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-white/70">{book.author}</p>
        </div>
      </div>
    </div>
  );
}

