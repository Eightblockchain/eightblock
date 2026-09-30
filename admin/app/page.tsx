'use client';

import Link from 'next/link';
import { ArrowUpRight, BarChart3, FileText, Mail, PenLine, UserRound, Users } from 'lucide-react';
import { Panel } from '@eightblock/ui/components/panel';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { siteHref } from '@/lib/site-config';

const actions = [
  {
    href: '/analytics',
    title: 'Analytics',
    body: 'Visitors, sources, top articles and every activity on the site.',
    icon: BarChart3,
  },
  {
    href: '/newsletter',
    title: 'Newsletter',
    body: 'See subscribers, compose and send campaigns.',
    icon: Mail,
  },
  {
    href: '/users',
    title: 'Users and roles',
    body: 'Give readers writer access so they can publish.',
    icon: Users,
  },
  {
    href: '/portfolio',
    title: 'Portfolio',
    body: 'Edit your story, projects and links on the About page.',
    icon: UserRound,
  },
  {
    href: siteHref('/articles/new'),
    title: 'Write an article',
    body: 'Opens the editor on the blog and starts a new draft.',
    icon: PenLine,
  },
  {
    href: siteHref('/my-articles'),
    title: 'Your articles',
    body: 'Drafts, published pieces and their numbers, on the blog.',
    icon: FileText,
  },
];

export default function AdminOverviewPage() {
  const { data: user } = useCurrentUser();
  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="container-page py-14">
      <Eyebrow>Overview</Eyebrow>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
        {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Everything you need to run Eightblock and reach your readers.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map(({ href, title, body, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Panel className="h-full p-6 transition-colors group-hover:border-foreground/40">
              <div className="flex items-start justify-between">
                <Icon className="h-5 w-5 text-brand-blue" />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
              </div>
              <h2 className="mt-8 font-display text-lg font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
