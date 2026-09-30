import Link from 'next/link';
import { Code, BookOpen, GitPullRequest, Users, ExternalLink } from 'lucide-react';
import { Card } from '@eightblock/ui/components/card';
import { githubService } from '@/lib/services/github-service';

const quickLinks = [
  {
    icon: GitPullRequest,
    title: 'Contribute',
    description: 'Read our contribution guidelines to learn how you can help improve EightBlock.',
    linkText: 'Read Guidelines',
    href: 'CONTRIBUTING.md',
  },
  {
    icon: Users,
    title: 'Contributors',
    description: 'Meet the amazing people who have contributed to making EightBlock better.',
    linkText: 'View Contributors',
    href: '/contributors',
    isInternal: true,
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Explore detailed documentation on setup, architecture, and API usage.',
    linkText: 'Read Docs',
    href: '#readme',
  },
  {
    icon: Code,
    title: 'Code of Conduct',
    description: 'Our commitment to fostering an inclusive and welcoming community.',
    linkText: 'Read Code of Conduct',
    href: 'CODE_OF_CONDUCT.md',
  },
];

export const QuickLinks = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {quickLinks.map(({ icon: Icon, title, description, linkText, href, isInternal }) => (
        <Card key={title} className="p-6 hover:shadow-lg transition-shadow">
          <Icon className="h-8 w-8 text-[#080808] dark:text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">{description}</p>
          {isInternal ? (
            <Link
              href={href}
              className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
            >
              {linkText}
              <ExternalLink className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={
                href.startsWith('#')
                  ? `${githubService.getRepositoryUrl()}${href}`
                  : githubService.getFileUrl(href)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
            >
              {linkText}
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </Card>
      ))}
    </div>
  );
};
