'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Loader2, Plus, X } from 'lucide-react';
import { Panel } from '@eightblock/ui/components/panel';
import { Avatar } from '@eightblock/ui/components/avatar';
import { Field, FormSection } from '@eightblock/ui/components/field';
import { Input } from '@eightblock/ui/components/input';
import { Textarea } from '@eightblock/ui/components/textarea';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { ApiError, savePortfolio } from '@/lib/api';
import { siteHref } from '@/lib/site-config';
import {
  emptyPortfolio,
  fetchPortfolio,
  type PortfolioInput,
  type PortfolioLinks,
  type PortfolioProject,
} from '@/lib/portfolio';

const LIMITS = { headline: 160, location: 80, intro: 600, story: 8000, list: 12 };

const linkFields: { key: keyof PortfolioLinks; label: string; placeholder: string }[] = [
  { key: 'website', label: 'Website', placeholder: 'https://yourname.dev' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourname' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/yourname' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
  { key: 'email', label: 'Contact email', placeholder: 'hello@yourname.dev' },
];

function toForm(source: PortfolioInput): PortfolioInput {
  return {
    headline: source.headline ?? '',
    intro: source.intro ?? '',
    story: source.story ?? '',
    location: source.location ?? '',
    focusAreas: source.focusAreas.length ? [...source.focusAreas] : [''],
    projects: source.projects.map((project) => ({ ...project, url: project.url ?? '' })),
    links: { ...source.links },
  };
}

function toPayload(form: PortfolioInput): PortfolioInput {
  return {
    ...form,
    focusAreas: form.focusAreas.map((area) => area.trim()).filter(Boolean),
    projects: form.projects
      .map((project) => ({
        name: project.name.trim(),
        description: project.description.trim(),
        url: project.url?.trim() || undefined,
      }))
      .filter((project) => project.name),
  };
}

const iconButton =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

export default function PortfolioEditorPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: saved,
    isSuccess,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => fetchPortfolio({ cache: 'no-store' }),
  });

  const [form, setForm] = useState<PortfolioInput | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isSuccess && form === null) setForm(toForm(saved ?? emptyPortfolio));
  }, [isSuccess, saved, form]);

  if (!form && isError) {
    return (
      <div className="container-page max-w-4xl py-14">
        <Panel className="p-8 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            Could not load your portfolio
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Editing is paused so a save cannot overwrite it with blank fields.
          </p>
          <button
            type="button"
            className="btn-pill mt-6"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            Try again
          </button>
        </Panel>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const update = <K extends keyof PortfolioInput>(key: K, value: PortfolioInput[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  const updateArea = (index: number, value: string) =>
    update(
      'focusAreas',
      form.focusAreas.map((area, i) => (i === index ? value : area))
    );

  const updateProject = (index: number, patch: Partial<PortfolioProject>) =>
    update(
      'projects',
      form.projects.map((project, i) => (i === index ? { ...project, ...patch } : project))
    );

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await savePortfolio(toPayload(form));
      queryClient.setQueryData(['portfolio'], result);
      toast({ title: 'Portfolio saved', description: 'Your About page is up to date.' });
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 400
          ? 'Links must start with https:// and the email must be valid.'
          : 'Please try again.';
      toast({
        title: 'Could not save the portfolio',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page max-w-4xl py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Portfolio</Eyebrow>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Your About page
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Tell readers who you are, what you work on and why you built Eightblock. Blank fields
            show the default text on the About page.
          </p>
        </div>
        <a href={siteHref('/about')} target="_blank" rel="noreferrer" className="btn-pill-outline">
          View About page
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <form onSubmit={handleSave} className="mt-10">
        <fieldset disabled={saving} className="contents">
          <Panel className="p-6 sm:p-8">
            <FormSection
              title="Identity"
              description="Your photo and name come from your account profile."
            >
              <div className="flex items-center gap-4">
                <Avatar src={user?.avatarUrl} name={user?.name} size="xl" />
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-foreground">
                    {user?.name || 'Your name'}
                  </p>
                  <a
                    href={siteHref('/settings')}
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    Change photo or name
                  </a>
                </div>
              </div>
              <Field
                label="Headline"
                htmlFor="headline"
                count={{ value: form.headline?.length ?? 0, max: LIMITS.headline }}
                hint="One line under your name, for example your role or what you build."
              >
                <Input
                  id="headline"
                  value={form.headline ?? ''}
                  onChange={(event) => update('headline', event.target.value)}
                  placeholder="Smart contract engineer and writer"
                />
              </Field>
              <Field label="Location" htmlFor="location" hint="Optional.">
                <Input
                  id="location"
                  value={form.location ?? ''}
                  onChange={(event) => update('location', event.target.value)}
                  placeholder="Kigali, Rwanda"
                  maxLength={LIMITS.location}
                />
              </Field>
            </FormSection>

            <FormSection
              title="Introduction"
              description="The short paragraph at the top of the About page."
            >
              <Field
                label="Intro"
                htmlFor="intro"
                count={{ value: form.intro?.length ?? 0, max: LIMITS.intro }}
              >
                <Textarea
                  id="intro"
                  rows={4}
                  value={form.intro ?? ''}
                  onChange={(event) => update('intro', event.target.value)}
                />
              </Field>
            </FormSection>

            <FormSection
              title="Your story"
              description="Why you built Eightblock, how you got into web3, what you hope readers take away."
            >
              <Field
                label="Story"
                htmlFor="story"
                count={{ value: form.story?.length ?? 0, max: LIMITS.story }}
                hint="Leave a blank line between paragraphs."
              >
                <Textarea
                  id="story"
                  rows={12}
                  value={form.story ?? ''}
                  onChange={(event) => update('story', event.target.value)}
                />
              </Field>
            </FormSection>

            <FormSection title="Focus areas" description="Topics you work on. Up to 12.">
              <div className="space-y-2">
                {form.focusAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 font-mono text-[11px] text-brand-blue">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Input
                      aria-label={`Focus area ${index + 1}`}
                      value={area}
                      onChange={(event) => updateArea(index, event.target.value)}
                      maxLength={80}
                    />
                    <button
                      type="button"
                      className={iconButton}
                      aria-label="Remove focus area"
                      onClick={() =>
                        update(
                          'focusAreas',
                          form.focusAreas.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {form.focusAreas.length < LIMITS.list && (
                <button
                  type="button"
                  className="btn-pill-outline"
                  onClick={() => update('focusAreas', [...form.focusAreas, ''])}
                >
                  <Plus className="h-4 w-4" />
                  Add focus area
                </button>
              )}
            </FormSection>

            <FormSection
              title="Projects"
              description="Things you have built or contributed to. Shown as a list on the About page."
            >
              {form.projects.length === 0 && (
                <p className="border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No projects yet.
                </p>
              )}
              {form.projects.map((project, index) => (
                <div key={index} className="space-y-3 border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="ledger-label">
                      Project {String(index + 1).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      className={iconButton}
                      aria-label="Remove project"
                      onClick={() =>
                        update(
                          'projects',
                          form.projects.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      aria-label="Project name"
                      placeholder="Name"
                      value={project.name}
                      maxLength={80}
                      onChange={(event) => updateProject(index, { name: event.target.value })}
                    />
                    <Input
                      aria-label="Project link"
                      placeholder="https://"
                      value={project.url ?? ''}
                      onChange={(event) => updateProject(index, { url: event.target.value })}
                    />
                  </div>
                  <Textarea
                    aria-label="Project description"
                    placeholder="What it is and your role in it."
                    rows={2}
                    className="min-h-[72px]"
                    maxLength={300}
                    value={project.description}
                    onChange={(event) => updateProject(index, { description: event.target.value })}
                  />
                </div>
              ))}
              {form.projects.length < LIMITS.list && (
                <button
                  type="button"
                  className="btn-pill-outline"
                  onClick={() =>
                    update('projects', [...form.projects, { name: '', description: '', url: '' }])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add project
                </button>
              )}
            </FormSection>

            <FormSection
              title="Links"
              description="Where readers can find you. Leave blank to hide."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {linkFields.map(({ key, label, placeholder }) => (
                  <Field key={key} label={label} htmlFor={`link-${key}`}>
                    <Input
                      id={`link-${key}`}
                      type={key === 'email' ? 'email' : 'url'}
                      placeholder={placeholder}
                      value={form.links[key] ?? ''}
                      onChange={(event) =>
                        update('links', { ...form.links, [key]: event.target.value })
                      }
                    />
                  </Field>
                ))}
              </div>
            </FormSection>
          </Panel>

          <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-4 border-t border-border bg-background py-4">
            <p className="text-xs text-muted-foreground">
              {saved?.updatedAt
                ? `Last saved ${new Date(saved.updatedAt).toLocaleString()}`
                : 'Not published yet. The About page shows default text until you save.'}
            </p>
            <button type="submit" className="btn-pill" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save portfolio
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
