import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const PageHeader = ({ icon: Icon, title, description }: PageHeaderProps) => {
  return (
    <>
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to home
        </Link>
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{title}</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl">{description}</p>
      </div>
    </>
  );
};
