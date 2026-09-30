'use client';

import { useEffect } from 'react';
import '@eightblock/ui/styles/globals.css';

/** Replaces the root layout when it fails, so it has to render its own document. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground">
        <main className="container-page flex min-h-screen flex-col items-start justify-center gap-4 py-24">
          <p className="ledger-label">Eightblock</p>
          <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-muted-foreground">
            The site could not be loaded. Please try again in a moment.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="btn-pill">
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="btn-pill-outline"
            >
              Back home
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
