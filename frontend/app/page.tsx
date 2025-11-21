import { allPosts } from 'contentlayer/generated';
import { Hero } from '@/components/hero';
import { ArticleList } from '@/components/articles/article-list';
import { NewsletterSignup } from '@/components/newsletter-signup';

export default function HomePage() {
  const posts = allPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const featured = posts.filter((post) => post.isFeatured).slice(0, 3);

  return (
    <div className="space-y-16 py-10">
      <Hero />
      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-primary/80">Latest</p>
            <h2 className="text-2xl font-semibold">Featured knowledge drops</h2>
          </div>
        </div>
        <ArticleList posts={featured.length ? featured : posts.slice(0, 4)} />
      </section>
      <section className="mx-auto max-w-4xl px-4">
        <NewsletterSignup />
      </section>
    </div>
  );
}
