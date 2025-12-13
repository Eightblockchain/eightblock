const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

// Fetch all tags
export async function fetchTags(): Promise<Tag[]> {
  const response = await fetch(`${API_URL}/tags`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }

  return response.json();
}

// Create a new tag
export async function createTag(data: { name: string; slug: string }): Promise<Tag> {
  const response = await fetch(`${API_URL}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tag');
  }

  return response.json();
}

// Delete a tag
export async function deleteTag(tagId: string): Promise<void> {
  const response = await fetch(`${API_URL}/tags/${tagId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tag');
  }
}
