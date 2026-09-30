import type { Prisma } from '@prisma/client';

/** Comments show as soon as they are posted; a moderator hides one by rejecting it. */
export const VISIBLE_COMMENTS = {
  status: { not: 'REJECTED' },
} satisfies Prisma.CommentWhereInput;
