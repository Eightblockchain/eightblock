import Link from 'next/link';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ErrorStateProps {
  message: string;
  linkUrl?: string;
  linkText?: string;
}

export const ErrorState = ({ message, linkUrl, linkText }: ErrorStateProps) => {
  return (
    <Card className="p-8 text-center border-destructive/40 bg-destructive/5">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <p className="text-destructive mb-4">{message}</p>
      {linkUrl && linkText && (
        <Link
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          {linkText}
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}
    </Card>
  );
};
