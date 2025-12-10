import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | EightBlock',
  description:
    'Terms of Service for EightBlock - Learn about the rules and guidelines for using our platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last Updated: December 10, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="mb-4">
              Welcome to EightBlock. By accessing or using our platform, you agree to be bound by
              these Terms of Service (&ldquo;Terms&rdquo;). If you disagree with any part of these
              terms, you may not access the platform.
            </p>
            <p className="mb-4">
              EightBlock is an open-source, decentralized blockchain education and publishing
              platform that enables users to create, share, and engage with educational content
              about blockchain technology, with a focus on the Cardano ecosystem.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Eligibility</h2>
            <p className="mb-4">
              You must be at least 13 years old to use EightBlock. By using this platform, you
              represent and warrant that you meet this age requirement and have the legal capacity
              to enter into these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Account and Wallet Authentication</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">Wallet-Based Authentication</h3>
            <p className="mb-4">
              EightBlock uses Cardano wallet-based authentication. To access certain features, you
              must:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Connect a compatible Cardano wallet (e.g., Nami, Eternl, Flint)</li>
              <li>Sign authentication messages to verify ownership</li>
              <li>Maintain the security of your wallet and private keys</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Account Security</h3>
            <p className="mb-4">You are responsible for:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Safeguarding your wallet credentials and private keys</li>
              <li>All activities that occur through your wallet address</li>
              <li>Immediately notifying us of any unauthorized use</li>
            </ul>
            <p className="mb-4">
              <strong>Important:</strong> We never have access to your private keys or seed phrases.
              Loss of wallet access is irreversible and we cannot recover your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Content</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">Content Ownership</h3>
            <p className="mb-4">
              You retain all rights to the content you create and publish on EightBlock, including
              articles, comments, and profile information. By posting content, you grant us a
              worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and
              distribute your content for the purpose of operating and promoting the platform.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Content Standards</h3>
            <p className="mb-4">All content must:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Be accurate and not misleading</li>
              <li>Respect intellectual property rights</li>
              <li>Not contain malicious code or spam</li>
              <li>Not promote illegal activities</li>
              <li>Not harass, abuse, or harm others</li>
              <li>Not violate any applicable laws or regulations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Content Moderation</h3>
            <p className="mb-4">
              We reserve the right to remove or modify content that violates these Terms, though we
              are not obligated to monitor all user-generated content. As an open-source platform,
              content moderation follows community guidelines and transparent processes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptable Use Policy</h2>
            <p className="mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Use the platform for any unlawful purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the platform&apos;s operation</li>
              <li>Attempt to gain unauthorized access to any systems</li>
              <li>Scrape, crawl, or use automated tools without permission</li>
              <li>Upload viruses, malware, or malicious code</li>
              <li>Manipulate voting, engagement, or ranking systems</li>
              <li>Create multiple accounts to circumvent restrictions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property Rights</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">Platform Code</h3>
            <p className="mb-4">
              EightBlock is open-source software licensed under the MIT License. You can view, fork,
              and contribute to the codebase on{' '}
              <Link href="/github" className="text-primary hover:underline">
                GitHub
              </Link>
              .
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Trademarks</h3>
            <p className="mb-4">
              &ldquo;EightBlock&rdquo; and related logos are trademarks. You may not use them
              without prior written permission, except as allowed by the open-source license for
              attribution purposes.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Third-Party Content</h3>
            <p className="mb-4">
              You are responsible for ensuring you have the right to use any third-party content
              (images, quotes, code snippets) in your articles. We respect DMCA and similar
              copyright protection mechanisms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Blockchain and Cryptocurrency Disclaimer
            </h2>
            <p className="mb-4">
              EightBlock provides educational content about blockchain technology and
              cryptocurrencies. Please note:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Content is for informational purposes only and not financial advice</li>
              <li>Cryptocurrency investments carry significant risk</li>
              <li>We are not responsible for financial decisions made based on platform content</li>
              <li>Always conduct your own research and consult with financial advisors</li>
              <li>Blockchain transactions are irreversible</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Liability and Warranties</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">No Warranty</h3>
            <p className="mb-4">
              THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
              IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
              NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Limitation of Liability</h3>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, EIGHTBLOCK AND ITS CONTRIBUTORS SHALL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
              ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS
              OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Indemnification</h3>
            <p className="mb-4">
              You agree to indemnify and hold harmless EightBlock, its contributors, and affiliates
              from any claims, damages, losses, liabilities, and expenses (including legal fees)
              arising from your use of the platform or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Open Source Contributions</h2>
            <p className="mb-4">
              As an open-source project, we welcome contributions. By submitting code,
              documentation, or other contributions to the project:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                You grant us and the community the right to use your contribution under the MIT
                License
              </li>
              <li>You confirm you have the right to make the contribution</li>
              <li>
                You agree to follow our{' '}
                <Link href="/contributors" className="text-primary hover:underline">
                  contribution guidelines
                </Link>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
            <p className="mb-4">
              We strive to maintain platform availability but cannot guarantee uninterrupted access.
              The platform may be unavailable due to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Scheduled maintenance</li>
              <li>Technical issues or outages</li>
              <li>Security incidents</li>
              <li>Force majeure events</li>
            </ul>
            <p className="mb-4">
              We are not liable for any losses resulting from platform unavailability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="mb-4">
              Our platform integrates with third-party services (Cardano wallets, GitHub, etc.).
              These services have their own terms and privacy policies. We are not responsible for
              their practices or any issues arising from their use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your access immediately, without prior notice or
              liability, for any reason, including breach of these Terms. Upon termination:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your right to use the platform ceases immediately</li>
              <li>You may request deletion of your data (subject to legal requirements)</li>
              <li>Provisions that should survive termination will remain in effect</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. Changes will be effective when
              posted on this page with an updated &ldquo;Last Updated&rdquo; date. Continued use of
              the platform after changes constitutes acceptance of the new Terms.
            </p>
            <p className="mb-4">
              As an open-source project, major Terms changes will be discussed transparently via
              GitHub issues when possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Governing Law and Dispute Resolution</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with applicable laws,
              without regard to conflict of law provisions. Any disputes shall be resolved through:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Good faith negotiations</li>
              <li>Mediation or arbitration if negotiations fail</li>
              <li>Jurisdiction in appropriate courts as a last resort</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Severability</h2>
            <p className="mb-4">
              If any provision of these Terms is found to be unenforceable or invalid, that
              provision will be limited or eliminated to the minimum extent necessary, and the
              remaining provisions will remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="mb-4">For questions about these Terms, please contact us:</p>
            <ul className="list-none mb-4 space-y-2">
              <li>
                <strong>GitHub Issues:</strong>{' '}
                <a
                  href="https://github.com/Eightblockchain/eightblock/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Report an issue
                </a>
              </li>
              <li>
                <strong>Email:</strong> info@eightblock.dev
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Entire Agreement</h2>
            <p className="mb-4">
              These Terms, together with our Privacy Policy and any other legal notices published on
              the platform, constitute the entire agreement between you and EightBlock concerning
              your use of the platform.
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contributors" className="hover:text-foreground transition-colors">
              Contributors
            </Link>
            <Link href="/github" className="hover:text-foreground transition-colors">
              GitHub Repository
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
