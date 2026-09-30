import { cn } from '@eightblock/ui/utils';
import { createRandom, seedFrom } from '@/lib/chain';

type Tone = 'gold' | 'blue' | 'blueSoft' | 'ink';

const toneClass: Record<Tone, string> = {
  gold: 'fill-brand-gold',
  blue: 'fill-brand-blue',
  blueSoft: 'fill-brand-blue/25',
  ink: 'fill-foreground/[0.06]',
};

interface BlockPatternProps {
  seed: string;
  cols?: number;
  rows?: number;
  className?: string;
}

/**
 * Deterministic, mirrored block mosaic derived from a post's fingerprint.
 * Every post without a cover image gets its own recognisable "block".
 */
function buildCells(seed: string, cols: number, rows: number) {
  const random = createRandom(seedFrom(seed));
  const half = Math.ceil(cols / 2);
  const left: Array<{ x: number; y: number; tone: Tone }> = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < half; x++) {
      const r = random();
      const tone: Tone | null = r < 0.08 ? 'blue' : r < 0.2 ? 'blueSoft' : r < 0.36 ? 'ink' : null;
      if (tone) left.push({ x, y, tone });
    }
  }

  const blues = left.filter((c) => c.tone === 'blue');
  if (blues.length > 0) blues[Math.floor(random() * blues.length)].tone = 'gold';

  const out = [...left];
  for (const c of left) {
    const mirror = cols - 1 - c.x;
    if (mirror !== c.x) out.push({ ...c, x: mirror });
  }
  return out;
}

export function BlockPattern({ seed, cols = 18, rows = 8, className }: BlockPatternProps) {
  const cells = buildCells(seed, cols, rows);

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn('block', className)}
      aria-hidden="true"
    >
      {cells.map((c) => (
        <rect
          key={`${c.x}-${c.y}`}
          x={c.x + 0.12}
          y={c.y + 0.12}
          width={0.76}
          height={0.76}
          className={toneClass[c.tone]}
        />
      ))}
    </svg>
  );
}
