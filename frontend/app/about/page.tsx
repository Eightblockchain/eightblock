import Link from 'next/link';
import { ArrowUpRight, Github, Globe, Linkedin, Mail, MapPin, Twitter } from 'lucide-react';
import type { Metadata } from 'next';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { SupportCreator } from '@/components/support/support-creator';
import { Eyebrow, SectionHeader } from '@eightblock/ui/components/section-header';
import { Panel, PanelBar } from '@eightblock/ui/components/panel';
import { Avatar } from '@eightblock/ui/components/avatar';
import { siteConfig } from '@/lib/site-config';
import { getPortfolio, paragraphs, type PortfolioLinks } from '@/lib/portfolio';
import { ogImagePath, pageMetadata } from '@/lib/page-metadata';
import { fetchSupportWallets } from '@/lib/support-wallets';

export async function generateMetadata(): Promise<Metadata> {
  const portfolio = await getPortfolio();
  const description = portfolio.intro || `About ${siteConfig.author}. ${siteConfig.description}`;
  return pageMetadata({
    title: 'About',
    description,
    path: '/about',
    image: ogImagePath({
      title: `About ${siteConfig.author}`,
      description,
      eyebrow: siteConfig.role,
      topics: siteConfig.networks,
    }),
  });
}

const pad = (n: number) => String(n).padStart(2, '0');

const linkMeta: Record<keyof PortfolioLinks, { label: string; icon: typeof Github }> = {
  website: { label: 'Website', icon: Globe },
  github: { label: 'GitHub', icon: Github },
  twitter: { label: 'X / Twitter', icon: Twitter },
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  email: { label: 'Email', icon: Mail },
};

function linkHref(key: keyof PortfolioLinks, value: string) {
  return key === 'email' ? `mailto:${value}` : value;
}

function displayHost(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const [portfolio, supportWallets] = await Promise.all([getPortfolio(), fetchSupportWallets()]);
  const story = paragraphs(portfolio.story);
  const links = (Object.keys(linkMeta) as (keyof PortfolioLinks)[])
    .filter((key) => portfolio.links[key])
    .map((key) => ({ key, href: linkHref(key, portfolio.links[key]!), ...linkMeta[key] }));

  return (
    <>
      <section className="border-b border-border">
        <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <Eyebrow>About</Eyebrow>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">
              {portfolio.name}
              {portfolio.headline && (
                <span className="mt-2 block text-2xl font-medium leading-snug tracking-[-0.02em] text-muted-foreground sm:text-3xl">
                  {portfolio.headline}
                </span>
              )}
            </h1>
            {portfolio.intro && (
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {portfolio.intro}
              </p>
            )}
            {(portfolio.location || links.length > 0) && (
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                {portfolio.location && (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {portfolio.location}
                  </span>
                )}
                {links.length > 0 && (
                  <div className="flex items-center gap-1">
                    {links.map(({ key, href, label, icon: Icon }) => (
                      <a
                        key={key}
                        href={href}
                        target={key === 'email' ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <Panel>
              <PanelBar>
                <span>Author</span>
                <span>Focus areas</span>
              </PanelBar>
              <div className="flex items-center gap-5 border-b border-border p-5">
                <Avatar
                  src={portfolio.avatarUrl}
                  name={portfolio.name}
                  size="2xl"
                  className="border border-border"
                />
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold text-foreground">
                    {portfolio.name}
                  </p>
                  {portfolio.headline && (
                    <p className="mt-1 text-sm leading-snug text-muted-foreground">
                      {portfolio.headline}
                    </p>
                  )}
                </div>
              </div>
              <ul>
                {portfolio.focusAreas.map((area, i) => (
                  <li
                    key={area}
                    className="flex items-center gap-4 border-b border-border px-5 py-3 text-sm text-foreground last:border-b-0"
                  >
                    <span className="font-mono text-[11px] text-brand-blue">{pad(i + 1)}</span>
                    {area}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SectionHeader index="01" label={`Why I built ${siteConfig.name}`} className="mb-6" />
            <div className="space-y-5">
              {story.map((paragraph, i) => (
                <p
                  key={i}
                  className="whitespace-pre-line text-lg leading-relaxed text-foreground/90"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-12 grid border-l border-t border-border sm:grid-cols-3">
              {siteConfig.principles.map((principle, i) => (
                <div key={principle.title} className="border-b border-r border-border p-5">
                  <span className="font-mono text-[11px] text-brand-blue">{pad(i + 1)}</span>
                  <h3 className="mt-6 font-display text-base font-semibold text-foreground">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {principle.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <SupportCreator wallets={supportWallets} />

            <Panel marks={false}>
              <PanelBar>
                <span>Connect</span>
              </PanelBar>
              <ul>
                {links.map(({ key, href, label, icon: Icon }) => (
                  <li key={key} className="border-b border-border last:border-b-0">
                    <a
                      href={href}
                      target={key === 'email' ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between px-5 py-3.5 text-sm text-foreground transition-colors hover:text-brand-blue"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-brand-blue" />
                        {label}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-blue" />
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    href="/writing"
                    className="group flex items-center justify-between px-5 py-3.5 text-sm text-foreground transition-colors hover:text-brand-blue"
                  >
                    Read the articles
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-blue" />
                  </Link>
                </li>
              </ul>
            </Panel>
          </div>
        </div>
      </section>

      {portfolio.projects.length > 0 && (
        <section className="border-b border-border">
          <div className="container-page py-16 sm:py-20">
            <SectionHeader index="02" label="Projects" className="mb-8" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.projects.map((project, i) => {
                const host = displayHost(project.url);
                const body = (
                  <Panel
                    marks={false}
                    className="flex h-full flex-col p-6 transition-colors group-hover:border-foreground/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-mono text-[11px] text-brand-blue">{pad(i + 1)}</span>
                      {project.url && (
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-brand-blue" />
                      )}
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-foreground">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                    {host && <p className="ledger-label mt-6">{host}</p>}
                  </Panel>
                );
                return project.url ? (
                  <a
                    key={`${project.name}-${i}`}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    {body}
                  </a>
                ) : (
                  <div key={`${project.name}-${i}`}>{body}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section id="newsletter" className="scroll-mt-20">
        <div className="container-page py-16 sm:py-20">
          <NewsletterSignup />
        </div>
      </section>
    </>
  );
}
