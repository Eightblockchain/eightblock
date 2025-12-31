import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t bg-white dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Left side - Links */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/contributors" className="hover:text-primary transition-colors">
              Contributors
            </Link>
            <Link href="/github" className="hover:text-primary transition-colors">
              GitHub Repository
            </Link>
          </div>

          {/* Right side - Social Icons */}
          <div className="flex gap-3">
            <a
              href="https://github.com/Eightblockchain/eightblock"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary p-2.5 text-white shadow-md transition-all hover:bg-primary-600 hover:scale-110"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/Eightblock66103"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary p-2.5 text-white shadow-md transition-all hover:bg-primary-600 hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/eightblock/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary p-2.5 text-white shadow-md transition-all hover:bg-primary-600 hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}{' '}
            <span className="font-semibold text-foreground">Eightblock</span>
            {' • '}Built with ❤️ by the Cardano community
            {' • '}Open source under{' '}
            <a
              href="https://github.com/Eightblockchain/eightblock/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              MPL-2.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
