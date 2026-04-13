'use client';

import { motion } from 'framer-motion';
import { Shield, Code2, Layers, BookOpen, ChevronRight } from 'lucide-react';

const categories = [
  {
    icon:        Shield,
    name:        'Midnight',
    description: 'Privacy-first blockchain protocol',
    color:       'text-primary',
    iconBg:      'bg-primary/10',
    border:      'border-primary/20 hover:border-primary/50',
    glow:        'hover:shadow-[0_0_30px_rgba(255,190,13,0.12)]',
    href:        '/midnight',
  },
  {
    icon:        Code2,
    name:        'Zero-Knowledge',
    description: 'ZK proofs and privacy tech',
    color:       'text-accent',
    iconBg:      'bg-accent/10',
    border:      'border-accent/20 hover:border-accent/50',
    glow:        'hover:shadow-[0_0_30px_rgba(88,177,225,0.12)]',
    href:        '/?search=zero+knowledge',
  },
  {
    icon:        Layers,
    name:        'Blockchain',
    description: 'Core concepts and fundamentals',
    color:       'text-accent',
    iconBg:      'bg-accent/10',
    border:      'border-accent/20 hover:border-accent/50',
    glow:        'hover:shadow-[0_0_30px_rgba(88,177,225,0.12)]',
    href:        '/?search=blockchain',
  },
  {
    icon:        BookOpen,
    name:        'Tutorials',
    description: 'Step-by-step learning guides',
    color:       'text-primary',
    iconBg:      'bg-primary/10',
    border:      'border-primary/20 hover:border-primary/50',
    glow:        'hover:shadow-[0_0_30px_rgba(255,190,13,0.12)]',
    href:        '/?search=tutorial',
  },
];

export function CategoriesSection() {
  return (
    <section className="py-14 border-y border-border bg-card/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">Explore Topics</h2>
          <p className="text-sm text-muted-foreground">Curated learning paths for every level</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.a
                key={cat.name}
                href={cat.href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`group flex flex-col gap-3 p-5 rounded-xl border ${cat.border} ${cat.glow} bg-card/50 backdrop-blur-sm transition-all duration-300`}
              >
                <div className={`inline-flex p-2.5 rounded-lg ${cat.iconBg} w-fit`}>
                  <Icon className={`h-5 w-5 ${cat.color}`} />
                </div>
                <div>
                  <div className={`font-semibold text-sm mb-0.5 flex items-center gap-1 ${cat.color}`}>
                    {cat.name}
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{cat.description}</div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
