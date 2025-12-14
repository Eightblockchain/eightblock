'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, User, Save, Upload, X, Mail, Share2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletCard } from '@/components/profile/WalletCard';
import { StatsCard } from '@/components/profile/StatsCard';
import { LoadingState } from '@/components/profile/LoadingState';
import { ProfilePageSkeleton } from '@/components/profile/profile-skeleton';
import Image from 'next/image';
import {
  fetchCurrentUserProfile,
  updateUserProfile,
  uploadAvatar,
  fetchUserArticles,
} from '@/lib/services/user-service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProfilePage() {
  const { connected, connecting, address, wallet } = useWallet();
  const router = useRouter();
  const toast = useToast?.() || { toast: () => {} };
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '',
  });

  // Redirect if not connected
  useEffect(() => {
    if (!connecting && !connected) {
      router.push('/');
    }
  }, [connecting, connected, router]);

  // Fetch user profile using React Query
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchCurrentUserProfile,
    enabled: connected,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user articles for stats
  const { data: articlesData } = useQuery({
    queryKey: ['user-articles', address],
    queryFn: () => fetchUserArticles(address!, 1, 1000),
    enabled: connected && !!address,
    staleTime: 2 * 60 * 1000,
  });

  // Calculate stats from articles
  const stats = useMemo(() => {
    if (!articlesData?.articles) {
      return { views: 0, uniqueViews: 0, likes: 0, articles: 0, drafts: 0 };
    }

    const allArticles = articlesData.articles;
    const published = allArticles.filter((a: any) => a.status === 'PUBLISHED').length;
    const drafts = allArticles.filter((a: any) => a.status === 'DRAFT').length;
    const totalLikes = allArticles.reduce((sum: number, a: any) => sum + (a._count?.likes || 0), 0);
    const totalViews = allArticles.reduce((sum: number, a: any) => sum + (a.viewCount || 0), 0);
    const totalUniqueViews = allArticles.reduce(
      (sum: number, a: any) => sum + (a.uniqueViews || 0),
      0
    );

    return {
      views: totalViews,
      uniqueViews: totalUniqueViews,
      likes: totalLikes,
      articles: published,
      drafts,
    };
  }, [articlesData]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        email: profile.email || '',
      });
      // Set avatar preview from server
      if (profile.avatarUrl) {
        setAvatarPreview(
          profile.avatarUrl.startsWith('http')
            ? profile.avatarUrl
            : `${API_URL.replace('/api', '')}${profile.avatarUrl}`
        );
      }
    }
  }, [profile]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet) {
        try {
          const lovelace = await wallet.getLovelace();
          const ada = (parseInt(lovelace) / 1_000_000).toFixed(2);
          setBalance(ada);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      }
    };

    if (wallet) {
      fetchBalance();
    }
  }, [wallet]);

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(['user-profile'], data.user);
      setSelectedFile(null);

      // Update preview with server URL
      const avatarUrl = data.user.avatarUrl?.startsWith('http')
        ? data.user.avatarUrl
        : `${API_URL.replace('/api', '')}${data.user.avatarUrl}`;
      setAvatarPreview(avatarUrl);

      toast.toast?.({
        title: 'Avatar updated!',
        description: `Image optimized to ${Math.round(data.avatar.size / 1024)}KB`,
      });
    },
    onError: (error: Error) => {
      toast.toast?.({
        title: 'Upload failed',
        description: error.message || 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['user-profile'], updatedProfile);
      setFormData({
        name: updatedProfile.name || '',
        bio: updatedProfile.bio || '',
        email: updatedProfile.email || '',
      });
      toast.toast?.({
        title: 'Profile updated!',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast.toast?.({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.toast?.({
        title: 'Invalid file type',
        description: 'Please select a JPEG, PNG, WebP, or GIF image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.toast?.({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = () => {
    if (!selectedFile) return;
    uploadAvatarMutation.mutate(selectedFile);
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setAvatarPreview(
      profile?.avatarUrl
        ? profile.avatarUrl.startsWith('http')
          ? profile.avatarUrl
          : `${API_URL.replace('/api', '')}${profile.avatarUrl}`
        : null
    );
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareProfile = async () => {
    if (!address) return;
    const shareUrl = `${window.location.origin}/profile/${address}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: profile?.name ? `${profile.name} · EightBlock` : 'EightBlock Creator',
          text: 'Discover my work on EightBlock',
          url: shareUrl,
        });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.toast?.({
          title: 'Profile link copied',
          description: 'Public profile URL copied to your clipboard.',
        });
        return;
      }
      throw new Error('Clipboard unavailable');
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      toast.toast?.({
        title: 'Unable to share profile',
        description: 'Copy the link manually if native sharing is unavailable.',
        variant: 'destructive',
      });
    }
  };

  if (connecting || profileLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!connected || !address) {
    return null;
  }

  if (profileError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load profile</h3>
          <p className="text-gray-600 mb-4">Unable to fetch your profile information</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['user-profile'] })}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#080808]">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your profile information and settings</p>
        </div>
        <Button variant="outline" className="gap-2 self-start" onClick={handleShareProfile}>
          <Share2 className="h-4 w-4" /> Share public profile
        </Button>
      </div>

      {/* Wallet Info */}
      <div className="mb-8">
        <WalletCard
          address={address}
          balance={balance}
          copied={copied}
          onCopyAddress={copyAddress}
        />
      </div>

      <div className="mb-8">
        <Card className="p-4 flex items-start gap-4 border border-dashed border-gray-200">
          <div className="p-2 bg-blue-50 rounded-full">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact Email (optional)</p>
            {profile.email ? (
              <p className="text-lg font-semibold text-[#080808]">{profile.email}</p>
            ) : (
              <p className="text-lg font-semibold text-gray-400">No email added yet</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Add an email so we can reach out when new communication features launch.
            </p>
          </div>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#080808] mb-4">Your Stats</h2>
        <StatsCard articles={[]} stats={stats} />
      </div>

      {/* Profile Edit Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
            <User className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#080808]">Profile Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={updateProfileMutation.isPending}
            />
            <p className="text-sm text-gray-500">This is how your name will appear to others</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-gray-500">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={updateProfileMutation.isPending}
            />
            <p className="text-sm text-gray-500">
              We&apos;ll use this for upcoming notifications or newsletters. Leave blank if you
              prefer not to share it yet.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={updateProfileMutation.isPending}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              Brief description for your profile. Max 200 characters.
            </p>
          </div>

          {/* Avatar Upload Section */}
          <div className="space-y-2">
            <Label>Profile Avatar</Label>
            <div className="flex items-start gap-4">
              {/* Avatar Preview */}
              <div className="flex-shrink-0">
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadAvatarMutation.isPending}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatarMutation.isPending || updateProfileMutation.isPending}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>

                  {selectedFile && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleUploadAvatar}
                        disabled={uploadAvatarMutation.isPending || updateProfileMutation.isPending}
                      >
                        {uploadAvatarMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={uploadAvatarMutation.isPending || updateProfileMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  Upload a profile picture. JPEG, PNG, WebP, or GIF. Max 10MB.
                  <br />
                  Image will be automatically optimized and resized to 400x400px.
                </p>

                {selectedFile && (
                  <p className="text-sm text-blue-600">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending}
              variant="default"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  name: profile.name || '',
                  bio: profile.bio || '',
                  email: profile.email || '',
                });
                handleRemoveAvatar();
              }}
              disabled={updateProfileMutation.isPending}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
