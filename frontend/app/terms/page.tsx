import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | EightBlock',
  description: 'Terms of Service for EightBlock — the rules and guidelines for using our platform.',
};

const sections = [
  { id: 'agreement', title: 'Agreement to Terms' },
  { id: 'eligibility', title: 'Eligibility' },
  { id: 'account', title: 'Wallet Authentication' },
  { id: 'content', title: 'User Content' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'ip', title: 'Intellectual Property' },
  { id: 'disclaimer', title: 'Blockchain Disclaimer' },
  { id: 'liability', title: 'Liability & Warranties' },
  { id: 'opensource', title: 'Open Source' },
  { id: 'availability', title: 'Service Availability' },
  { id: 'termination', title: 'Termination' },
  { id: 'changes', title: 'Changes to Terms' },
  { id: 'governing-law', title: 'Governing Law' },
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

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[13px] text-amber-700 dark:text-amber-300/70">
      {children}
    </div>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
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
            Terms of Service
          </h1>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60
              bg-muted/40 px-3 py-1 text-[12px] text-muted-foreground/60">
              <Scale className="h-3 w-3" />
              Last Updated: December 10, 2025
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 items-start">

          {/* Main content */}
          <div className="space-y-4">

            <SectionCard id="agreement" num="01" title="Agreement to Terms">
              <p>
                Welcome to EightBlock. By accessing or using our platform, you agree to be bound
                by these Terms of Service (&ldquo;Terms&rdquo;). If you disagree with any part,
                you may not access the platform.
              </p>
              <p>
                EightBlock is an open-source, decentralized blockchain education and publishing
                platform that enables users to create, share, and engage with educational content
                about blockchain technology, with a focus on the Cardano ecosystem.
              </p>
            </SectionCard>

            <SectionCard id="eligibility" num="02" title="Eligibility">
              <p>
                You must be at least 13 years old to use EightBlock. By using this platform, you
                represent and warrant that you meet this age requirement and have the legal capacity
                to enter into these Terms.
              </p>
            </SectionCard>

            <SectionCard id="account" num="03" title="Wallet Authentication">
              <SubHeading>Wallet-Based Authentication</SubHeading>
              <p>To access certain features, you must:</p>
              <BulletList items={[
                'Connect a compatible Cardano wallet (e.g., Nami, Eternl, Flint)',
                'Sign authentication messages to verify ownership',
                'Maintain the security of your wallet and private keys',
              ]} />

              <SubHeading>Account Security</SubHeading>
              <p>You are responsible for:</p>
              <BulletList items={[
                'Safeguarding your wallet credentials and private keys',
                'All activities that occur through your wallet address',
                'Immediately notifying us of any unauthorized use',
              ]} />

              <Warning>
                <strong>Important:</strong> We never have access to your private keys or seed
                phrases. Loss of wallet access is irreversible — we cannot recover your account.
              </Warning>
            </SectionCard>

            <SectionCard id="content" num="04" title="User Content">
              <SubHeading>Content Ownership</SubHeading>
              <p>
                You retain all rights to the content you create. By posting, you grant us a
                worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and
                distribute your content for the purpose of operating and promoting the platform.
              </p>

              <SubHeading>Content Standards</SubHeading>
              <p>All content must:</p>
              <BulletList items={[
                'Be accurate and not misleading',
                'Respect intellectual property rights',
                'Not contain malicious code or spam',
                'Not promote illegal activities',
                'Not harass, abuse, or harm others',
                'Not violate any applicable laws or regulations',
              ]} />

              <SubHeading>Content Moderation</SubHeading>
              <p>
                We reserve the right to remove content that violates these Terms. Content moderation
                follows community guidelines and transparent processes as an open-source platform.
              </p>
            </SectionCard>

            <SectionCard id="acceptable-use" num="05" title="Acceptable Use">
              <p>You agree NOT to:</p>
              <BulletList items={[
                'Use the platform for any unlawful purpose',
                'Impersonate any person or entity',
                'Interfere with or disrupt platform operation',
                'Attempt to gain unauthorized access to any systems',
                'Scrape, crawl, or use automated tools without permission',
                'Upload viruses, malware, or malicious code',
                'Manipulate voting, engagement, or ranking systems',
                'Create multiple accounts to circumvent restrictions',
              ]} />
            </SectionCard>

            <SectionCard id="ip" num="06" title="Intellectual Property">
              <SubHeading>Platform Code</SubHeading>
              <p>
                EightBlock is open-source software licensed under the MIT License. You can view,
                fork, and contribute to the codebase on{' '}
                <Link href="/github" className="text-primary/80 hover:text-primary underline underline-offset-2">
                  GitHub
                </Link>.
              </p>

              <SubHeading>Trademarks</SubHeading>
              <p>
                &ldquo;EightBlock&rdquo; and related logos are trademarks. You may not use them
                without prior written permission, except as allowed by the open-source license for
                attribution purposes.
              </p>

              <SubHeading>Third-Party Content</SubHeading>
              <p>
                You are responsible for ensuring you have the right to use any third-party content
                in your articles. We respect DMCA and similar copyright protection mechanisms.
              </p>
            </SectionCard>

            <SectionCard id="disclaimer" num="07" title="Blockchain Disclaimer">
              <p>EightBlock provides educational content about blockchain technology. Please note:</p>
              <BulletList items={[
                'Content is for informational purposes only, not financial advice',
                'Cryptocurrency investments carry significant risk',
                'We are not responsible for financial decisions made based on platform content',
                'Always conduct your own research and consult financial advisors',
                'Blockchain transactions are irreversible',
              ]} />
            </SectionCard>

            <SectionCard id="liability" num="08" title="Liability & Warranties">
              <SubHeading>No Warranty</SubHeading>
              <p>
                THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
                IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
              </p>

              <SubHeading>Limitation of Liability</SubHeading>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, EIGHTBLOCK AND ITS CONTRIBUTORS SHALL NOT
                BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, OR ANY
                LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>

              <SubHeading>Indemnification</SubHeading>
              <p>
                You agree to indemnify and hold harmless EightBlock and its contributors from any
                claims, damages, and expenses (including legal fees) arising from your use of the
                platform or violation of these Terms.
              </p>
            </SectionCard>

            <SectionCard id="opensource" num="09" title="Open Source Contributions">
              <p>By submitting code, documentation, or other contributions:</p>
              <BulletList items={[
                'You grant us and the community the right to use your contribution under the MIT License',
                'You confirm you have the right to make the contribution',
                <span key="link">You agree to follow our <Link href="/contributors" className="text-primary/80 hover:text-primary underline underline-offset-2">contribution guidelines</Link></span>,
              ]} />
            </SectionCard>

            <SectionCard id="availability" num="10" title="Service Availability">
              <p>We strive to maintain availability but cannot guarantee uninterrupted access. The platform may be unavailable due to:</p>
              <BulletList items={[
                'Scheduled maintenance',
                'Technical issues or outages',
                'Security incidents',
                'Force majeure events',
              ]} />
              <p>We are not liable for losses resulting from platform unavailability.</p>
            </SectionCard>

            <SectionCard id="termination" num="11" title="Termination">
              <p>
                We may terminate or suspend your access immediately, without prior notice, for any
                reason including breach of these Terms. Upon termination:
              </p>
              <BulletList items={[
                'Your right to use the platform ceases immediately',
                'You may request deletion of your data (subject to legal requirements)',
                'Provisions that should survive termination will remain in effect',
              ]} />
            </SectionCard>

            <SectionCard id="changes" num="12" title="Changes to Terms">
              <p>
                We reserve the right to modify these Terms at any time. Changes are effective when
                posted with an updated &ldquo;Last Updated&rdquo; date. Continued use after changes
                constitutes acceptance.
              </p>
              <p>
                As an open-source project, major Terms changes will be discussed transparently via
                GitHub issues when possible.
              </p>
            </SectionCard>

            <SectionCard id="governing-law" num="13" title="Governing Law">
              <p>
                These Terms shall be governed by and construed in accordance with applicable laws.
                Disputes shall be resolved through:
              </p>
              <BulletList items={[
                'Good faith negotiations',
                'Mediation or arbitration if negotiations fail',
                'Jurisdiction in appropriate courts as a last resort',
              ]} />
            </SectionCard>

            <SectionCard id="contact" num="14" title="Contact">
              <p>For questions about these Terms:</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 dark:border-border/30 bg-muted/30 px-4 py-2.5">
                  <span className="font-mono text-[11px] text-muted-foreground/50 w-14">GitHub</span>
                  <a
                    href="https://github.com/Eightblockchain/eightblock/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[13px] text-primary/70 hover:text-primary"
                  >
                    Report an issue <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 dark:border-border/30 bg-muted/30 px-4 py-2.5">
                  <span className="font-mono text-[11px] text-muted-foreground/50 w-14">Email</span>
                  <a href="mailto:info@eightblock.dev" className="text-[13px] text-primary/70 hover:text-primary">
                    info@eightblock.dev
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
                  { href: '/privacy', label: 'Privacy Policy' },
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
