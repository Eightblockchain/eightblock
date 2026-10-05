import { Prisma } from '@prisma/client';

/** Categories as embedded in article payloads, main category first. */
export const articleCategories = {
  orderBy: { position: 'asc' as const },
  select: { category: { select: { id: true, name: true, slug: true } } },
};

/** "Cardano, Midnight", or null for an uncategorized article. */
export function categoryLabel(categories: { category: { name: string } }[]) {
  return categories.map((c) => c.category.name).join(', ') || null;
}

/** categoryLabel in SQL, for raw queries over an article aliased as a. */
export const CATEGORY_LABEL_SQL = Prisma.sql`(
  SELECT string_agg(c."name", ', ' ORDER BY ac."position")
  FROM "ArticleCategory" ac JOIN "Category" c ON c."id" = ac."categoryId"
  WHERE ac."articleId" = a."id"
)`;
