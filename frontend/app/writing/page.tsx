import type { Metadata } from 'next';
import { listingMetadata, tagLabel, tagParam } from '@/lib/listing-metadata';
import { fetchCategoriesCached } from '@/lib/categories';
import { topicLabel } from '@/lib/topics';
import { WritingView } from './writing-view';

type Props = {
  searchParams: Promise<{ tag?: string | string[]; category?: string | string[] }>;
};

async function resolveFilters(searchParams: Props['searchParams']) {
  const params = await searchParams;
  const tag = tagParam(params.tag);
  const categorySlug = tagParam(params.category);
  const [tagName, categories] = await Promise.all([
    tag ? tagLabel(tag) : null,
    fetchCategoriesCached(),
  ]);
  const match = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined;
  const category = categorySlug
    ? {
        slug: categorySlug,
        name: match?.name ?? topicLabel(categorySlug),
        description: match?.description ?? null,
      }
    : null;
  return { tag, tagName, category, categories };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { tag, tagName, category } = await resolveFilters(searchParams);
  const query = { category: category?.slug ?? null, tag };
  if (category && tagName) {
    return listingMetadata({
      path: '/writing',
      query,
      title: `${tagName} on ${category.name}`,
      description: `Every Eightblock article about ${tagName} on ${category.name}, newest first.`,
    });
  }
  if (category) {
    return listingMetadata({
      path: '/writing',
      query,
      title: `${category.name} articles`,
      description:
        category.description ??
        `Every Eightblock article about ${category.name}: essays, tutorials and notes, newest first.`,
    });
  }
  if (tagName) {
    return listingMetadata({
      path: '/writing',
      query,
      title: `${tagName} articles`,
      description: `Every Eightblock article about ${tagName}: essays, tutorials and notes, newest first.`,
    });
  }
  return listingMetadata({
    path: '/writing',
    query,
    title: 'Articles',
    description:
      'Every essay, tutorial and note on web3, smart contracts and decentralized systems.',
  });
}

export default async function WritingPage({ searchParams }: Props) {
  const { tag, tagName, category, categories } = await resolveFilters(searchParams);
  return (
    <WritingView
      key={`${category?.slug ?? 'all'}:${tag ?? 'all'}`}
      tag={tag}
      tagName={tagName}
      category={category}
      categories={categories}
    />
  );
}
