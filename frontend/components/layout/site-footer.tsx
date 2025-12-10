import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t bg-white dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Left side - Links */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-[#080808] dark:hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#080808] dark:hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contributors"
              className="hover:text-[#080808] dark:hover:text-foreground transition-colors"
            >
              Contributors
            </Link>
            <Link
              href="/github"
              className="hover:text-[#080808] dark:hover:text-foreground transition-colors"
            >
              GitHub Repository
            </Link>
          </div>

          {/* Right side - Social Icons */}
          <div className="flex gap-3">
            <a
              href="https://github.com/Eightblockchain/eightblock"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#080808] dark:bg-foreground p-2 text-white dark:text-background transition-transform hover:scale-110"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com/eightblock"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#080808] dark:bg-foreground p-2 text-white dark:text-background transition-transform hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com/company/eightblock"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#080808] dark:bg-foreground p-2 text-white dark:text-background transition-transform hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-muted-foreground">
          © {new Date().getFullYear()} eightblock. Built by the Cardano community. Open source
          under MIT License.
        </div>
      </div>
    </footer>
  );
}
