'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { unsubscribeFromNewsletter } from '@/lib/api';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';

type Status = 'loading' | 'success' | 'error' | 'missing';

const copy: Record<Status, { label: string; title: string; body: string }> = {
  loading: {
    label: 'Pending',
    title: 'Processing your request…',
    body: 'This only takes a moment.',
  },
  success: {
    label: 'Done',
    title: 'You’ve been unsubscribed',
    body: 'You won’t receive any more emails from us. Changed your mind?',
  },
  error: {
    label: 'Failed',
    title: 'Something went wrong',
    body: 'This unsubscribe link may be invalid or expired.',
  },
  missing: { label: 'Invalid', title: 'Invalid link', body: 'No unsubscribe token was provided.' },
};

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      return;
    }
    unsubscribeFromNewsletter(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const { label, title, body } = copy[status];

  return (
    <div className="container-page flex justify-center py-24">
      <Panel className="w-full max-w-lg">
        <PanelBar>
          <span>Newsletter</span>
          <span>{label}</span>
        </PanelBar>
        <div className="p-8">
          <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-2 text-muted-foreground">{body}</p>
          {status === 'success' && (
            <Link href="/newsletter" className="btn-pill mt-6">
              Resubscribe
            </Link>
          )}
          {(status === 'error' || status === 'missing') && (
            <Link href="/" className="btn-pill-outline mt-6">
              Back home
            </Link>
          )}
        </div>
      </Panel>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="container-page py-24 ledger-label">Loading…</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
