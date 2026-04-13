import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | EightBlock',
  description: 'Privacy Policy for EightBlock — how we collect, use, and protect your information.',
};

const sections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-collected', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use Information' },
  { id: 'data-storage', title: 'Data Storage & Security' },
  { id: 'data-sharing', title: 'Data Sharing' },
  { id: 'blockchain', title: 'Blockchain & Wallet Data' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'cookies', title: 'Cookies & Tracking' },
  { id: 'third-party', title: 'Third-Party Services' },
  { id: 'children', title: "Children's Privacy" },
  { id: 'changes', title: 'Changes to Policy' },
  { id: 'contact', title: 'Contact' },
];

function SectionCard({
  id, num, title, children,
}: { id: string; num: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <div className="rounded-2xl border border-border bg-card dark:border-border/40 p-6 sm:p-7">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/50 tabular-nums">
            {num}
          </span>
          <div className="h-px flex-1 bg-border/50 dark:bg-border/25" />
          <h2 className="text-[17px] font-black text-foreground">{title}</h2>
        </div>
        <div className="text-[14px] leading-relaxed text-muted-foreground/70 space-y-3">
          {children}
        </div>
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[14px] font-bold text-foreground mt-5 mb-1.5">{children}</h3>;
}

function BulletList({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-1.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-[7px] h-1 w-1 rounded-full bg-primary/40 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border/50 dark:border-border/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_-10%,hsl(var(--primary)/0.07),transparent)]" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)/0.04) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--primary)/0.04) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-px w-5 bg-primary/50" />
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
              Legal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-none mb-3">
            Privacy Policy
          </h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60
              bg-muted/40 px-3 py-1 text-[12px] text-muted-foreground/60">
              <Shield className="h-3 w-3" />
              Last Updated: December 10, 2025
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 items-start">

          {/* Main content */}
          <div className="space-y-4">

            <SectionCard id="introduction" num="01" title="Introduction">
              <p>
                EightBlock (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed
                to protecting your privacy. This Privacy Policy explains how we collect, use, and
                safeguard information when you use our platform.
              </p>
              <p>
                As an open-source project focused on blockchain education, we aim to be transparent
                about our data practices. We collect only what is necessary to provide our service.
              </p>
            </SectionCard>

            <SectionCard id="information-collected" num="02" title="Information We Collect">
              <SubHeading>Information You Provide</SubHeading>
              <BulletList items={[
                'Wallet address (used for authentication)',
                'Profile information (username, bio, avatar)',
                'Articles, comments, and other content you create',
                'Bookmark preferences and settings',
              ]} />

              <SubHeading>Automatically Collected</SubHeading>
              <BulletList items={[
                'Usage data (pages visited, articles read, time spent)',
                'Device and browser type',
                'IP address (for analytics and security)',
                'Referral source',
              ]} />

              <SubHeading>What We Do NOT Collect</SubHeading>
              <BulletList items={[
                'Private keys or seed phrases',
                'Financial account information',
                'Government ID or personal documents',
                'Location beyond country/region level',
              ]} />
            </SectionCard>

            <SectionCard id="how-we-use" num="03" title="How We Use Information">
              <p>We use collected information to:</p>
              <BulletList items={[
                'Authenticate your wallet and maintain your session',
                'Display your profile and content across the platform',
                'Improve platform features and user experience',
                'Analyze usage trends and platform performance',
                'Prevent abuse, spam, and security threats',
                'Send important platform notifications (opt-in only)',
              ]} />
            </SectionCard>

            <SectionCard id="data-storage" num="04" title="Data Storage & Security">
              <p>
                Your data is stored on secure servers. We implement industry-standard security
                measures including:
              </p>
              <BulletList items={[
                'HTTPS encryption for all data in transit',
                'Hashed and salted credentials',
                'Regular security audits',
                'Access controls and principle of least privilege',
              ]} />
              <p className="mt-3 text-[13px] text-muted-foreground/50">
                No system is 100% secure. We encourage you to use strong wallet security practices
                and report any suspected vulnerabilities responsibly.
              </p>
            </SectionCard>

            <SectionCard id="data-sharing" num="05" title="Data Sharing">
              <p>
                We do not sell or rent your personal data. We may share information with:
              </p>
              <BulletList items={[
                'Service providers who help operate the platform (under strict data agreements)',
                'Analytics services (with anonymized/aggregated data only)',
                'Legal authorities when required by law or to protect rights',
              ]} />
              <p>
                As an open-source project, some aggregated, non-identifying platform metrics may
                be publicly reported for transparency.
              </p>
            </SectionCard>

            <SectionCard id="blockchain" num="06" title="Blockchain & Wallet Data">
              <p>
                Blockchain technology is inherently public. When you authenticate via a Cardano
                wallet:
              </p>
              <BulletList items={[
                'Your wallet address is publicly visible on the blockchain',
                'Your on-chain transaction history is public by nature',
                'We only store your wallet address — never private keys',
                'Wallet authentication happens client-side via your wallet app',
              ]} />
              <p className="text-[13px] text-muted-foreground/50">
                We have no ability to access or control your wallet funds or private keys at any
                time.
              </p>
            </SectionCard>

            <SectionCard id="your-rights" num="07" title="Your Rights">
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <BulletList items={[
                'Access the personal data we hold about you',
                'Correct inaccurate or outdated information',
                'Request deletion of your account and data',
                'Export your data in a portable format',
                'Opt out of marketing communications',
                'Lodge a complaint with a supervisory authority',
              ]} />
              <p>
                To exercise any of these rights, contact us using the information in the Contact
                section below.
              </p>
            </SectionCard>

            <SectionCard id="cookies" num="08" title="Cookies & Tracking">
              <p>
                We use minimal cookies and local storage to:
              </p>
              <BulletList items={[
                'Maintain your authentication session',
                'Remember your theme and display preferences',
                'Analyze anonymous usage patterns',
              ]} />
              <p>
                We do not use third-party advertising cookies or invasive tracking technologies.
                You can manage cookies through your browser settings.
              </p>
            </SectionCard>

            <SectionCard id="third-party" num="09" title="Third-Party Services">
              <p>Our platform integrates with:</p>
              <BulletList items={[
                'GitHub — for repository and contributor data (GitHub Privacy Policy applies)',
                'Cardano wallet providers — for authentication',
                'CDN and hosting providers — for content delivery',
              ]} />
              <p>
                We are not responsible for the privacy practices of third-party services. We
                encourage you to review their policies.
              </p>
            </SectionCard>

            <SectionCard id="children" num="10" title="Children's Privacy">
              <p>
                EightBlock is not intended for children under 13. We do not knowingly collect
                personal data from children. If you believe we have inadvertently collected such
                data, please contact us immediately and we will delete it promptly.
              </p>
            </SectionCard>

            <SectionCard id="changes" num="11" title="Changes to Policy">
              <p>
                We may update this Privacy Policy from time to time. Changes are reflected with an
                updated &ldquo;Last Updated&rdquo; date at the top of this page. Continued use of
                the platform following changes constitutes acceptance of the updated policy.
              </p>
              <p>
                As an open-source project, significant policy changes will be discussed in our
                GitHub repository for community input when possible.
              </p>
            </SectionCard>

            <SectionCard id="contact" num="12" title="Contact">
              <p>
                Questions about this Privacy Policy or data requests? Reach out to us:
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 dark:border-border/30 bg-muted/30 px-4 py-2.5">
                  <span className="font-mono text-[11px] text-muted-foreground/50 w-14">GitHub</span>
                  <a
                    href="https://github.com/Eightblockchain/eightblock/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[13px] text-primary/70 hover:text-primary"
                  >
                    Open an issue <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 dark:border-border/30 bg-muted/30 px-4 py-2.5">
                  <span className="font-mono text-[11px] text-muted-foreground/50 w-14">Email</span>
                  <a href="mailto:privacy@eightblock.dev" className="text-[13px] text-primary/70 hover:text-primary">
                    privacy@eightblock.dev
                  </a>
                </div>
              </div>
            </SectionCard>

          </div>

          {/* ── Sticky TOC sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-6 rounded-2xl border border-border bg-card dark:border-border/40 p-5">
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground/40 mb-3">
                Contents
              </p>
              <nav className="space-y-0.5">
                {sections.map(({ id, title }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground/60
                      hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/25
                      transition-colors duration-100"
                  >
                    {title}
                  </a>
                ))}
              </nav>

              <div className="mt-5 pt-4 border-t border-border/50 dark:border-border/25 space-y-1">
                {[
                  { href: '/terms', label: 'Terms of Service' },
                  { href: '/github', label: 'GitHub' },
                  { href: '/contributors', label: 'Contributors' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="block rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground/50
                      hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/25 transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
