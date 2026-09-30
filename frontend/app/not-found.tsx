import type { Metadata } from 'next';
import Link from 'next/link';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="container-page flex justify-center py-24">
      <Panel className="w-full max-w-lg">
        <PanelBar>
          <span>Error 404</span>
          <span>Not found</span>
        </PanelBar>
        <div className="p-8">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            This block is not on the chain
          </h1>
          <p className="mt-2 text-muted-foreground">
            The page may have moved, been unpublished, or the link has a typo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/writing" className="btn-pill">
              Browse the articles
            </Link>
            <Link href="/" className="btn-pill-outline">
              Back home
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
