'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { TagInput } from '@/components/editor/TagInput';
import {
  ArrowLeft, Save, Eye, EyeOff, Loader2, Upload, X,
  FileText, Globe, Hash, AlignLeft, ImageIcon, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function NewArticlePage() {
  const router = useRouter();
  const { connected, address } = useWallet();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: '',
    featuredImageUrl: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    });
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const hasContent = formData.title || formData.content;
    if (!hasContent) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData.title, formData.content]);

  const processImageFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'JPEG, PNG, WebP, or GIF only', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }
    setFeaturedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFeaturedImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFeaturedImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const uploadFeaturedImage = async (): Promise<string | null> => {
    if (!featuredImageFile) return formData.featuredImageUrl || null;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', featuredImageFile);
      const response = await fetch(`${API_URL}/upload/article-image`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.imageUrl;
    } catch {
      toast({ title: 'Upload failed', description: 'Failed to upload featured image', variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeFeaturedImage = () => {
    setFeaturedImageFile(null);
    setFeaturedImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageDelete = async (imageUrl: string) => {
    try {
      await fetch(`${API_URL}/upload/article-image`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageUrl }),
      });
    } catch { /* silent */ }
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!connected || !address) {
      toast({ title: 'Not connected', description: 'Please connect your wallet first', variant: 'destructive' });
      return;
    }
    if (!formData.title || !formData.content) {
      toast({ title: 'Missing fields', description: 'Title and content are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let featuredImageUrl = formData.featuredImageUrl;
      if (featuredImageFile) {
        const uploadedUrl = await uploadFeaturedImage();
        if (uploadedUrl) featuredImageUrl = uploadedUrl;
      }
      const tagsArray = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const response = await fetch(`${API_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt,
          content: formData.content,
          tags: tagsArray,
          featuredImage: featuredImageUrl || undefined,
          status,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create article');
      }
      const article = await response.json();
      toast({
        title: status === 'PUBLISHED' ? '🎉 Article published!' : 'Draft saved!',
        description: status === 'PUBLISHED' ? 'Your article is now live.' : 'Saved as draft.',
      });
      router.push(`/articles/${article.slug}`);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to create article', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const wordCount = formData.content
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (!connected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl
            border border-border bg-card dark:border-border/30">
            <FileText className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">Wallet Required</h1>
          <p className="text-[14px] text-muted-foreground/60 mb-6">
            Connect your wallet to start writing
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5
              text-[13px] font-bold text-primary-foreground shadow-md shadow-primary/20
              hover:brightness-105 transition-all duration-150"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky toolbar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-border/50 dark:border-border/30
        bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">

            {/* Left: back + title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/profile/articles"
                className="flex h-8 w-8 items-center justify-center rounded-xl
                  border border-border/60 dark:border-border/30 bg-muted/40 dark:bg-card/40
                  text-muted-foreground/50 hover:text-foreground hover:border-border
                  transition-all duration-150 flex-shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-px w-4 bg-primary/40 flex-shrink-0" />
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60 flex-shrink-0">
                  New Article
                </span>
                {formData.title && (
                  <>
                    <span className="text-border/60 dark:text-border/40 flex-shrink-0">/</span>
                    <span className="text-[13px] text-muted-foreground/50 truncate max-w-[200px]">
                      {formData.title}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: stats + actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* word count pill */}
              {wordCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/60
                  dark:border-border/30 bg-muted/40 dark:bg-card/40
                  px-2.5 py-1 font-mono text-[10px] text-muted-foreground/50">
                  {wordCount.toLocaleString()} words · {readingTime} min
                </span>
              )}

              {/* Preview toggle */}
              <button
                onClick={() => setPreview(!preview)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold
                  transition-all duration-150
                  ${preview
                    ? 'border-accent/40 bg-accent/10 text-accent dark:border-accent/30'
                    : 'border-border/60 dark:border-border/30 bg-muted/40 dark:bg-card/40 text-muted-foreground/60 hover:text-foreground hover:border-border'
                  }`}
              >
                {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{preview ? 'Edit' : 'Preview'}</span>
              </button>

              {/* Save draft */}
              <button
                onClick={() => handleSubmit('DRAFT')}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl border border-border/60
                  dark:border-border/30 bg-muted/40 dark:bg-card/40
                  px-3 py-1.5 text-[12px] font-semibold
                  text-muted-foreground/60 hover:text-foreground hover:border-border
                  disabled:opacity-40 transition-all duration-150"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Save Draft</span>
              </button>

              {/* Publish */}
              <button
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={saving}
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-xl
                  bg-primary px-3.5 py-1.5 text-[12px] font-bold text-primary-foreground
                  shadow-md shadow-primary/20 hover:brightness-105
                  disabled:opacity-50 transition-all duration-150"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  group-hover:translate-x-full transition-transform duration-500" />
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {preview ? (
          /* ── Preview mode ── */
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30
                bg-accent/8 dark:bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent/80">
                <Eye className="h-3 w-3" />
                Preview
              </span>
            </div>

            {(featuredImagePreview || formData.featuredImageUrl) && (
              <div className="relative w-full rounded-2xl overflow-hidden mb-8 border border-border/50 dark:border-border/20">
                <Image
                  src={featuredImagePreview || formData.featuredImageUrl}
                  alt={formData.title}
                  width={1200}
                  height={630}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
            <h1 className="text-4xl font-black tracking-tight text-foreground mb-4 leading-tight">
              {formData.title || <span className="text-muted-foreground/30">Untitled Article</span>}
            </h1>
            {formData.excerpt && (
              <p className="text-lg text-muted-foreground/70 mb-8 leading-relaxed border-l-2 border-primary/40 pl-4">
                {formData.excerpt}
              </p>
            )}
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content) }} />
          </div>
        ) : (
          /* ── Edit mode ── */
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

            {/* ── Main writing area ── */}
            <div className="space-y-0">

              {/* Title + slug */}
              <div className="rounded-t-2xl border border-b-0 border-border bg-card dark:border-border/40 px-6 pt-7 pb-5">
                {/* Section label */}
                <div className="flex items-center gap-2 mb-4">
                  <AlignLeft className="h-3.5 w-3.5 text-primary/50" />
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/50">
                    Article
                  </span>
                </div>

                {/* Big title input */}
                <textarea
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Your article title…"
                  rows={2}
                  className="w-full resize-none bg-transparent text-3xl sm:text-4xl font-black
                    tracking-tight text-foreground leading-tight
                    placeholder:text-muted-foreground/20
                    focus:outline-none border-none p-0"
                />

                {/* Slug preview */}
                <div className="mt-4 flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
                  <span className="font-mono text-[11px] text-muted-foreground/40">
                    /articles/
                    <span className={formData.slug ? 'text-primary/60' : 'text-muted-foreground/25'}>
                      {formData.slug || 'your-slug-here'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Excerpt */}
              <div className="border-x border-border bg-card dark:border-border/40 px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlignLeft className="h-3.5 w-3.5 text-muted-foreground/30" />
                  <label className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground/50">
                    Excerpt <span className="normal-case font-sans text-muted-foreground/30">(optional)</span>
                  </label>
                </div>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="A short summary shown in article listings and social previews…"
                  rows={2}
                  className="w-full resize-none bg-transparent text-[15px] text-foreground
                    placeholder:text-muted-foreground/30 leading-relaxed
                    focus:outline-none border-none p-0"
                />
              </div>

              {/* Rich text editor */}
              <div className="rounded-b-2xl border border-t-0 border-border bg-card dark:border-border/40 overflow-hidden">
                <div className="border-t border-border/50 dark:border-border/20" />
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  onImageDelete={handleImageDelete}
                  placeholder="Start writing… (supports Markdown shortcuts)"
                  minHeight="600px"
                />
              </div>
            </div>

            {/* ── Right sidebar ── */}
            <div className="space-y-4 xl:sticky xl:top-20">

              {/* Featured image */}
              <div className="rounded-2xl border border-border bg-card dark:border-border/40 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border/50 dark:border-border/25 px-5 py-3.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary/50" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/55">
                    Cover Image
                  </span>
                </div>

                <div className="p-4">
                  {featuredImagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border/60 dark:border-border/30 group">
                      <Image
                        src={featuredImagePreview}
                        alt="Cover preview"
                        width={640}
                        height={360}
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center
                        bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={removeFeaturedImage}
                          className="flex h-9 w-9 items-center justify-center rounded-xl
                            bg-rose-500 text-white shadow-lg hover:bg-rose-600
                            transition-colors duration-150"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      className={`relative flex flex-col items-center justify-center gap-3
                        rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer
                        transition-all duration-150
                        ${dragOver
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-border/60 dark:border-border/30 hover:border-primary/40 hover:bg-primary/3'
                        }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl
                        border border-border/60 dark:border-border/30 bg-muted/50">
                        <Upload className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-semibold text-foreground/70">
                          Drop image or click
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/40">
                          JPEG · PNG · WebP · GIF · max 10MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFeaturedImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="rounded-2xl border border-border bg-card dark:border-border/40 relative">
                <div className="flex items-center gap-2 border-b border-border/50 dark:border-border/25 px-5 py-3.5">
                  <Hash className="h-3.5 w-3.5 text-primary/50" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/55">
                    Tags
                  </span>
                </div>
                <div className="p-4">
                  <TagInput
                    value={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                  />
                </div>
              </div>

              {/* Publish actions */}
              <div className="rounded-2xl border border-border bg-card dark:border-border/40 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border/50 dark:border-border/25 px-5 py-3.5">
                  <Zap className="h-3.5 w-3.5 text-primary/50" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/55">
                    Publish
                  </span>
                </div>
                <div className="p-4 space-y-2.5">
                  <button
                    onClick={() => handleSubmit('PUBLISHED')}
                    disabled={saving || !formData.title || !formData.content}
                    className="group relative w-full flex items-center justify-center gap-2
                      overflow-hidden rounded-xl bg-primary px-4 py-2.5
                      text-[13px] font-bold text-primary-foreground
                      shadow-md shadow-primary/20 hover:brightness-105
                      disabled:opacity-40 disabled:cursor-not-allowed
                      active:scale-[0.98] transition-all duration-150"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full
                      bg-gradient-to-r from-transparent via-white/20 to-transparent
                      group-hover:translate-x-full transition-transform duration-500" />
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                    Publish Article
                  </button>
                  <button
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={saving || !formData.title}
                    className="w-full flex items-center justify-center gap-2 rounded-xl
                      border border-border bg-muted/30 dark:border-border/40 dark:bg-card/40
                      px-4 py-2.5 text-[13px] font-semibold
                      text-muted-foreground/60 hover:text-foreground hover:border-border
                      disabled:opacity-40 disabled:cursor-not-allowed
                      transition-all duration-150"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save as Draft
                  </button>

                  {/* Requirements */}
                  {(!formData.title || !formData.content) && (
                    <div className="pt-1 space-y-1">
                      {!formData.title && (
                        <p className="text-[11px] text-muted-foreground/40 flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          Title required to publish
                        </p>
                      )}
                      {!formData.content && (
                        <p className="text-[11px] text-muted-foreground/40 flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          Content required to publish
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  {wordCount > 0 && (
                    <div className="pt-2 border-t border-border/40 dark:border-border/20 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground/40">
                        {wordCount.toLocaleString()} words
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/40">
                        ~{readingTime} min read
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}


