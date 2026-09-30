import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultPortfolio, getPortfolio, paragraphs, type Portfolio } from '@/lib/portfolio';
import { resolveAvatarSrc } from '@eightblock/ui/components/avatar';

const respond = (body: unknown, ok = true) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => body }));

afterEach(() => vi.unstubAllGlobals());

describe('getPortfolio', () => {
  it('falls back to the defaults when nothing is saved', async () => {
    respond(null);
    expect(await getPortfolio()).toEqual(defaultPortfolio);
  });

  it('falls back to the defaults when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    expect(await getPortfolio()).toEqual(defaultPortfolio);
    respond({ error: 'boom' }, false);
    expect(await getPortfolio()).toEqual(defaultPortfolio);
  });

  it('fills empty saved fields from the defaults', async () => {
    const saved: Portfolio = {
      name: 'Mechack',
      avatarUrl: 'https://lh3.googleusercontent.com/a=s400-c',
      headline: 'Builder',
      intro: null,
      story: '',
      location: 'Kinshasa',
      focusAreas: [],
      projects: [{ name: 'Eightblock', description: '' }],
      links: {},
    };
    respond(saved);
    const result = await getPortfolio();
    expect(result).toMatchObject({ name: 'Mechack', headline: 'Builder', location: 'Kinshasa' });
    expect(result.intro).toBe(defaultPortfolio.intro);
    expect(result.story).toBe(defaultPortfolio.story);
    expect(result.focusAreas).toEqual(defaultPortfolio.focusAreas);
    expect(result.links).toEqual(defaultPortfolio.links);
    expect(result.projects).toEqual(saved.projects);
  });
});

describe('paragraphs', () => {
  it('splits on blank lines and drops empty blocks', () => {
    expect(paragraphs('One\nstill one\n\n  Two  \n\n\n')).toEqual(['One\nstill one', 'Two']);
    expect(paragraphs(null)).toEqual([]);
  });
});

describe('resolveAvatarSrc', () => {
  it('keeps absolute URLs and resolves uploads against the API origin', () => {
    expect(resolveAvatarSrc(null)).toBeNull();
    expect(resolveAvatarSrc('https://lh3.googleusercontent.com/x')).toBe(
      'https://lh3.googleusercontent.com/x'
    );
    expect(resolveAvatarSrc('/uploads/avatars/a.webp')).toMatch(
      /^https?:\/\/[^/]+\/uploads\/avatars\/a\.webp$/
    );
  });
});
