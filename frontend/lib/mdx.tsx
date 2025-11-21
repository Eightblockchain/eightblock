import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

export const mdxComponents: MDXComponents = {
  a: ({ href = '#', children, ...rest }) => (
    <Link
      href={href}
      {...rest}
      className="underline decoration-accent hover:text-primary"
    >
      {children}
    </Link>
  ),
  h2: ({ children }) => <h2 className="text-3xl font-bold mt-10 mb-4">{children}</h2>,
  p: ({ children }) => <p className="my-4 leading-7 text-muted-foreground">{children}</p>,
};
