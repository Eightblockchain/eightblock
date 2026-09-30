'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';

export default function Error({
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
    <div className="container-page flex justify-center py-24">
      <Panel className="w-full max-w-lg">
        <PanelBar>
          <span>Error</span>
          {error.digest && <span>Ref {error.digest.slice(0, 8)}</span>}
        </PanelBar>
        <div className="p-8">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="mt-2 text-muted-foreground">
            This page could not be loaded. It is usually temporary, so please try again in a moment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="btn-pill">
              Try again
            </button>
            <Link href="/" className="btn-pill-outline">
              Back home
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
