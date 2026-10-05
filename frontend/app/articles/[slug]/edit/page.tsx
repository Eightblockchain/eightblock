'use client';

import { useState, useRef, useEffect, use, useMemo } from 'react';
import { sanitizeArticleHtml } from '@/lib/article-html';
import { useRouter } from 'next/navigation';
import { AuthGate } from '@/components/auth/auth-gate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RichTextEditor } from '@eightblock/ui/editor/RichTextEditor';
import { TagInput } from '@/components/editor/TagInput';
import { CategoryPicker } from '@/components/editor/CategoryPicker';
import { articleCategories, type ArticleCategoryLink } from '@/lib/categories';
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
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import Image from 'next/image';
import {
  fetchArticleBySlug,
  updateArticle,
  uploadArticleImage,
  deleteArticleImage,
} from '@/lib/services/article-service';
import { revalidateArticle } from '@/lib/actions/revalidate-article';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  categories?: ArticleCategoryLink[];
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

function EditArticlePageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: slugParam } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState<string>(slugParam);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [categoryMissing, setCategoryMissing] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

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
    // A background refetch would replace what the author is typing with the saved version.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const loadedArticleId = useRef<string | null>(null);

  const isPublished = article?.status === 'PUBLISHED';
  // Drafts have no public page, so leaving the editor goes back to the article list.
  const exitHref = article && isPublished ? `/articles/${article.slug}` : '/my-articles';

  // Initialize form when article is loaded
  useEffect(() => {
    if (!article || loadedArticleId.current === article.id) return;
    loadedArticleId.current = article.id;
    const exit = article.status === 'PUBLISHED' ? `/articles/${article.slug}` : '/my-articles';

    // Check if user is the author using cookie-based auth
    const checkAuthorization = async () => {
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          credentials: 'include',
        });

        if (!response.ok) {
          toast({
            title: 'Sign in to edit articles',
            description: 'Your session may have expired.',
            variant: 'warning',
          });
          router.push(exit);
          return;
        }

        const user = await response.json();
        if (article.author.id !== user.id) {
          toast({
            title: 'You can only edit your own articles',
            variant: 'destructive',
          });
          router.push(exit);
          return;
        }
      } catch (error) {
        toast({
          title: 'Could not check your access',
          description: 'Please try again in a moment.',
          variant: 'destructive',
        });
        router.push(exit);
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
    setCategoryIds(articleCategories(article).map((c) => c.id));

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
        categoryIds,
        featuredImage: featuredImageUrl,
        status,
      });
    },
    onSuccess: async (data) => {
      await revalidateArticle([article?.slug ?? '', data.slug]).catch(() => undefined);
      setFeaturedImageFile(null);
      setDeletedImages([]);

      if (data.status === 'PUBLISHED') {
        toast({
          title: isPublished ? 'Changes saved' : 'Article published',
          description: 'Your article is live.',
          variant: 'success',
        });
        router.push(`/articles/${data.slug}`);
        return;
      }

      toast({
        title: isPublished ? 'Moved to drafts' : 'Draft saved',
        description: 'Only you can see it until you publish it.',
        variant: 'success',
      });
      // Drafts have no public page, so stay in the editor with the saved version loaded.
      queryClient.setQueryData(['article', data.slug], data);
      if (data.slug !== slug) router.replace(`/articles/${data.slug}/edit`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not save the article',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Auto-generate the slug from the title while drafting. Published articles keep their URL so
  // existing links and shares do not break.
  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: isPublished
        ? formData.slug
        : title
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
        title: 'Unsupported image type',
        description: 'Use a JPEG, PNG, WebP or GIF image.',
        variant: 'warning',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Choose an image under 10 MB.',
        variant: 'warning',
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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData.title, formData.content]);

  const handleCategoriesChange = (ids: string[]) => {
    setCategoryIds(ids);
    if (ids.length) setCategoryMissing(false);
  };

  const handleSubmit = (status: 'DRAFT' | 'PUBLISHED') => {
    if (!formData.title || !formData.content) {
      toast({
        title: 'Add a title and some content',
        description: 'Both are needed before the article can be saved.',
        variant: 'warning',
      });
      return;
    }
    if (status === 'PUBLISHED' && categoryIds.length === 0) {
      setCategoryMissing(true);
      setPreview(false);
      requestAnimationFrame(() =>
        categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      );
      toast({
        title: 'Pick a blockchain first',
        description: isPublished
          ? 'Articles are now filed by blockchain. Choose at least one to save your changes.'
          : 'Published articles need at least one category. Drafts can wait.',
        variant: 'warning',
      });
      return;
    }

    updateMutation.mutate(status);
  };

  const wordCount = useMemo(
    () =>
      formData.content
        .replace(/<[^>]*>/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length,
    [formData.content]
  );
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-2xl border border-border bg-card p-10">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load article</h3>
          <p className="text-muted-foreground mb-6">
            {(error as Error)?.message || 'An error occurred'}
          </p>
          <Link
            href="/my-articles"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5
              text-[13px] font-bold text-primary-foreground
              hover:brightness-105 transition-all duration-150"
          >
            Back to my articles
          </Link>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky toolbar ──────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40 border-b border-border/50
        bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Left: back + title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={exitHref}
                aria-label={isPublished ? 'Back to the article' : 'Back to my articles'}
                className="flex h-8 w-8 items-center justify-center rounded-xl
                  border border-border/60 bg-card/40
                  text-muted-foreground hover:text-foreground hover:border-border
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
              {wordCount > 0 && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/60
                  bg-card/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground"
                >
                  {wordCount.toLocaleString()} words · {readingTime} min
                </span>
              )}

              <button
                onClick={() => setPreview(!preview)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-semibold
                  transition-all duration-150
                  ${
                    preview
                      ? 'border-brand-blue/50 bg-brand-blue/10 text-foreground'
                      : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{preview ? 'Edit' : 'Preview'}</span>
              </button>

              {/* Unpublishing lives in the sidebar only, away from the main save button. */}
              {!isPublished && (
                <button
                  onClick={() => handleSubmit('DRAFT')}
                  disabled={updateMutation.isPending || uploading}
                  className="flex items-center gap-1.5 rounded-xl border border-border/60
                    bg-card/40 px-3 py-1.5 text-[12px] font-semibold
                    text-muted-foreground hover:text-foreground hover:border-border
                    disabled:opacity-40 transition-all duration-150"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Save Draft</span>
                </button>
              )}

              <button
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={updateMutation.isPending || uploading}
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-xl
                  bg-primary px-3.5 py-1.5 text-[12px] font-bold text-primary-foreground
                  hover:brightness-105
                  disabled:opacity-50 transition-all duration-150"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                {isPublished ? 'Save changes' : 'Publish'}
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
              {formData.title || <span className="text-muted-foreground">Untitled Article</span>}
            </h1>
            {formData.excerpt && (
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-2 border-primary/40 pl-4">
                {formData.excerpt}
              </p>
            )}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(formData.content) }}
            />
          </div>
        ) : (
          /* ── Edit mode ── */
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            {/* ── Main writing area ── */}
            <div className="space-y-0">
              <CategoryPicker
                ref={categoryRef}
                value={categoryIds}
                onChange={handleCategoriesChange}
                invalid={categoryMissing}
                initial={articleCategories(article)}
              />

              {/* Title + slug */}
              <div className="rounded-t-2xl border border-b-0 border-border bg-card px-6 pt-7 pb-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlignLeft className="h-3.5 w-3.5 text-primary/70" />
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/70">
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
                    placeholder:text-muted-foreground
                    focus:outline-none border-none p-0"
                />
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
              <div className="border-x border-border bg-card px-6 py-5">
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
                  <ImageIcon className="h-3.5 w-3.5 text-primary/70" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/70">
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
                      className="relative flex flex-col items-center justify-center gap-3
                        rounded-xl border-2 border-dashed border-border/60 px-4 py-8 cursor-pointer
                        hover:border-primary/40 hover:bg-primary/3 transition-all duration-150"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl
                        border border-border/60 bg-muted/50"
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
              <div className="rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3.5">
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
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3.5">
                  <Zap className="h-3.5 w-3.5 text-primary/70" />
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary/70">
                    Update
                  </span>
                </div>
                <div className="p-4 space-y-2.5">
                  <button
                    onClick={() => handleSubmit('PUBLISHED')}
                    disabled={
                      updateMutation.isPending || uploading || !formData.title || !formData.content
                    }
                    className="group relative w-full flex items-center justify-center gap-2
                      overflow-hidden rounded-xl bg-primary px-4 py-2.5
                      text-[13px] font-bold text-primary-foreground
                      hover:brightness-105
                      disabled:opacity-40 disabled:cursor-not-allowed
                      active:scale-[0.98] transition-all duration-150"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                    {isPublished ? 'Save changes' : 'Publish Article'}
                  </button>
                  <button
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={updateMutation.isPending || uploading || !formData.title}
                    className="w-full flex items-center justify-center gap-2 rounded-xl
                      border border-border bg-card/40
                      px-4 py-2.5 text-[13px] font-semibold
                      text-muted-foreground hover:text-foreground hover:border-border
                      disabled:opacity-40 disabled:cursor-not-allowed
                      transition-all duration-150"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {isPublished ? 'Move to drafts' : 'Save as Draft'}
                  </button>

                  {wordCount > 0 && (
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
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

export default function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <AuthGate
      require="writer"
      title="Sign in to edit articles"
      description="The editor is available to Eightblock writers. Sign in with your Google account."
    >
      <EditArticlePageEditor params={params} />
    </AuthGate>
  );
}
