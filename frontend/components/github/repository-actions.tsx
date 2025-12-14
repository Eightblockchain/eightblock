import Link from 'next/link';
import { Github, GitFork, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { githubService } from '@/lib/services/github-service';

export const RepositoryActions = () => {
  return (
    <div className="flex flex-wrap gap-4 mt-6">
      <Link href={githubService.getRepositoryUrl()} target="_blank" rel="noopener noreferrer">
        <Button variant="default" className="gap-2">
          <Github className="h-5 w-5" />
          View on GitHub
          <ExternalLink className="h-4 w-4" />
        </Button>
      </Link>

      <Link href={githubService.getForkUrl()} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="gap-2">
          <GitFork className="h-5 w-5" />
          Fork Repository
        </Button>
      </Link>

      <Link href={githubService.getIssuesUrl()} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="gap-2">
          <AlertCircle className="h-5 w-5" />
          View Issues
        </Button>
      </Link>
    </div>
  );
};
