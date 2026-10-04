import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArticleArchive } from '@/components/articles/article-archive';
import { Avatar } from '@eightblock/ui/components/avatar';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { ShareButton } from '@eightblock/ui/components/share-button';
import { fetchPublicAuthor, listingMetadata, tagLabel, tagParam } from '@/lib/listing-metadata';
import { OwnerActions } from './owner-actions';

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tag?: string | string[] }>;
};

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ username }, { tag: rawTag }] = await Promise.all([params, searchParams]);
  const author = await fetchPublicAuthor(username);
  if (!author) return { title: 'Author not found', robots: { index: false } };

  const name = author.name || author.username;
  const tag = tagParam(rawTag);
  const path = `/authors/${author.username}`;
  const count = `${author.articleCount} article${author.articleCount === 1 ? '' : 's'}`;

  if (!tag) {
    return listingMetadata({
      path,
      query: {},
      title: name,
      description: author.bio || `${count} by ${name} on Eightblock.`,
    });
  }
  const topic = await tagLabel(tag, author.username);
  return listingMetadata({
    path,
    query: { tag },
    title: `${topic} articles by ${name}`,
    description: `Everything ${name} has published about ${topic} on Eightblock.`,
  });
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const [{ username }, { tag: rawTag }] = await Promise.all([params, searchParams]);
  const author = await fetchPublicAuthor(username);
  if (!author) notFound();

  const tag = tagParam(rawTag);
  const path = `/authors/${author.username}`;
  if (username !== author.username) {
    permanentRedirect(tag ? `${path}?tag=${encodeURIComponent(tag)}` : path);
  }

  const name = author.name || author.username;
  const tagName = tag ? await tagLabel(tag, author.username) : null;

  return (
    <>
      <section className="border-b border-border">
        <div className="container-page flex flex-col gap-8 py-14 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar
              src={author.avatarUrl}
              name={name}
              size="2xl"
              className="border border-border"
            />
            <div className="min-w-0 max-w-2xl">
              <Eyebrow>Author</Eyebrow>
              <h1 className="mt-4 break-words font-display text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
                {name}
              </h1>
              <p className="mt-2 font-mono text-sm text-muted-foreground">@{author.username}</p>
              {author.bio && (
                <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                  {author.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-6 lg:items-end">
            <dl className="flex gap-8">
              <div>
                <dt className="ledger-label">Articles</dt>
                <dd className="mt-1 font-mono text-xl tabular-nums text-foreground">
                  {author.articleCount}
                </dd>
              </div>
              <div>
                <dt className="ledger-label">Member since</dt>
                <dd className="mt-1 font-mono text-xl tabular-nums text-foreground">
                  {monthYear(author.joinedAt)}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <ShareButton url={path} label="Share profile" title={`${name} on Eightblock`} />
              <OwnerActions authorId={author.id} />
            </div>
          </div>
        </div>
      </section>

      <ArticleArchive
        key={tag ?? 'all'}
        basePath={path}
        tag={tag}
        tagName={tagName}
        author={author.username}
        shareAll={false}
      />
    </>
  );
}
