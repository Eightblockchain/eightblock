'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Eye } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

interface ArticleHeaderProps {
  article: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    featured: boolean;
    featuredImage?: string;
    publishedAt: string;
    viewCount: number;
    author: {
      id: string;
      name: string | null;
      avatarUrl?: string | null;
    };
    tags: Array<{
      tag: {
        id: string;
        name: string;
      };
    }>;
  };
  readingTime: number;
}

export function ArticleHeader({
  article,
  readingTime,
}: ArticleHeaderProps) {
  const router = useRouter();
  const handleBack = () => router.back();
  const hasTags = article.tags && article.tags.length > 0;

  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  /* ─── Shared: badges row ─── */
  const Badges = ({ overlay = false }: { overlay?: boolean }) => (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded border ${
          overlay
            ? 'bg-primary/20 text-primary border-primary/40 backdrop-blur-sm'
            : 'bg-primary/10 text-primary border-primary/25'
        }`}
      >
        {article.category}
      </span>
      {article.status === 'DRAFT' && (
        <span
          className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border ${
            overlay
              ? 'bg-card/60 text-muted-foreground/80 border-border/50 backdrop-blur-sm'
              : 'bg-muted text-muted-foreground border-border/60'
          }`}
        >
          Draft
        </span>
      )}
      {article.featured && (
        <span
          className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border ${
            overlay
              ? 'bg-accent/20 text-accent border-accent/40 backdrop-blur-sm'
              : 'bg-accent/10 text-accent border-accent/30'
          }`}
        >
          Featured
        </span>
      )}
    </div>
  );

  /* ─── Shared: meta row ─── */
  const Meta = ({ overlay = false }: { overlay?: boolean }) => (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] ${
        overlay ? 'text-white/60' : 'text-muted-foreground/45'
      }`}
    >
      <div className="flex items-center gap-2">
        <Avatar src={article.author.avatarUrl} name={article.author.name} size="xs" />
        <span className={`font-medium ${overlay ? 'text-white/60' : 'text-muted-foreground/80'}`}>
          {article.author.name || 'Anonymous'}
        </span>
      </div>
      <span className="opacity-30">·</span>
      <Calendar className="h-3 w-3 flex-shrink-0" />
      <span>{publishedDate}</span>
      <span className="opacity-30">·</span>
      <Clock className="h-3 w-3 flex-shrink-0" />
      <span>{readingTime} min read</span>
      {article.viewCount > 0 && (
        <>
          <span className="opacity-30">·</span>
          <Eye className="h-3 w-3 flex-shrink-0" />
          <span>{article.viewCount.toLocaleString()} views</span>
        </>
      )}
    </div>
  );

  /* ─── Shared: top nav bar ─── */
  const Nav = ({ overlay = false }: { overlay?: boolean }) => (
    <div
      className={`${overlay ? 'absolute top-0 left-0 right-0 z-20' : 'border-b border-border/20'} px-4 sm:px-6 py-5`}
    >
      <div className="mx-auto max-w-4xl flex items-center justify-between">
        <button
          onClick={handleBack}
          className={`group flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
            overlay
              ? 'text-white/50 hover:text-white'
              : 'text-muted-foreground/60 hover:text-foreground'
          }`}
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      </div>
    </div>
  );

  return (
    <header>
      {article.featuredImage ? (
        /* ══════════════════════════════════════════════════════
           CINEMATIC HERO — full-bleed image, content overlaid
           ══════════════════════════════════════════════════════ */
        <div className="relative h-[65vh] min-h-[440px] max-h-[720px] overflow-hidden">
          {/* Image */}
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Scrim layers */}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/30 to-transparent" />
          {/* Gold edge hairline */}
          <div className="absolute left-0 top-0 w-[2px] h-full bg-gradient-to-b from-transparent via-primary/35 to-transparent" />

          {/* Nav */}
          <Nav overlay />

          {/* Content anchor to bottom */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 pb-10"
          >
            <div className="mx-auto max-w-4xl space-y-4">
              <Badges overlay />
              <h1 className="text-[30px] sm:text-[44px] lg:text-[54px] font-black text-white leading-[0.92] tracking-tighter max-w-3xl">
                {article.title}
              </h1>
              {article.description && (
                <p className="text-white/50 text-[15px] sm:text-base leading-relaxed max-w-2xl">
                  {article.description}
                </p>
              )}
              <Meta overlay />
            </div>
          </motion.div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════
           TYPOGRAPHIC HERO — no image, dark + grid atmosphere
           ══════════════════════════════════════════════════════ */
        <div className="relative overflow-hidden border-b border-border/20">
          {/* Ambient grid */}
          <div className="absolute inset-0 grid-bg opacity-[0.1]" />
          {/* Ghost first-letter watermark */}
          <div className="absolute right-0 top-0 bottom-0 overflow-hidden pointer-events-none select-none flex items-center pr-4">
            <span
              className="font-black text-foreground/[0.03] leading-none"
              style={{ fontSize: 'clamp(160px, 28vw, 300px)' }}
            >
              {article.title.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Gold left accent */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-primary/45 to-transparent" />

          <Nav />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pt-9 pb-12 space-y-5"
          >
            <Badges />
            <h1 className="text-[34px] sm:text-[50px] lg:text-[62px] font-black text-foreground leading-[0.92] tracking-tighter max-w-3xl">
              {article.title}
            </h1>
            {article.description && (
              <p className="text-muted-foreground text-[15px] sm:text-[17px] leading-relaxed max-w-2xl">
                {article.description}
              </p>
            )}
            <Meta />
          </motion.div>
        </div>
      )}

      {/* ── Tags strip ────────────────────────────────────────── */}
      {hasTags && (
        <div className="border-b border-border/20 bg-card/10">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3.5 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <span
                key={t.tag.id}
                className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/35 border border-border/30 rounded-full hover:border-primary/30 hover:text-primary/55 transition-colors duration-200 cursor-default"
              >
                #{t.tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
