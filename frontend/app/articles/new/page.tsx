'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { ArrowLeft, Save, Eye, Loader2, Upload, X } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: '',
    featuredImageUrl: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
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

  const uploadFeaturedImage = async (): Promise<string | null> => {
    if (!featuredImageFile) return formData.featuredImageUrl || null;

    setUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      const uploadFormData = new FormData();
      uploadFormData.append('image', featuredImageFile);

      const response = await fetch(`${API_URL}/upload/article-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload featured image',
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image deletion from rich text editor
  const handleImageDelete = async (imageUrl: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${API_URL}/upload/article-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      // Silent fail - don't interrupt user experience
    }
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
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

    setSaving(true);

    try {
      // Upload featured image first if there's one
      let featuredImageUrl = formData.featuredImageUrl;
      if (featuredImageFile) {
        const uploadedUrl = await uploadFeaturedImage();
        if (uploadedUrl) {
          featuredImageUrl = uploadedUrl;
        }
      }

      const token = localStorage.getItem('authToken');
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await fetch(`${API_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt || undefined,
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
        title: status === 'PUBLISHED' ? 'Article published!' : 'Draft saved!',
        description: `Your article has been ${status === 'PUBLISHED' ? 'published' : 'saved as draft'}`,
      });

      router.push(`/articles/${article.slug}`);
    } catch (error) {
      console.error('Error creating article:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create article',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!connected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600 mb-6">You need to connect your wallet to create articles</p>
        <Button onClick={() => router.push('/')}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-[60]">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/profile/articles">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Create New Article</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
                <Eye className="h-4 w-4 mr-2" />
                {preview ? 'Edit' : 'Preview'}
              </Button>
              <Button variant="outline" onClick={() => handleSubmit('DRAFT')} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
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

      {/* Editor Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {preview ? (
          // Preview Mode
          <Card className="p-8">
            <article className="prose prose-lg max-w-none">
              <h1>{formData.title || 'Untitled Article'}</h1>
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

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="cardano, blockchain, web3 (comma-separated)"
                  />
                </div>

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
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
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
              <Label className="mb-2 block">Content *</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                onImageDelete={handleImageDelete}
                placeholder="Start writing your article..."
                minHeight="500px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
