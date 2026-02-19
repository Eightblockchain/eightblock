'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { TagInput } from '@/components/editor/TagInput';
import { ArrowLeft, Save, Eye, Loader2, Upload, X, AlertCircle } from 'lucide-react';
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

  if (!connected) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600 mb-6">You need to connect your wallet to edit articles</p>
        <Button onClick={() => router.push('/')}>Go to Home</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load article</h3>
          <p className="text-gray-600 mb-4">{(error as Error)?.message || 'An error occurred'}</p>
          <Button onClick={() => router.push('/profile/articles')}>Back to Articles</Button>
        </Card>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-[60]">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/articles/${article.slug}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Edit Article</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
                <Eye className="h-4 w-4 mr-2" />
                {preview ? 'Edit' : 'Preview'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubmit('DRAFT')}
                disabled={updateMutation.isPending || uploading}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Draft
              </Button>
              <Button
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={updateMutation.isPending || uploading}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {preview ? (
          // Preview Mode
          <Card className="p-8">
            <article className="prose prose-lg max-w-none">
              <h1>{formData.title}</h1>
              {formData.excerpt && <p className="lead">{formData.excerpt}</p>}
              {(featuredImagePreview || formData.featuredImageUrl) && (
                <div className="relative w-full rounded-lg overflow-hidden">
                  <Image
                    src={featuredImagePreview || formData.featuredImageUrl}
                    alt={formData.title}
                    width={1200}
                    height={630}
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
              <div dangerouslySetInnerHTML={{ __html: formData.content }} />
            </article>
          </Card>
        ) : (
          // Edit Mode
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter article title..."
                    className="text-2xl font-bold border-0 px-0 focus-visible:ring-0"
                  />
                </div>

                <div>
                  <Label>URL Slug</Label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md font-mono text-sm text-gray-600">
                    /articles/{formData.slug || 'your-article-slug'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-generated from title</p>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Input
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief description (optional)"
                  />
                </div>

                <TagInput
                  value={formData.tags}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                />

                <div>
                  <Label>Featured Image</Label>
                  <div className="space-y-3">
                    {featuredImagePreview ? (
                      <div className="relative w-full rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={featuredImagePreview}
                          alt="Featured image preview"
                          width={1200}
                          height={630}
                          className="w-full h-auto object-contain"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white border-red-500"
                          onClick={removeFeaturedImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleFeaturedImageSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Image
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Upload a featured image. JPEG, PNG, WebP, or GIF. Max 10MB.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Rich Text Editor */}
            <div>
              <Label className="mb-2 block text-base font-semibold">Content *</Label>
              <p className="text-sm text-gray-500 mb-3">
                Write your article content below using the rich text editor
              </p>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                onImageDelete={handleImageDelete}
                placeholder="Start writing your article..."
                minHeight="700px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
