import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-[background-color,color,transform,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50",
        size === "md" ? "h-11 px-4 text-sm" : "h-9 px-3 text-[13px]",
        variant === "primary" && "bg-accent-600 text-white shadow-[var(--accent-shadow)] hover:bg-accent-700",
        variant === "secondary" && "border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]",
        variant === "ghost" && "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
