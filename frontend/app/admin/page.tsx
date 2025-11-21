import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Admin',
};

const sections = [
  {
    title: 'Articles',
    description: 'Create, edit, and schedule blog posts. Drafts live in the backend CMS.',
    href: '/admin/articles',
  },
  {
    title: 'Taxonomy',
    description: 'Manage categories, tags, and featured topics.',
    href: '/admin/taxonomy',
  },
  {
    title: 'Engagement',
    description: 'Moderate comments, likes, and newsletter subscribers.',
    href: '/admin/engagement',
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header>
        <p className="text-sm text-primary/80">Internal tools</p>
        <h1 className="text-4xl font-bold">Admin Portal</h1>
        <p className="mt-3 text-muted-foreground">
          Authentication is handled by the backend API. This page is a placeholder until the admin UI is fully implemented.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.href}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={section.href}>View</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
