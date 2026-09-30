'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmNewsletterSubscription } from '@/lib/api';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';

type Status =
  | 'loading'
  | 'subscribed'
  | 'resubscribed'
  | 'already_subscribed'
  | 'invalid'
  | 'missing';

const copy: Record<Status, { label: string; title: string; body: string }> = {
  loading: {
    label: 'Pending',
    title: 'Confirming your subscription…',
    body: 'This only takes a moment.',
  },
  subscribed: {
    label: 'Confirmed',
    title: 'You’re subscribed',
    body: 'Thanks for confirming. A welcome email with a few articles to start with is on its way, and new articles will follow as they are published.',
  },
  resubscribed: {
    label: 'Confirmed',
    title: 'Welcome back',
    body: 'You’re subscribed again. New articles will reach your inbox as they are published.',
  },
  already_subscribed: {
    label: 'Confirmed',
    title: 'Already confirmed',
    body: 'This address is already subscribed, so there is nothing more to do.',
  },
  invalid: {
    label: 'Expired',
    title: 'This link no longer works',
    body: 'Confirmation links expire after a few days and stop working once you unsubscribe. Subscribe again to get a new one.',
  },
  missing: { label: 'Invalid', title: 'Invalid link', body: 'No confirmation token was provided.' },
};

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  // Development mode runs effects twice; a second call would report "already confirmed".
  const requested = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      return;
    }
    if (requested.current === token) return;
    requested.current = token;
    confirmNewsletterSubscription(token)
      .then((res) => setStatus(res.result))
      .catch(() => setStatus('invalid'));
  }, [token]);

  const { label, title, body } = copy[status];
  const confirmed =
    status === 'subscribed' || status === 'resubscribed' || status === 'already_subscribed';

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
          {confirmed && (
            <Link href="/writing" className="btn-pill mt-6">
              Browse the articles
            </Link>
          )}
          {status === 'invalid' && (
            <Link href="/newsletter" className="btn-pill mt-6">
              Subscribe again
            </Link>
          )}
          {status === 'missing' && (
            <Link href="/" className="btn-pill-outline mt-6">
              Back home
            </Link>
          )}
        </div>
      </Panel>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 ledger-label">Loading…</div>}>
      <ConfirmContent />
    </Suspense>
  );
}
