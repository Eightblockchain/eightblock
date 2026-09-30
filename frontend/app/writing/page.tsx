import type { Metadata } from 'next';
import { listingMetadata, tagLabel, tagParam } from '@/lib/listing-metadata';
import { WritingView } from './writing-view';

type Props = { searchParams: Promise<{ tag?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const tag = tagParam((await searchParams).tag);
  if (!tag) {
    return listingMetadata({
      path: '/writing',
      tag: null,
      title: 'Articles',
      description:
        'Every essay, tutorial and note on web3, smart contracts and decentralized systems.',
    });
  }
  const name = await tagLabel(tag);
  return listingMetadata({
    path: '/writing',
    tag,
    title: `${name} articles`,
    description: `Every Eightblock article about ${name}: essays, tutorials and notes, newest first.`,
  });
}

export default async function WritingPage({ searchParams }: Props) {
  const tag = tagParam((await searchParams).tag);
  const tagName = tag ? await tagLabel(tag) : null;
  return <WritingView key={tag ?? 'all'} tag={tag} tagName={tagName} />;
}
