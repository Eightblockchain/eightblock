import { ApiError, fetcher } from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  /** Articles filed under it, drafts included. */
  articleCount: number;
}

export interface CategoryInput {
  name: string;
  description: string | null;
}

export function fetchCategories(): Promise<Category[]> {
  return fetcher('/categories/manage', { cache: 'no-store' });
}

export function createCategory(input: CategoryInput): Promise<Category> {
  return fetcher('/categories', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  return fetcher(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function deleteCategory(id: string): Promise<void> {
  await fetcher(`/categories/${id}`, { method: 'DELETE' }).catch((error) => {
    // 204 has no body to parse.
    if (!(error instanceof SyntaxError)) throw error;
  });
}

/** The array order becomes the display order on the blog and in the editor. */
export function reorderCategories(ids: string[]): Promise<Category[]> {
  return fetcher('/categories/order', { method: 'PUT', body: JSON.stringify({ ids }) });
}

/** The API's own message ("Cardano already exists"), when it sent one. */
export function apiMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.message.replace(/^API error: \d+ - /, '');
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    return typeof parsed.error === 'string' ? parsed.error : null;
  } catch {
    return null;
  }
}
