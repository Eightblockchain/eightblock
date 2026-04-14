'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Circuit grid constants ──────────────────────────────────────────────────
const OFFSET = 24;
const SPACING = 48;
const SVG_W = 500;
const SVG_H = 432;

// [row, col, pulseDelay]  — 10 cols (0‑9) × 8 rows (0‑7)
const GOLD_NODES: [number, number, number][] = [
  [0, 2, 0],   [0, 7, 1.2],
  [1, 4, 0.6],
  [2, 1, 0.9], [2, 8, 1.5],
  [3, 5, 0.3],
  [4, 0, 1.8], [4, 7, 0.7],
  [5, 3, 1.1], [5, 8, 0.2],
  [6, 1, 1.4], [6, 6, 0.5],
  [7, 4, 0.8],
];

const BLUE_NODES: [number, number][] = [
  [0, 5], [1, 1], [1, 8],
  [2, 5], [3, 2], [3, 7],
  [4, 4], [4, 9], [5, 6],
  [6, 4], [7, 2], [7, 7],
];

const CIRCUIT_LINES: [[number, number], [number, number]][] = [
  [[0, 2], [1, 4]], [[0, 7], [1, 4]], [[1, 4], [2, 8]],
  [[2, 1], [3, 5]], [[3, 5], [4, 7]], [[4, 0], [5, 3]],
  [[5, 3], [4, 7]], [[5, 3], [6, 6]], [[6, 1], [7, 4]],
  [[6, 6], [7, 4]], [[5, 8], [6, 6]],
];

const nx = (col: number) => OFFSET + col * SPACING;
const ny = (row: number) => OFFSET + row * SPACING;

// ── Ticker items ─────────────────────────────────────────────────────────────
const TICKER = [
  'ZERO-KNOWLEDGE PROOFS', 'MIDNIGHT NETWORK', 'COMPACT LANGUAGE',
  'PRIVACY BY DEFAULT', 'SMART CONTRACTS', 'BLOCKCHAIN EDUCATION',
  'DEFI PROTOCOLS', 'WEB3 DEVELOPERS', 'ZK CIRCUITS',
  'DECENTRALIZED SYSTEMS', 'CARDANO ECOSYSTEM', 'OPEN SOURCE',
];

// ── Chain metrics ─────────────────────────────────────────────────────────────
const METRICS = [
  { label: 'NETWORK',  value: 'MIDNIGHT',  tag: '● ACTIVE',   color: 'text-primary' },
  { label: 'PROTOCOL', value: 'ZK PROOF',  tag: '● ENABLED',  color: 'text-accent'  },
  { label: 'LAYER',    value: 'CARDANO',   tag: '● L2 CHAIN', color: 'text-primary' },
];

// ── Main Component ────────────────────────────────────────────────────────────
interface HeroSectionProps {
  onScrollToArticles?: () => void;
}

