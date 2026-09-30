import Link from 'next/link';
import { cn } from '../utils';

interface BrandLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

export function BrandLink({ href, children, className, external }: BrandLinkProps) {
  const classes = cn(
    'text-brand-blue hover:underline underline-offset-4 transition-colors',
    className
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
