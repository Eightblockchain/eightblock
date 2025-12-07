import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Left side - Links */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <Link href="/privacy" className="hover:text-[#080808]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#080808]">
              Terms
            </Link>
            <Link href="/contributors" className="hover:text-[#080808]">
              Contributors
            </Link>
            <Link
              href="https://github.com/Mechack08/eightblock"
              target="_blank"
              className="hover:text-[#080808]"
            >
              GitHub Repository
            </Link>
          </div>

          {/* Right side - Social Icons */}
          <div className="flex gap-3">
            <a
              href="https://github.com/Mechack08/eightblock"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#080808] p-2 text-white transition-transform hover:scale-110"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com/eightblock"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#080808] p-2 text-white transition-transform hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com/company/eightblock"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#080808] p-2 text-white transition-transform hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} eightblock. Built by the Cardano community.
        </div>
      </div>
    </footer>
  );
}
