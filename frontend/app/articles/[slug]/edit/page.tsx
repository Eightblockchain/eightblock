'use client';

import { useState, useRef, useEffect, use, useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { TagInput } from '@/components/editor/TagInput';
import {
  ArrowLeft, Save, Eye, EyeOff, Loader2, Upload, X,
  FileText, Globe, Hash, AlignLeft, ImageIcon, Zap, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  fetchArticleBySlug,
  updateArticle,
  uploadArticleImage,
  deleteArticleImage,
} from '@/lib/services/article-service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  status: string;
  featuredImage?: string;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  author: {
    id: string;
  };
}

export default function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: slugParam } = use(params);
  const router = useRouter();
  const { connected, address } = useWallet();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState<string>(slugParam);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: '',
    featuredImageUrl: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  // Get slug from params
  useEffect(() => {
    Promise.resolve(params).then((p) => setSlug(p.slug));
  }, [params]);

  // Fetch article data using React Query
  const {
    data: article,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchArticleBySlug(slug),
    enabled: !!slug,
  });

  // Initialize form when article is loaded
  useEffect(() => {
    if (!article) return;

    // Check if user is the author using cookie-based auth
    const checkAuthorization = async () => {
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          credentials: 'include',
        });

        if (!response.ok) {
          toast({
            title: 'Authentication required',
            description: 'Please connect your wallet to edit articles',
            variant: 'destructive',
          });
          router.push(`/articles/${slug}`);
          return;
        }

        const user = await response.json();
        if (article.author.id !== user.id) {
          toast({
            title: 'Unauthorized',
            description: 'You can only edit your own articles',
            variant: 'destructive',
          });
          router.push(`/articles/${slug}`);
          return;
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to verify authorization',
          variant: 'destructive',
        });
        router.push(`/articles/${slug}`);
        return;
      }
    };

    checkAuthorization();

    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.description || '',
      content: article.content,
      tags: article.tags.map((t) => t.tag.name).join(', '),
      featuredImageUrl: article.featuredImage || '',
      status: article.status as 'DRAFT' | 'PUBLISHED',
    });

    if (article.featuredImage) {
      setFeaturedImagePreview(article.featuredImage);
    }
  }, [article, slug, router, toast]);

  // Update article mutation
  const updateMutation = useMutation({
    mutationFn: async (status: 'DRAFT' | 'PUBLISHED') => {
      if (!article) throw new Error('No article loaded');

      // Upload featured image if selected
      let featuredImageUrl = formData.featuredImageUrl;
      if (featuredImageFile) {
        setUploading(true);
        try {
          const data = await uploadArticleImage(featuredImageFile);
          featuredImageUrl = data.imageUrl;
        } finally {
          setUploading(false);
        }
      }

      // Delete images that were removed from content
      if (deletedImages.length > 0) {
        await Promise.all(deletedImages.map((url) => deleteArticleImage(url)));
      }

      return updateArticle(article.id, {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        featuredImage: featuredImageUrl,
        status,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Article ${data.status === 'PUBLISHED' ? 'published' : 'saved as draft'}`,
      });
      router.push(`/articles/${data.slug}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save article',
        variant: 'destructive',
      });
    },
  });

  // Auto-generate slug from title
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

  // Handle featured image upload
  const handleFeaturedImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPEG, PNG, WebP, or GIF image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setFeaturedImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFeaturedImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFeaturedImage = () => {
    setFeaturedImageFile(null);
    setFeaturedImagePreview(null);
    setFormData({ ...formData, featuredImageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image deletion from rich text editor
  const handleImageDelete = (imageUrl: string) => {
    // Track deleted images to clean up on save
    if (imageUrl.includes('/uploads/articles/')) {
      setDeletedImages((prev) => [...prev, imageUrl]);
    }
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const hasContent = formData.title || formData.content;
    if (!hasContent) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData.title, formData.content]);

  const handleSubmit = (status: 'DRAFT' | 'PUBLISHED') => {
    if (!connected || !address) {
      toast({
        title: 'Not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title || !formData.content) {
      toast({
        title: 'Missing fields',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate(status);
  };

  const wordCount = useMemo(
    () => formData.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length,
    [formData.content]
  );
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (!connected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl
            border border-border bg-card">
            <FileText className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">Wallet Required</h1>
          <p className="text-[14px] text-muted-foreground/60 mb-6">
            Connect your wallet to edit articles
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-2xl border border-border bg-card p-10">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load article</h3>
          <p className="text-muted-foreground mb-6">{(error as Error)?.message || 'An error occurred'}</p>
          <Link
            href="/profile/articles"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5
              text-[13px] font-bold text-primary-foreground shadow-md shadow-primary/20
              hover:brightness-105 transition-all duration-150"
          >
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky toolbar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-border/50
        bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">

            {/* Left: back + title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/articles/${article.slug}`}
                className="flex h-8 w-8 items-center justify-center rounded-xl
                  border border-border/60 bg-card/40
                  text-muted-foreground/50 hover:text-foreground hover:border-border
                  transition-all duration-150 flex-shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-px w-4 bg-primary/40 flex-shrink-0" />
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60 flex-shrink-0">
                  Edit Article
                </span>
                {formData.title && (
                  <>
                    <span className="text-border/60 flex-shrink-0">/</span>
                    <span className="text-[13px] text-muted-foreground/50 truncate max-w-[200px]">
                      {formData.title}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: stats + actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {wordCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/60
                  bg-card/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground/50">
                  {wordCount.toLocaleString()} words · {readingTime} min
                </span>
              )}

              <button
                onClick={() => setPreview(!preview)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold
                  transition-all duration-150
                  ${preview
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border/60 bg-card/40 text-muted-foreground/60 hover:text-foreground hover:border-border'
                  }`}
              >
                {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{preview ? 'Edit' : 'Preview'}</span>
              </button>

              <button
                onClick={() => handleSubmit('DRAFT')}
                disabled={updateMutation.isPending || uploading}
                className="flex items-center gap-1.5 rounded-xl border border-border/60
                  bg-card/40 px-3 py-1.5 text-[12px] font-semibold
                  text-muted-foreground/60 hover:text-foreground hover:border-border
                  disabled:opacity-40 transition-all duration-150"
              >
                {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Save Draft</span>
              </button>

              <button
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={updateMutation.isPending || uploading}
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-xl
                  bg-primary px-3.5 py-1.5 text-[12px] font-bold text-primary-foreground
                  shadow-md shadow-primary/20 hover:brightness-105
                  disabled:opacity-50 transition-all duration-150"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  group-hover:translate-x-full transition-transform duration-500" />
                {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
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
                bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent/80">
                <Eye className="h-3 w-3" />
                Preview
              </span>
            </div>
            {(featuredImagePreview || formData.featuredImageUrl) && (
              <div className="relative w-full rounded-2xl overflow-hidden mb-8 border border-border/50">
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
              <div className="rounded-t-2xl border border-b-0 border-border bg-card px-6 pt-7 pb-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlignLeft className="h-3.5 w-3.5 text-primary/50" />
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/50">
                    Article
                  </span>
                </div>
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
              <div className="border-x border-border bg-card px-6 py-5">
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
              <div className="rounded-b-2xl border border-t-0 border-border bg-card overflow-hidden">
                <div className="border-t border-border/50" />
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
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary/50" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/55">
                    Cover Image
                  </span>
                </div>
                <div className="p-4">
                  {featuredImagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border/60 group">
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
                      className="relative flex flex-col items-center justify-center gap-3
                        rounded-xl border-2 border-dashed border-border/60 px-4 py-8 cursor-pointer
                        hover:border-primary/40 hover:bg-primary/3 transition-all duration-150"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl
                        border border-border/60 bg-muted/50">
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
              <div className="rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3.5">
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
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3.5">
                  <Zap className="h-3.5 w-3.5 text-primary/50" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/55">
                    Update
                  </span>
                </div>
                <div className="p-4 space-y-2.5">
                  <button
                    onClick={() => handleSubmit('PUBLISHED')}
                    disabled={updateMutation.isPending || uploading || !formData.title || !formData.content}
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
                    {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                    Publish Article
                  </button>
                  <button
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={updateMutation.isPending || uploading || !formData.title}
                    className="w-full flex items-center justify-center gap-2 rounded-xl
                      border border-border bg-card/40
                      px-4 py-2.5 text-[13px] font-semibold
                      text-muted-foreground/60 hover:text-foreground hover:border-border
                      disabled:opacity-40 disabled:cursor-not-allowed
                      transition-all duration-150"
                  >
                    {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save as Draft
                  </button>

                  {wordCount > 0 && (
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
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
