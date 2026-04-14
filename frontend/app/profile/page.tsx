'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, User, Save, Upload, X, Share2, AlertCircle } from 'lucide-react';
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
  const { toast } = useToast();
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

  // Fetch user articles for stats (limited, aggregate stats only)
  const { data: articlesData } = useQuery({
    queryKey: ['user-articles-stats', address],
    queryFn: () => fetchUserArticles(address!, 1, 50),
    enabled: connected && !!address,
    staleTime: 5 * 60 * 1000,
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
        } catch {
          // balance unavailable — non-critical, swallow silently
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

      toast({
        title: 'Avatar updated!',
        description: `Image optimized to ${Math.round(data.avatar.size / 1024)}KB`,
      });
    },
    onError: (error: Error) => {
      toast({
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
      toast({
        title: 'Profile updated!',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
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
        toast({
          title: 'Profile link copied',
          description: 'Public profile URL copied to your clipboard.',
        });
        return;
      }
      throw new Error('Clipboard unavailable');
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      toast({
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
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-rose-400/70" />
        <h3 className="text-lg font-black text-foreground mb-2">Failed to load profile</h3>
        <p className="text-[14px] text-muted-foreground/50 mb-6">Unable to fetch your profile information</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['user-profile'] })}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-border/50 dark:border-border/20">
        {/* bg: radial gold glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_0%,hsl(var(--primary)/0.08),transparent)]" />
        {/* bg: grid texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)/0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* ghost watermark */}
        {(profile.name || address) && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center overflow-hidden select-none">
            <span className="font-black leading-none text-foreground/[0.025] translate-x-1/4"
              style={{ fontSize: 'clamp(100px, 18vw, 260px)' }}>
              {(profile.name || address || '').slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">

            {/* Avatar — click to pick file */}
            <div
              className="relative flex-shrink-0 group cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="Upload profile photo"
              onClick={() => !uploadAvatarMutation.isPending && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !uploadAvatarMutation.isPending) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden
                border-2 border-border bg-card shadow-md
                dark:border-border/40 dark:shadow-xl dark:shadow-black/30
                group-hover:border-primary/60 transition-colors duration-200">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-card/60">
                    <User className="h-10 w-10 text-muted-foreground/15" />
                  </div>
                )}
                {/* hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center
                  bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <Upload className="h-5 w-5 text-white/80" />
                </div>
              </div>
              {selectedFile && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center
                  rounded-full border-2 border-background bg-primary">
                  <Upload className="h-2.5 w-2.5 text-primary-foreground" />
                </span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploadAvatarMutation.isPending}
              />
            </div>

            {/* Identity block */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-px w-5 bg-primary/50" />
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
                  My Profile
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-none mb-2">
                {profile.name || (
                  <span className="text-muted-foreground/35">Unnamed Creator</span>
                )}
              </h1>
              <p className="font-mono text-[12px] text-muted-foreground/55 dark:text-muted-foreground/30 mb-3 truncate">
                {address?.slice(0, 10)}…{address?.slice(-8)}
              </p>
              {profile.bio && (
                <p className="text-[14px] text-foreground/55 leading-relaxed max-w-lg mb-4 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleShareProfile}
                  className="flex items-center gap-2 rounded-xl border border-border bg-muted/40
                    dark:border-border/50 dark:bg-card/40
                    px-3.5 py-2 text-[13px] font-semibold text-foreground/70
                    hover:border-border hover:text-foreground hover:bg-muted/60 dark:hover:bg-card
                    transition-all duration-150"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share Profile
                </button>
                {selectedFile && (
                  <button
                    onClick={handleUploadAvatar}
                    disabled={uploadAvatarMutation.isPending}
                    className="group relative flex items-center gap-2 overflow-hidden rounded-xl
                      bg-primary px-3.5 py-2 text-[13px] font-bold text-primary-foreground
                      shadow-lg shadow-primary/20 hover:brightness-105
                      disabled:opacity-60 transition-all duration-150"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full
                      bg-gradient-to-r from-transparent via-white/15 to-transparent
                      group-hover:translate-x-full transition-transform duration-500" />
                    {uploadAvatarMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {uploadAvatarMutation.isPending ? 'Uploading…' : 'Upload Photo'}
                  </button>
                )}
                {selectedFile && !uploadAvatarMutation.isPending && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40
                      text-muted-foreground/35 hover:text-foreground/70 hover:bg-card/60
                      transition-all duration-150"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">

        {/* Stats */}
        <StatsCard articles={[]} stats={stats} />

        {/* Wallet */}
        <WalletCard
          address={address}
          balance={balance}
          copied={copied}
          onCopyAddress={copyAddress}
        />

        {/* Edit form */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden dark:border-border/30">
          <div className="border-b border-border/50 dark:border-border/25 px-6 py-5">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-px w-5 bg-primary/50" />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
                Settings
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Profile Information
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Display name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60 dark:text-muted-foreground/45"
              >
                Display Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={updateProfileMutation.isPending}
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5
                  text-[15px] text-foreground placeholder:text-muted-foreground/50 dark:placeholder:text-muted-foreground/30
                  focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10
                  disabled:opacity-50 transition-colors duration-150"
              />
              <p className="text-[11px] text-muted-foreground/55 dark:text-muted-foreground/35">
                This is how your name appears to other readers
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60 dark:text-muted-foreground/45"
              >
                Email{' '}
                <span className="normal-case font-sans text-[11px] text-muted-foreground/25">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={updateProfileMutation.isPending}
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5
                  text-[15px] text-foreground placeholder:text-muted-foreground/50 dark:placeholder:text-muted-foreground/30
                  focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10
                  disabled:opacity-50 transition-colors duration-150"
              />
              <p className="text-[11px] text-muted-foreground/55 dark:text-muted-foreground/35">
                For upcoming notifications. Leave blank to stay private.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label
                htmlFor="bio"
                className="block font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60 dark:text-muted-foreground/45"
              >
                Bio
              </label>
              <textarea
                id="bio"
                placeholder="Tell us about yourself…"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={updateProfileMutation.isPending}
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-background/60 px-4 py-2.5
                  text-[15px] text-foreground placeholder:text-muted-foreground/50 dark:placeholder:text-muted-foreground/30 leading-relaxed
                  focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10
                  disabled:opacity-50 transition-colors duration-150"
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground/55 dark:text-muted-foreground/35">
                  Brief description shown on your public profile.
                </p>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    formData.bio.length > 180 ? 'text-rose-400/70' : 'text-muted-foreground/45 dark:text-muted-foreground/25'
                  }`}
                >
                  {formData.bio.length}/200
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 border-t border-border/50 dark:border-border/25 pt-5">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending}
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl
                  bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground
                  shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.97]
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full
                  bg-gradient-to-r from-transparent via-white/15 to-transparent
                  group-hover:translate-x-full transition-transform duration-500" />
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {updateProfileMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: profile.name || '',
                    bio: profile.bio || '',
                    email: profile.email || '',
                  });
                  handleRemoveAvatar();
                }}
                disabled={updateProfileMutation.isPending}
                className="rounded-xl border border-border dark:border-border/40 px-5 py-2.5
                  text-[13px] font-semibold text-muted-foreground/60 dark:text-muted-foreground/50
                  hover:text-foreground/80 hover:border-border hover:bg-muted/40 dark:hover:bg-card/60
                  disabled:opacity-50 transition-all duration-150"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
