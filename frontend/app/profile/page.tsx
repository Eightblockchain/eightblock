'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, User, Save, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WalletCard } from '@/components/profile/WalletCard';
import { StatsCard } from '@/components/profile/StatsCard';
import { LoadingState } from '@/components/profile/LoadingState';
import { ProfilePageSkeleton } from '@/components/profile/profile-skeleton';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface UserProfile {
  id: string;
  walletAddress: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
}

export default function ProfilePage() {
  const { connected, connecting, address, wallet } = useWallet();
  const router = useRouter();
  const toast = useToast?.() || { toast: () => {} };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stats, setStats] = useState({
    views: 0,
    uniqueViews: 0,
    likes: 0,
    articles: 0,
    drafts: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  });

  useEffect(() => {
    if (!connecting && !connected) {
      router.push('/');
      return;
    }

    if (connected && address) {
      fetchProfile();
      fetchBalance();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, connecting, address, router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        bio: data.bio || '',
      });
      // Set avatar preview from server
      if (data.avatarUrl) {
        setAvatarPreview(
          data.avatarUrl.startsWith('http')
            ? data.avatarUrl
            : `${API_URL.replace('/api', '')}${data.avatarUrl}`
        );
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.toast?.({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const fetchStats = async () => {
    try {
      if (!address) return;

      const response = await fetch(`${API_URL}/articles/wallet/${address}?page=1&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        const allArticles = data.articles || [];
        const published = allArticles.filter((a: any) => a.status === 'PUBLISHED').length;
        const drafts = allArticles.filter((a: any) => a.status === 'DRAFT').length;
        const totalLikes = allArticles.reduce(
          (sum: number, a: any) => sum + (a._count?.likes || 0),
          0
        );
        const totalViews = allArticles.reduce((sum: number, a: any) => sum + (a.viewCount || 0), 0);
        const totalUniqueViews = allArticles.reduce(
          (sum: number, a: any) => sum + (a.uniqueViews || 0),
          0
        );

        setStats({
          views: totalViews,
          uniqueViews: totalUniqueViews,
          likes: totalLikes,
          articles: published,
          drafts,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

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

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload avatar');

      const data = await response.json();
      setProfile(data.user);
      setSelectedFile(null);

      // Update preview with server URL
      const avatarUrl = data.user.avatarUrl.startsWith('http')
        ? data.user.avatarUrl
        : `${API_URL.replace('/api', '')}${data.user.avatarUrl}`;
      setAvatarPreview(avatarUrl);

      toast.toast?.({
        title: 'Avatar updated!',
        description: `Image optimized to ${Math.round(data.avatar.size / 1024)}KB`,
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.toast?.({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const updated = await response.json();
      setProfile(updated);

      toast.toast?.({
        title: 'Profile updated!',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.toast?.({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || connecting) {
    return <ProfilePageSkeleton />;
  }

  if (!connected || !address || !profile) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#080808]">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage your profile information and settings</p>
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
              disabled={saving}
            />
            <p className="text-sm text-gray-500">This is how your name will appear to others</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={saving}
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
                  disabled={uploading}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || saving}
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
                        disabled={uploading || saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {uploading ? (
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
                        disabled={uploading || saving}
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
              disabled={saving || uploading}
              className="bg-[#080808] hover:bg-gray-800 text-white"
            >
              {saving ? (
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
                });
                handleRemoveAvatar();
              }}
              disabled={saving}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
