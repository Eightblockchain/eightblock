'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Lock, Zap, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Lock, text: 'Privacy-preserving smart contracts', accent: false },
  { icon: Zap,  text: 'Zero-knowledge proof system',       accent: true },
  { icon: Eye,  text: 'Selective disclosure of data',      accent: false },
];

export function MidnightCallout() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row items-center gap-10 p-8 sm:p-10 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm"
        >
          {/* Left: Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-5">
              <Shield className="h-3 w-3" />
              Midnight Network Hub
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              The Future of{' '}
              <span className="text-primary">
                Private Web3
              </span>
            </h2>

            <p className="text-muted-foreground mb-6 max-w-lg leading-relaxed">
              Midnight brings privacy-first smart contracts to blockchain. Master everything from
              beginner guides to advanced ZK circuits and the Compact programming language.
            </p>

            <ul className="space-y-2.5 mb-8">
              {features.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className={`flex-shrink-0 p-1.5 rounded-md ${f.accent ? 'bg-accent/10' : 'bg-primary/10'}`}>
                    <f.icon className={`h-3.5 w-3.5 ${f.accent ? 'text-accent' : 'text-primary'}`} />
                  </div>
                  {f.text}
                </li>
              ))}
            </ul>

            <Button
              asChild
              className="group bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground"
            >
              <Link href="/midnight">
                Explore Midnight Hub
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Right: Visual orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-shrink-0 hidden sm:block"
          >
            <div className="relative w-52 h-52">
              <div className="relative w-full h-full rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-accent/40 bg-accent/5 flex items-center justify-center">
                  <Shield className="h-14 w-14 text-primary opacity-80" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
