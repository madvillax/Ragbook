"use client";

import { Button } from "../components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[100dvh] place-items-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold">RAGBOOK could not open this page.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Try the request again. Your uploaded documents have not been changed.</p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
