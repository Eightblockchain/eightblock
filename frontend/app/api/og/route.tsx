import { NextRequest } from 'next/server';
import { defaultOgCard, renderOgCard } from '@/lib/og-card';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = params.get('title');
  if (!title) return renderOgCard(defaultOgCard);

  return renderOgCard({
    title,
    description: params.get('description') ?? undefined,
    eyebrow: params.get('eyebrow') ?? undefined,
    topics: params.get('topics')?.split(',').filter(Boolean),
  });
}
