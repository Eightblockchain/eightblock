import Link from 'next/link';
import { Code, BookOpen } from 'lucide-react';
import { Card } from '@eightblock/ui/components/card';
import { GitHubRepository } from '@/types/github';

interface RepositoryHeaderProps {
  repo: GitHubRepository;
}

export const RepositoryHeader = ({ repo }: RepositoryHeaderProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="p-8 mb-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-2">{repo.full_name}</h2>
          <p className="text-muted-foreground text-lg mb-4">{repo.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {repo.topics.map((topic) => (
              <span
                key={topic}
                className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
        {repo.language && (
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span>
              Primary language: <strong>{repo.language}</strong>
            </span>
          </div>
        )}
        {repo.license && (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>
              License: <strong>{repo.license.name}</strong>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span>
            Updated: <strong>{formatDate(repo.updated_at)}</strong>
          </span>
        </div>
      </div>
    </Card>
  );
};
