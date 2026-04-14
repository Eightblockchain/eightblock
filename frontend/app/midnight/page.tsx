import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Code2, Zap, Lock, BookOpen, ArrowRight, Layers, Eye, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Midnight Hub – Privacy-First Blockchain',
  description:
    'Your comprehensive resource for Midnight Network. Learn about privacy-preserving smart contracts, Zero-Knowledge proofs, Compact language, and more.',
  openGraph: {
    title: 'Midnight Hub | Eightblock',
    description:
      'Privacy-first blockchain education. Deep-dive into Midnight Network, ZK proofs, and the Compact language.',
  },
};

const ecosystemPillars = [
  {
    icon:        Shield,
    title:       'Privacy by Design',
    description:
      'Midnight uses ZK proofs to allow smart contracts to process private data without exposing it on-chain.',
  },
  {
    icon:        Code2,
    title:       'Compact Language',
    description:
      'A TypeScript-inspired language designed specifically for writing privacy-preserving smart contracts.',
  },
  {
    icon:        Layers,
    title:       'Shielded UTXO',
    description:
      'Built on a shielded UTXO model that enables selective disclosure and granular privacy control.',
  },
  {
    icon:        Eye,
    title:       'Selective Disclosure',
    description:
      'Prove facts about data without revealing the underlying data itself using ZK circuits.',
  },
];

const learningPaths = [
  {
    level:  'Beginner',
    badge:  'Start Here',
    icon:   BookOpen,
    color:  'gold' as const,
    topics: [
      'What is Midnight Network?',
      'Blockchain Privacy Basics',
      'The UTXO Model Explained',
      'Setting Up Your Dev Environment',
    ],
  },
  {
    level:  'Intermediate',
    badge:  'Builder',
    icon:   Code2,
    color:  'blue' as const,
    topics: [
      'Compact Language Primer',
      'Building Private DApps',
      'Zero-Knowledge in Plain English',
      'Token Standards on Midnight',
    ],
  },
  {
    level:  'Advanced',
    badge:  'Expert',
    icon:   Zap,
    color:  'gold' as const,
    topics: [
      'ZK Circuit Design Patterns',
      'Midnight Protocol Deep-Dive',
      'Selective Disclosure Architecture',
      'Cross-Chain Privacy Bridges',
    ],
  },
];

const colorMap = {
  gold: {
    text:   'text-primary',
    bg:     'bg-primary/10',
    border: 'border-primary/25',
    badge:  'bg-primary/10 text-primary border border-primary/25',
    dot:    'bg-primary/60',
  },
  blue: {
    text:   'text-accent',
    bg:     'bg-accent/10',
    border: 'border-accent/25',
    badge:  'bg-accent/10 text-accent border border-accent/25',
    dot:    'bg-accent/60',
  },
};

// ─── Server Component ───────────────────────────────────────────────────────
export default function MidnightPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-bg" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-8">
            <Shield className="h-3 w-3" />
            Midnight Network Hub
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            <span className="text-primary">
              Midnight Hub
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
            Your comprehensive resource for learning Midnight Network — from first principles
            to advanced privacy-preserving smart contract development with Compact.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground px-8"
              asChild
            >
              <Link href="/#articles">
                Browse Articles <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:border-primary/40 hover:bg-primary/5 px-8"
              asChild
            >
              <a href="https://midnight.network" target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                Official Docs
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Why Midnight ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Why Midnight?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Understanding the four pillars of privacy-first blockchain
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ecosystemPillars.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(255,190,13,0.08)] transition-all duration-300"
              >
                <div className="inline-flex p-2.5 rounded-lg bg-primary/10 mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learning Paths ────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Learning Paths</h2>
            <p className="text-muted-foreground">
              Structured guides from zero to advanced — follow the path that fits you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learningPaths.map((path) => {
              const c = colorMap[path.color];
              const Icon = path.icon;
              return (
                <div
                  key={path.level}
                  className={`p-7 rounded-xl border ${c.border} bg-card/50 hover:bg-card transition-all duration-300 flex flex-col gap-5`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex p-2.5 rounded-lg ${c.bg}`}>
                      <Icon className={`h-5 w-5 ${c.text}`} />
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${c.badge}`}>
                      {path.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${c.text}`}>{path.level} Track</h3>
                    <p className="text-xs text-muted-foreground">Topics covered:</p>
                  </div>

                  <ul className="space-y-2.5 flex-1">
                    {path.topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className={`mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="relative p-10 sm:p-12 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

            <div className="relative">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-5">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Build?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Join the growing community of developers building the next generation of
                privacy-preserving applications on Midnight Network.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground px-8"
                  asChild
                >
                  <Link href="/">
                    Browse All Articles <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:border-primary/40 hover:bg-primary/5"
                  asChild
                >
                  <a href="https://github.com/Eightblockchain/eightblock" target="_blank" rel="noopener noreferrer">
                    Contribute on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
