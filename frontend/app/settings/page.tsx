'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { AuthGate } from '@/components/auth/auth-gate';
import { GoogleIcon } from '@/components/auth/google-button';
import { useSignOut } from '@/components/layout/user-menu';
import { Panel } from '@eightblock/ui/components/panel';
import { Avatar } from '@eightblock/ui/components/avatar';
import { Field, FormSection } from '@eightblock/ui/components/field';
import { Input } from '@eightblock/ui/components/input';
import { Textarea } from '@eightblock/ui/components/textarea';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { ShareButton } from '@eightblock/ui/components/share-button';
import { useCurrentUser, type CurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { updateMyProfile, uploadMyAvatar } from '@/lib/api';
import { canWrite } from '@/lib/auth';
import { siteConfig } from '@/lib/site-config';

const NAME_MAX = 80;
const BIO_MAX = 500;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Mirrors the API rule so most mistakes are caught before saving. */
function usernameProblem(value: string): string | null {
  if (value.length < 3) return 'Use at least 3 characters.';
  if (!/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers and hyphens.';
  if (value.startsWith('-') || value.endsWith('-')) return 'Start and end with a letter or number.';
  return null;
}

const roleLabels: Record<CurrentUser['role'], string> = {
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  WRITER: 'Writer',
  READER: 'Reader',
};

function ProfileSettings({ user }: { user: CurrentUser }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const handleSignOut = useSignOut();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [username, setUsername] = useState(user.username ?? '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    setName(user.name ?? '');
    setBio(user.bio ?? '');
    setUsername(user.username ?? '');
  }, [user.name, user.bio, user.username]);

  const hasPublicPage = canWrite(user.role);
  const usernameChanged = hasPublicPage && username !== (user.username ?? '');
  const usernameHint = usernameChanged ? usernameProblem(username) : null;
  const dirty =
    name.trim() !== (user.name ?? '') || bio.trim() !== (user.bio ?? '') || usernameChanged;
  const invalid = !name.trim() || name.length > NAME_MAX || bio.length > BIO_MAX || !!usernameHint;
  const usingGooglePhoto = !!user.googleAvatarUrl && user.avatarUrl === user.googleAvatarUrl;

  const applyUser = (next: CurrentUser) => queryClient.setQueryData(['current-user'], next);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dirty || invalid) return;
    setSaving(true);
    try {
      applyUser(
        await updateMyProfile({
          name: name.trim(),
          bio: bio.trim(),
          ...(usernameChanged && { username }),
        })
      );
      setUsernameError(null);
      toast({ title: 'Profile saved' });
    } catch (error) {
      const message = (error as Error).message;
      if (usernameChanged && /username/i.test(message))
        setUsernameError(message.replace(/^username: /, ''));
      toast({ title: message || 'Could not save your profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({ title: 'That image is larger than 10 MB', variant: 'destructive' });
      return;
    }
    setPhotoBusy(true);
    try {
      const result = await uploadMyAvatar(file);
      applyUser(result.user);
      toast({ title: 'Photo updated' });
    } catch (error) {
      toast({ title: (error as Error).message || 'Upload failed', variant: 'destructive' });
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleAvatarSource = async (avatar: 'google' | 'none') => {
    setPhotoBusy(true);
    try {
      applyUser(await updateMyProfile({ avatar }));
      toast({ title: avatar === 'google' ? 'Using your Google photo' : 'Photo removed' });
    } catch {
      toast({ title: 'Could not update your photo', variant: 'destructive' });
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="container-page max-w-4xl py-14 sm:py-16">
      <Eyebrow>Account</Eyebrow>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
        Profile settings
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Your name and photo appear next to the replies you leave on articles.
      </p>

      <form onSubmit={handleSave} className="mt-10">
        <Panel className="p-6 sm:p-8">
          <FormSection title="Photo" description="Shown on your replies and in the account menu.">
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative">
                <Avatar src={user.avatarUrl} name={user.name} size="2xl" />
                {photoBusy && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                    <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-pill-outline"
                    disabled={photoBusy}
                    onClick={() => fileInput.current?.click()}
                  >
                    Upload photo
                  </button>
                  {user.googleAvatarUrl && !usingGooglePhoto && (
                    <button
                      type="button"
                      className="btn-pill-outline"
                      disabled={photoBusy}
                      onClick={() => handleAvatarSource('google')}
                    >
                      <GoogleIcon className="h-4 w-4" />
                      Use Google photo
                    </button>
                  )}
                  {user.avatarUrl && (
                    <button
                      type="button"
                      className="inline-flex h-9 items-center px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      disabled={photoBusy}
                      onClick={() => handleAvatarSource('none')}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usingGooglePhoto
                    ? 'Synced from your Google account. JPG, PNG or WebP up to 10 MB to replace it.'
                    : 'JPG, PNG or WebP, up to 10 MB. Square images look best.'}
                </p>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </FormSection>

          <FormSection
            title="Public profile"
            description={
              hasPublicPage
                ? 'Shown on your replies, your articles and your public author page.'
                : 'Readers see this when they look at your replies.'
            }
          >
            <Field label="Name" htmlFor="name" count={{ value: name.length, max: NAME_MAX }}>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </Field>
            <Field
              label="Bio"
              htmlFor="bio"
              count={{ value: bio.length, max: BIO_MAX }}
              hint="A sentence or two about what you work on. Optional."
            >
              <Textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                placeholder="Smart contract developer building on Cardano."
              />
            </Field>
            {hasPublicPage && (
              <Field
                label="Username"
                htmlFor="username"
                hint={
                  usernameHint || usernameError ? (
                    <span className="text-destructive">{usernameHint || usernameError}</span>
                  ) : (
                    'Your public page lists everything you have published. Anyone can open it, no sign-in needed.'
                  )
                }
              >
                <div className="flex h-10 items-stretch overflow-hidden rounded-md border border-input bg-background transition-colors focus-within:border-brand-blue">
                  <span className="flex select-none items-center border-r border-input bg-muted px-3 font-mono text-xs text-muted-foreground">
                    /authors/
                  </span>
                  <input
                    id="username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value.toLowerCase().replace(/\s+/g, '-'));
                      setUsernameError(null);
                    }}
                    maxLength={30}
                    autoComplete="username"
                    spellCheck={false}
                    aria-invalid={!!(usernameHint || usernameError)}
                    className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {user.username && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Link
                      href={`/authors/${user.username}`}
                      className="btn-pill-outline h-8 px-3 text-xs"
                    >
                      View public page
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <ShareButton
                      url={`/authors/${user.username}`}
                      label="Copy link"
                      className="h-8 px-3 text-xs"
                    />
                  </div>
                )}
              </Field>
            )}
          </FormSection>

          <FormSection title="Account" description="Sign-in is handled by Google.">
            <Field label="Email" htmlFor="email" hint="Your email is never shown publicly.">
              <div className="relative">
                <Input id="email" value={user.email ?? ''} readOnly disabled className="pr-36" />
                <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-xs text-muted-foreground">
                  <GoogleIcon className="h-3.5 w-3.5" />
                  Google account
                </span>
              </div>
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="ledger-label">Role</p>
                <p className="mt-1 text-sm text-foreground">{roleLabels[user.role]}</p>
              </div>
              <button
                type="button"
                className="btn-pill-outline"
                onClick={() => void handleSignOut()}
              >
                Sign out
              </button>
            </div>
          </FormSection>
        </Panel>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {user.role === 'ADMIN' ? (
            <a
              href={`${siteConfig.adminUrl}/portfolio`}
              className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Edit the portfolio on your About page
              <ArrowUpRight className="h-4 w-4 transition-colors group-hover:text-brand-blue" />
            </a>
          ) : (
            <span />
          )}
          <button type="submit" className="btn-pill" disabled={!dirty || invalid || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGate
      title="Sign in to edit your profile"
      description="Your profile is linked to your Google account."
    >
      <SettingsContent />
    </AuthGate>
  );
}

function SettingsContent() {
  const { data: user } = useCurrentUser();
  if (!user) return null;
  return <ProfileSettings user={user} />;
}
