import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-medium text-[var(--text-tertiary)]">404</p>
        <h1 className="mt-2 text-2xl font-semibold">This page is not in your library.</h1>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-accent-600 dark:text-accent-100">
          Return to library
        </Link>
      </div>
    </main>
  );
}
