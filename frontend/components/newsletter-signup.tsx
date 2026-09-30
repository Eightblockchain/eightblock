'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Mail } from 'lucide-react';
import { getMySubscription, subscribeToNewsletter, type SubscribeResponse } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@eightblock/ui/utils';
import { Panel } from '@eightblock/ui/components/panel';
import { Eyebrow } from '@eightblock/ui/components/section-header';

interface NewsletterSignupProps {
  variant?: 'default' | 'compact';
  subscriberCount?: number;
  className?: string;
}

const MY_SUBSCRIPTION = ['newsletter', 'me'] as const;

/** `fetcher` errors read "API error: 429 - {json}"; show the server's own sentence instead. */
function readableError(err: unknown) {
  const raw = err instanceof Error ? err.message : '';
  const body = raw.slice(raw.indexOf('{'));
  try {
    const { error } = JSON.parse(body) as { error?: string };
    if (error) return error.replace(/^email: /, '');
  } catch {
    // Not JSON: fall through to the generic message.
  }
  return 'Something went wrong. Please try again.';
}

function outcomeCopy({ result, email, emailSent }: SubscribeResponse) {
  switch (result) {
    case 'already_subscribed':
      return {
        title: 'Already subscribed.',
        detail: `${email} is already on the list, so nothing changed.`,
      };
    case 'confirmation_sent':
      return {
        title: 'Check your inbox.',
        detail: emailSent
          ? `We sent a confirmation link to ${email}. Click it to start receiving the newsletter.`
          : `Almost done, but confirmation emails can't be sent right now. Please try again later.`,
      };
    case 'resubscribed':
      return {
        title: 'Welcome back.',
        detail: `You're subscribed again with ${email}.`,
      };
    default:
      return {
        title: "You're subscribed.",
        detail: `New articles will arrive at ${email}.`,
      };
  }
}

function Notice({
  title,
  detail,
  action,
  waiting = false,
  className,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
  /** Still needs the reader to do something, such as click the link in their inbox. */
  waiting?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3', className)} role="status">
      <span
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          waiting ? 'border border-brand-blue text-brand-blue' : 'bg-brand-blue text-white'
        )}
      >
        {waiting ? <Mail className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 break-words text-sm text-muted-foreground">{detail}</p>
        {action}
      </div>
    </div>
  );
}

function SignupForm({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const mine = useQuery({
    queryKey: MY_SUBSCRIPTION,
    queryFn: getMySubscription,
    enabled: Boolean(user),
    staleTime: 60 * 1000,
  });
  // Follows the signed-in address until the reader types their own.
  const [typed, setTyped] = useState<string | null>(null);
  const [useOther, setUseOther] = useState(false);
  const email = typed ?? user?.email ?? '';

  const subscribe = useMutation({
    mutationFn: () => subscribeToNewsletter(email.trim()),
    onSuccess: (res) => {
      if (
        user?.email &&
        res.email === user.email.toLowerCase() &&
        res.result !== 'confirmation_sent'
      ) {
        queryClient.setQueryData(MY_SUBSCRIPTION, { email: user.email, subscribed: true });
      }
    },
  });

  if (subscribe.data) {
    return (
      <Notice
        className={className}
        waiting={subscribe.data.result === 'confirmation_sent'}
        {...outcomeCopy(subscribe.data)}
      />
    );
  }

  if (user && mine.data?.subscribed && !useOther) {
    return (
      <Notice
        className={className}
        title="You're subscribed."
        detail={`New articles arrive at ${mine.data.email}.`}
        action={
          <button
            type="button"
            onClick={() => {
              setUseOther(true);
              setTyped('');
            }}
            className="mt-2 text-xs font-medium text-brand-blue underline-offset-4 hover:underline"
          >
            Subscribe a different address
          </button>
        }
      />
    );
  }

  return (
    <div className={className}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          subscribe.mutate();
        }}
        className="flex items-center gap-1 rounded-full border border-input bg-background p-1 pl-4 transition-colors focus-within:border-brand-blue"
      >
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setTyped(e.target.value)}
          required
          autoComplete="email"
          aria-label="Email address"
          disabled={subscribe.isPending}
          className="h-9 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button type="submit" disabled={subscribe.isPending} className="btn-pill shrink-0">
          {subscribe.isPending ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {subscribe.isError && (
        <p className="mt-2 pl-4 text-xs text-destructive">{readableError(subscribe.error)}</p>
      )}
    </div>
  );
}

export function NewsletterSignup({
  variant = 'default',
  subscriberCount,
  className,
}: NewsletterSignupProps) {
  if (variant === 'compact') {
    return (
      <div className={className}>
        <SignupForm />
        <p className="mt-3 text-xs text-muted-foreground">New essays only. Unsubscribe anytime.</p>
      </div>
    );
  }

  return (
    <Panel
      className={cn('grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-12', className)}
    >
      <div>
        <Eyebrow>Newsletter</Eyebrow>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
          {siteConfig.newsletter.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {siteConfig.newsletter.description}
        </p>
      </div>
      <div>
        <SignupForm />
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 pl-4">
          {subscriberCount ? (
            <span className="ledger-label">
              <span className="text-foreground">{subscriberCount.toLocaleString()}</span>{' '}
              {subscriberCount === 1 ? 'reader' : 'readers'}
            </span>
          ) : null}
          <span className="ledger-label">Free</span>
          <span className="ledger-label">No spam</span>
          <span className="ledger-label">1-click unsubscribe</span>
        </div>
      </div>
    </Panel>
  );
}
