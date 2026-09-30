import Link from 'next/link';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';

export default function NotFound() {
  return (
    <div className="flex justify-center py-16">
      <Panel className="w-full max-w-lg">
        <PanelBar>
          <span>Error 404</span>
          <span>Not found</span>
        </PanelBar>
        <div className="p-8">
          <h1 className="font-display text-2xl font-semibold text-foreground">Page not found</h1>
          <p className="mt-2 text-muted-foreground">There is no admin page at this address.</p>
          <Link href="/" className="btn-pill mt-6">
            Back to the overview
          </Link>
        </div>
      </Panel>
    </div>
  );
}
