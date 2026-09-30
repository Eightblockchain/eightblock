'use client';

import { useEffect } from 'react';
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
    <div className="flex justify-center py-16">
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
            This page hit an unexpected error. Try again, and if it keeps happening check the admin
            logs on the server.
          </p>
          <button type="button" onClick={reset} className="btn-pill mt-6">
            Try again
          </button>
        </div>
      </Panel>
    </div>
  );
}
