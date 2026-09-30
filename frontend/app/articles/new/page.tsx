'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useRouter } from 'next/navigation';
import { AuthGate } from '@/components/auth/auth-gate';
import { RichTextEditor } from '@eightblock/ui/editor/RichTextEditor';
import { TagInput } from '@/components/editor/TagInput';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  X,
  FileText,
  Globe,
  Hash,
  AlignLeft,
  ImageIcon,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import Image from 'next/image';
import { revalidateArticle } from '@/lib/actions/revalidate-article';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function NewArticlePageEditor() {
  const router = useRouter();
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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData.title, formData.content]);

  const processImageFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Unsupported image type',
        description: 'Use a JPEG, PNG, WebP or GIF image.',
        variant: 'warning',
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Choose an image under 10 MB.',
        variant: 'warning',
      });
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
      toast({
        title: 'Could not upload the cover image',
        description: 'Please try again.',
        variant: 'destructive',
      });
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
    } catch {
      /* silent */
    }
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!formData.title || !formData.content) {
      toast({
        title: 'Add a title and some content',
        description: 'Both are needed before the article can be saved.',
        variant: 'warning',
      });
      return;
    }
    setSaving(true);
    try {
      let featuredImageUrl = formData.featuredImageUrl;
      if (featuredImageFile) {
        const uploadedUrl = await uploadFeaturedImage();
        if (uploadedUrl) featuredImageUrl = uploadedUrl;
      }
      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
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
      await revalidateArticle([article.slug]).catch(() => undefined);
      toast({
        title: status === 'PUBLISHED' ? 'Article published' : 'Draft saved',
        description:
          status === 'PUBLISHED'
            ? 'Your article is now live.'
            : 'Only you can see it. Keep editing, or publish it when it is ready.',
        variant: 'success',
      });
      // Drafts are not public, so keep the author in the editor instead of the public (404) page.
      router.push(
        status === 'PUBLISHED' ? `/articles/${article.slug}` : `/articles/${article.slug}/edit`
      );
    } catch (error) {
      toast({
        title: 'Could not save the article',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
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

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky toolbar ──────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40 border-b border-border/50 dark:border-border/30
        bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Left: back + title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/my-articles"
                aria-label="Back to my articles"
                className="flex h-8 w-8 items-center justify-center rounded-xl
                  border border-border/60 dark:border-border/30 bg-muted/40 dark:bg-card/40
                  text-muted-foreground hover:text-foreground hover:border-border
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
                    <span className="text-muted-foreground flex-shrink-0">/</span>
                    <span className="text-[13px] text-muted-foreground truncate max-w-[200px]">
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
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/60
                  dark:border-border/30 bg-muted/40 dark:bg-card/40
                  px-2.5 py-1 font-mono text-[10px] text-muted-foreground"
                >
                  {wordCount.toLocaleString()} words · {readingTime} min
                </span>
              )}

              {/* Preview toggle */}
              <button
                onClick={() => setPreview(!preview)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold
                  transition-all duration-150
                  ${
                    preview
                      ? 'border-brand-blue/50 bg-brand-blue/10 text-foreground'
                      : 'border-border/60 dark:border-border/30 bg-muted/40 dark:bg-card/40 text-muted-foreground hover:text-foreground hover:border-border'
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
                  text-muted-foreground hover:text-foreground hover:border-border
                  disabled:opacity-40 transition-all duration-150"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Save Draft</span>
              </button>

              {/* Publish */}
              <button
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={saving}
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-xl
                  bg-primary px-3.5 py-1.5 text-[12px] font-bold text-primary-foreground
                  hover:brightness-105
                  disabled:opacity-50 transition-all duration-150"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
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
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/40
                bg-brand-blue/10 px-3 py-1 text-[11px] font-semibold text-foreground"
              >
                <Eye className="h-3 w-3 text-brand-blue" />
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
              {formData.title || <span className="text-muted-foreground">Untitled Article</span>}
            </h1>
            {formData.excerpt && (
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-2 border-primary/40 pl-4">
                {formData.excerpt}
              </p>
            )}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content) }}
            />
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
                  <AlignLeft className="h-3.5 w-3.5 text-primary/70" />
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/70">
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
                    placeholder:text-muted-foreground
                    focus:outline-none border-none p-0"
                />

                {/* Slug preview */}
                <div className="mt-4 flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    /articles/
                    <span className={formData.slug ? 'text-primary/60' : 'text-muted-foreground'}>
                      {formData.slug || 'your-slug-here'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Excerpt */}
              <div className="border-x border-border bg-card dark:border-border/40 px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                    Excerpt{' '}
                    <span className="normal-case font-sans text-muted-foreground">(optional)</span>
                  </label>
                </div>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="A short summary shown in article listings and social previews…"
                  rows={2}
                  className="w-full resize-none bg-transparent text-[15px] text-foreground
                    placeholder:text-muted-foreground leading-relaxed
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
                  <ImageIcon className="h-3.5 w-3.5 text-primary/70" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/70">
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
                      <div
                        className="absolute inset-0 flex items-center justify-center
                        bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
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
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      className={`relative flex flex-col items-center justify-center gap-3
                        rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer
                        transition-all duration-150
                        ${
                          dragOver
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-border/60 dark:border-border/30 hover:border-primary/40 hover:bg-primary/3'
                        }`}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl
                        border border-border/60 dark:border-border/30 bg-muted/50"
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-semibold text-foreground/70">
                          Drop image or click
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
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
                  <Hash className="h-3.5 w-3.5 text-primary/70" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/70">
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
                  <Zap className="h-3.5 w-3.5 text-primary/70" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/70">
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
                      hover:brightness-105
                      disabled:opacity-40 disabled:cursor-not-allowed
                      active:scale-[0.98] transition-all duration-150"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                    Publish Article
                  </button>
                  <button
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={saving || !formData.title}
                    className="w-full flex items-center justify-center gap-2 rounded-xl
                      border border-border bg-muted/30 dark:border-border/40 dark:bg-card/40
                      px-4 py-2.5 text-[13px] font-semibold
                      text-muted-foreground hover:text-foreground hover:border-border
                      disabled:opacity-40 disabled:cursor-not-allowed
                      transition-all duration-150"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save as Draft
                  </button>

                  {/* Requirements */}
                  {(!formData.title || !formData.content) && (
                    <div className="pt-1 space-y-1">
                      {!formData.title && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          Title required to publish
                        </p>
                      )}
                      {!formData.content && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          Content required to publish
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  {wordCount > 0 && (
                    <div className="pt-2 border-t border-border/40 dark:border-border/20 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {wordCount.toLocaleString()} words
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
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

export default function NewArticlePage() {
  return (
    <AuthGate
      require="writer"
      title="Sign in to start writing"
      description="The editor is available to Eightblock writers. Sign in with your Google account."
    >
      <NewArticlePageEditor />
    </AuthGate>
  );
}
