import { allPosts } from 'contentlayer/generated';
import { Hero } from '@/components/hero';
import { ArticleCard } from '@/components/articles/article-card';

export default function HomePage() {
  const posts = allPosts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const featured = posts.filter((post) => post.isFeatured).slice(0, 3);
  const explore = posts.slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      <Hero />

      {/* Featured Articles */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-2xl font-bold text-[#080808]">Featured Articles</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {(featured.length ? featured : posts.slice(0, 3)).map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* Explore Articles */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-2xl font-bold text-[#080808]">Explore Articles</h2>
          <div className="space-y-6">
            {explore.map((post) => (
              <div key={post.slug} className="flex gap-6 border-b pb-6 last:border-b-0">
                <div className="flex-1">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    {post.category} ·{' '}
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · {post.readingTime} min read
                  </p>
                  <h3 className="mb-2 text-xl font-bold text-[#080808] hover:underline">
                    <a href={`/articles/${post.slug}`}>{post.title}</a>
                  </h3>
                  <p className="text-sm text-gray-600">{post.description}</p>
                </div>
                <div className="h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-400 to-purple-500">
                  {/* Image placeholder */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