export function HeroSection({ onScrollToArticles }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg" />

      {/* ── Circuit — absolutely right, atmospheric overlay ── */}
      <motion.div
        className="absolute right-0 top-1/2 pointer-events-none hidden lg:block z-0"
        style={{ transform: 'translateY(-50%)' }}
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 0.38, x: 0 }}
        transition={{ duration: 1.4, delay: 0.5, ease: 'easeOut' }}
      >
        {/* Left gradient — fades circuit into the section so it never fights the text */}
        <div
          className="absolute inset-y-0 left-0 w-72 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, hsl(var(--background)) 15%, transparent 100%)' }}
        />
        {/* Top/bottom fades */}
        <div
          className="absolute top-0 inset-x-0 h-32 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, hsl(var(--background)), transparent)' }}
        />
        <div
          className="absolute bottom-0 inset-x-0 h-32 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, hsl(var(--background)), transparent)' }}
        />
        <ZKCircuitGrid />
      </motion.div>

      {/* ── Main content — fully centered, no column competition ── */}
      <div className="flex-1 flex items-center relative z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24 w-full">

          {/* Terminal prelude */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="flex items-center justify-center gap-2 font-mono text-[11px] text-muted-foreground/40 mb-8 tracking-wider"
          >
            <span className="text-accent/60 select-none">$</span>
            <span>init midnight_network.js</span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
              className="text-accent/70 text-base leading-none"
            >
              █
            </motion.span>
          </motion.div>

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-muted-foreground/30 mb-5"
          >
            EIGHTBLOCK — BLOCKCHAIN EDUCATION
          </motion.p>

          {/* Headline — full-width center stage */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18 }}
            className="text-center font-black leading-[0.88] tracking-tighter mb-8"
            style={{ fontSize: 'clamp(62px, 9.5vw, 118px)' }}
          >
            <span className="block text-foreground">LEARN.</span>
            <span className="block text-foreground">BUILD.</span>
            <span className="block">
              <span className="text-primary">EXPLORE</span>
              <span className="text-foreground/15">.</span>
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="text-center max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed mb-10"
          >
            Privacy-first blockchain education for the next generation of Web3
            developers. Master Midnight Network, Zero-Knowledge proofs, and
            decentralized systems.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.44 }}
            className="flex flex-wrap gap-4 justify-center mb-14"
          >
            <Button
              size="lg"
              onClick={onScrollToArticles}
              className="group bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 h-12"
            >
              Start Learning
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="px-8 border-border hover:border-accent/50 hover:bg-accent/5 hover:text-accent text-foreground font-semibold h-12"
            >
              <Link href="/midnight">
                <Shield className="mr-2 h-4 w-4" />
                Midnight Hub
              </Link>
            </Button>
          </motion.div>

          {/* Chain metrics — horizontal pill row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.58 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {METRICS.map((m, i) => (
              <div
                key={m.label}
                className="flex items-center gap-3 px-4 py-2.5 bg-card/40 border border-border/60 rounded-xl backdrop-blur-sm"
              >
                <div className={`font-bold text-sm ${m.color}`}>{m.value}</div>
                <div className="w-px h-5 bg-border/60" />
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/35 leading-none mb-0.5">
                    {m.label}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground/25 leading-none">
                    {m.tag}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* ── Bottom ticker ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        className="relative border-t border-border/40 overflow-hidden z-10"
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }}
        />
        <div className="py-3 overflow-hidden">
          <div className="marquee-track flex items-center whitespace-nowrap">
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-5 px-5">
                <span className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground/22 uppercase">
                  {item}
                </span>
                <span className="text-muted-foreground/12 text-[8px]">◆</span>
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ── ZK Circuit Grid ───────────────────────────────────────────────────────────
function ZKCircuitGrid() {
  return (
    <div className="relative" style={{ width: SVG_W, height: SVG_H }}>
      {/* Corner reticle markers */}
      {([
        'top-0 left-0 border-l border-t',
        'top-0 right-0 border-r border-t',
        'bottom-0 left-0 border-l border-b',
        'bottom-0 right-0 border-r border-b',
      ] as const).map((cls, i) => (
        <div key={i} className={`absolute w-4 h-4 border-primary/30 ${cls}`} />
      ))}

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transform: 'rotate(5deg)', transformOrigin: 'center' }}
        className="w-full h-full"
      >
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="overflow-visible"
          aria-hidden="true"
        >
          {/* Background grid dots */}
          {Array.from({ length: 80 }, (_, k) => {
            const row = Math.floor(k / 10);
            const col = k % 10;
            return (
              <circle key={k} cx={nx(col)} cy={ny(row)} r={1.5} fill="rgba(255,255,255,0.06)" />
            );
          })}

          {/* Circuit wires */}
          {CIRCUIT_LINES.map(([[r1, c1], [r2, c2]], i) => (
            <line
              key={i}
              x1={nx(c1)} y1={ny(r1)} x2={nx(c2)} y2={ny(r2)}
              stroke="rgba(255,190,13,0.18)"
              strokeWidth={1}
              strokeDasharray="3 5"
            />
          ))}

          {/* Blue connector nodes */}
          {BLUE_NODES.map(([row, col], i) => (
            <circle
              key={i}
              cx={nx(col)} cy={ny(row)} r={4}
              fill="rgba(88,177,225,0.3)"
              stroke="rgba(88,177,225,0.5)"
              strokeWidth={1}
            />
          ))}

          {/* Gold nodes — pulsing */}
          {GOLD_NODES.map(([row, col, delay], i) => (
            <motion.g key={i}>
              <motion.circle
                cx={nx(col)} cy={ny(row)} r={13}
                fill="none"
                stroke="rgba(255,190,13,0.1)"
                strokeWidth={1}
                animate={{ r: [13, 20, 13], opacity: [0.1, 0.04, 0.1] }}
                transition={{ duration: 2.8, repeat: Infinity, delay, ease: 'easeInOut' }}
              />
              <motion.circle
                cx={nx(col)} cy={ny(row)} r={5.5}
                fill="rgba(255,190,13,0.88)"
                stroke="rgba(255,190,13,0.4)"
                strokeWidth={1.5}
                animate={{ opacity: [0.88, 1, 0.88] }}
                transition={{ duration: 2.8, repeat: Infinity, delay, ease: 'easeInOut' }}
              />
            </motion.g>
          ))}

          {/* Scan line */}
          <motion.rect
            x={0} y={OFFSET} width={SVG_W} height={1.5}
            fill="rgba(88,177,225,0.12)"
            animate={{ y: [OFFSET, SVG_H - OFFSET] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

