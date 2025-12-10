import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | EightBlock',
  description: 'Privacy Policy for EightBlock - Learn how we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: December 10, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="mb-4">
              EightBlock (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to
              protecting your privacy. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you visit our platform, a decentralized blockchain
              education and publishing platform.
            </p>
            <p className="mb-4">
              By using EightBlock, you agree to the collection and use of information in accordance
              with this policy. If you do not agree with our policies and practices, please do not
              use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">Wallet Information</h3>
            <p className="mb-4">
              When you connect your Cardano wallet to authenticate on our platform, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your wallet address (public key)</li>
              <li>Digital signatures for authentication purposes</li>
              <li>Transaction data related to your interactions on the platform</li>
            </ul>
            <p className="mb-4">
              We do NOT have access to your private keys, seed phrases, or the ability to execute
              transactions on your behalf. All wallet interactions are performed directly through
              your wallet application.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">User-Generated Content</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Articles and blog posts you create</li>
              <li>Comments and interactions on articles</li>
              <li>Profile information (username, bio, avatar)</li>
              <li>Bookmarks and content preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Usage Data</h3>
            <p className="mb-4">
              We automatically collect certain information when you visit, use, or navigate the
              platform:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Log and usage data (IP address, browser type, device information)</li>
              <li>Article views and engagement metrics</li>
              <li>Search queries and content interactions</li>
              <li>Performance data and error logs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Authentication:</strong> Verify your identity through wallet-based
                authentication
              </li>
              <li>
                <strong>Content Delivery:</strong> Provide personalized content recommendations and
                bookmarks
              </li>
              <li>
                <strong>Platform Operations:</strong> Maintain and improve platform functionality
                and performance
              </li>
              <li>
                <strong>Analytics:</strong> Analyze usage patterns to enhance user experience
              </li>
              <li>
                <strong>Security:</strong> Detect and prevent fraudulent activities and security
                threats
              </li>
              <li>
                <strong>Communication:</strong> Send important updates about the platform (if
                subscribed to newsletter)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Storage and Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Encrypted data transmission using HTTPS/TLS protocols</li>
              <li>Secure database storage with access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Redis caching with automatic expiration for temporary data</li>
              <li>No storage of private keys or sensitive wallet credentials</li>
            </ul>
            <p className="mb-4">
              However, no method of transmission over the Internet or electronic storage is 100%
              secure. While we strive to use commercially acceptable means to protect your
              information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may
              share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Public Content:</strong> Articles, comments, and profile information you
                choose to make public
              </li>
              <li>
                <strong>Legal Compliance:</strong> When required by law or to protect our rights
              </li>
              <li>
                <strong>Service Providers:</strong> With trusted third-party services that help us
                operate the platform (hosting, analytics, email services)
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset
                sale
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Blockchain Transparency</h2>
            <p className="mb-4">
              As a blockchain-based platform, please be aware that certain activities may be
              recorded on the Cardano blockchain and are publicly visible and immutable. This
              includes:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Wallet addresses associated with your account</li>
              <li>On-chain transactions (if applicable to future features)</li>
              <li>Timestamped content signatures (if implemented)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Privacy Rights</h2>
            <p className="mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and associated data
              </li>
              <li>
                <strong>Portability:</strong> Receive your data in a structured, machine-readable
                format
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your personal data
              </li>
              <li>
                <strong>Withdrawal:</strong> Withdraw consent for data processing at any time
              </li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us using the information provided at the end
              of this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
            <p className="mb-4">
              We use essential cookies and local storage to maintain your authentication session and
              preferences. These include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Authentication tokens (stored in localStorage)</li>
              <li>User preferences and settings</li>
              <li>Session management</li>
            </ul>
            <p className="mb-4">
              You can control cookies through your browser settings, but disabling them may affect
              platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
            <p className="mb-4">Our platform integrates with third-party services:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Cardano Wallets:</strong> For authentication (Nami, Eternl, Flint, etc.)
              </li>
              <li>
                <strong>GitHub:</strong> For contributor information and repository links
              </li>
              <li>
                <strong>Analytics Services:</strong> For platform usage analysis (if implemented)
              </li>
            </ul>
            <p className="mb-4">
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
            <p className="mb-4">
              Our platform is not intended for individuals under the age of 13. We do not knowingly
              collect personal information from children. If you believe we have collected
              information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and maintained on servers located outside of
              your country of residence. We ensure appropriate safeguards are in place to protect
              your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. The updated version will be
              indicated by an updated &ldquo;Last Updated&rdquo; date. We encourage you to review
              this Privacy Policy periodically for any changes. Changes are effective when posted on
              this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Open Source Transparency</h2>
            <p className="mb-4">
              EightBlock is an open-source project. Our codebase is publicly available on GitHub,
              allowing you to verify our data handling practices. You can review our code, submit
              issues, or contribute to the project at{' '}
              <Link href="/github" className="text-primary hover:underline">
                our GitHub repository
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices,
              please contact us:
            </p>
            <ul className="list-none mb-4 space-y-2">
              <li>
                <strong>GitHub:</strong>{' '}
                <a
                  href="https://github.com/Eightblockchain/eightblock/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Open an issue
                </a>
              </li>
              <li>
                <strong>Email:</strong> info@eightblock.dev
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Acknowledgment</h2>
            <p className="mb-4">
              By using EightBlock, you acknowledge that you have read and understood this Privacy
              Policy and agree to its terms.
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
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
